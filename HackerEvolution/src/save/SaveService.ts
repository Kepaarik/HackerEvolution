import type { GameState } from '../types'
import { SaveValidation } from './SaveValidation'
import { migrateState } from './SaveMigration'

const DB_NAME = 'HackerEvolutionDB'
const DB_VERSION = 2
const STORE_NAME = 'saves'
const SAVE_KEY = 'current_save'
const AUTOSAVE_INTERVAL = 30000 // 30 секунд

class SaveService {
  private db: IDBDatabase | null = null
  private autosaveTimer: ReturnType<typeof setInterval> | null = null
  private currentState: GameState | null = null

  /**
   * Инициализация IndexedDB
   */
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        }
      }

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result
        resolve()
      }

      request.onerror = () => {
        console.error('SaveService: Failed to open IndexedDB')
        reject(new Error('IndexedDB not available'))
      }
    })
  }

  /**
   * Сохранение состояния игры
   */
  async save(state: GameState): Promise<void> {
    if (!this.db) {
      await this.init()
    }

    try {
      const saveData = {
        id: SAVE_KEY,
        version: DB_VERSION,
        timestamp: Date.now(),
        checksum: SaveValidation.calculateChecksum(state),
        data: state,
      }

      const transaction = this.db!.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)

      await new Promise<void>((resolve, reject) => {
        const request = store.put(saveData)
        request.onsuccess = () => resolve()
        request.onerror = () => reject(new Error('Save failed'))
      })

      // Резервная копия в localStorage
      this.createBackup(state)
      this.currentState = state
    } catch (error) {
      console.error('SaveService: Save error', error)
      // Fallback на localStorage
      this.saveToLocalStorage(state)
    }
  }

  /**
   * Загрузка состояния игры
   */
  async load(): Promise<GameState | null> {
    if (!this.db) {
      await this.init()
    }

    try {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)

      const saveData = await new Promise<any>((resolve, reject) => {
        const request = store.get(SAVE_KEY)
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(new Error('Load failed'))
      })

      if (!saveData) {
        return this.loadFromBackup()
      }

      // Проверка контрольной суммы
      if (!SaveValidation.verifyChecksum(saveData.data, saveData.checksum)) {
        console.warn('SaveService: Checksum mismatch, trying backup...')
        return this.loadFromBackup()
      }

      // Миграция старых сохранений
      const migrated = migrateState(saveData.data)
      return migrated
    } catch (error) {
      console.error('SaveService: Load error', error)
      return this.loadFromBackup()
    }
  }

  /**
   * Создание резервной копии в localStorage
   */
  private createBackup(state: GameState): void {
    try {
      const backup = {
        version: DB_VERSION,
        timestamp: Date.now(),
        checksum: SaveValidation.calculateChecksum(state),
        data: state,
      }
      localStorage.setItem('he_backup_save', JSON.stringify(backup))
    } catch (e) {
      // localStorage может быть полон или недоступен
    }
  }

  /**
   * Загрузка из резервной копии
   */
  private loadFromBackup(): GameState | null {
    try {
      const backup = localStorage.getItem('he_backup_save')
      if (!backup) return null

      const parsed = JSON.parse(backup)
      if (!SaveValidation.verifyChecksum(parsed.data, parsed.checksum)) {
        console.warn('SaveService: Backup checksum mismatch')
        return null
      }

      return migrateState(parsed.data)
    } catch (e) {
      return null
    }
  }

  /**
   * Fallback сохранение в localStorage
   */
  private saveToLocalStorage(state: GameState): void {
    try {
      const data = {
        version: DB_VERSION,
        timestamp: Date.now(),
        checksum: SaveValidation.calculateChecksum(state),
        data: state,
      }
      localStorage.setItem('he_fallback_save', JSON.stringify(data))
    } catch (e) {
      console.error('SaveService: localStorage fallback failed')
    }
  }

  /**
   * Запуск автосохранения
   */
  startAutosave(getState: () => GameState): void {
    this.stopAutosave()
    this.autosaveTimer = setInterval(() => {
      const state = getState()
      this.save(state)
    }, AUTOSAVE_INTERVAL)
  }

  /**
   * Остановка автосохранения
   */
  stopAutosave(): void {
    if (this.autosaveTimer) {
      clearInterval(this.autosaveTimer)
      this.autosaveTimer = null
    }
  }

  /**
   * Сохранение при закрытии/сворачивании
   */
  saveOnExit(state: GameState): void {
    this.save(state)
    // navigator.sendBeacon для надёжности (если есть сервер)
  }

  /**
   * Полная очистка сохранений (сброс прогресса)
   */
  async clearAll(): Promise<void> {
    if (!this.db) {
      await this.init()
    }

    try {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      store.delete(SAVE_KEY)
      localStorage.removeItem('he_backup_save')
      localStorage.removeItem('he_fallback_save')
    } catch (e) {
      console.error('SaveService: Clear failed', e)
    }
  }
}

// Экземпляр-синглтон
export const saveService = new SaveService()
