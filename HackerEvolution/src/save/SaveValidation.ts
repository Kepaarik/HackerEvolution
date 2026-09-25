/**
 * Валидация сохранений: контрольные суммы и защита от подделки.
 * ТЗ раздел 39.3: HMAC, проверка аномальных значений.
 */

const SECRET = 'HackerEvolution_2026_SecretKey' // В продакшене хранить на сервере

export class SaveValidation {
  /**
   * Расчёт контрольной суммы (упрощённый HMAC)
   */
  static calculateChecksum(data: any): string {
    const json = JSON.stringify(data)
    const combined = json + SECRET

    let hash = 0x811c9dc5 // FNV offset basis
    for (let i = 0; i < combined.length; i++) {
      hash ^= combined.charCodeAt(i)
      hash = Math.imul(hash, 0x01000193) // FNV prime
      hash = hash >>> 0 // Unsigned 32-bit
    }

    return hash.toString(36) + '_' + json.length.toString(36)
  }

  /**
   * Проверка контрольной суммы
   */
  static verifyChecksum(data: any, checksum: string): boolean {
    if (!checksum || typeof checksum !== 'string') return false
    const calculated = this.calculateChecksum(data)
    return calculated === checksum
  }

  /**
   * Валидация аномальных значений (защита от читов)
   */
  static validateState(data: any): boolean {
    if (!data || typeof data !== 'object') return false

    // Проверка основных числовых полей
    const numericFields = [
      'money',
      'totalEarned',
      'totalEarnedThisRun',
      'quantumCores',
      'data',
      'fragments',
      'clickCount',
      'prestigeCount',
      'generatorsOwned',
    ]

    for (const field of numericFields) {
      if (data[field] !== undefined) {
        if (typeof data[field] !== 'number' || isNaN(data[field]) || data[field] < 0) {
          console.warn(`SaveValidation: Invalid ${field}:`, data[field])
          return false
        }
      }
    }

    // Проверка что деньги не больше заработанного (грубая античит-проверка)
    if (data.money > data.totalEarned * 2 && data.totalEarned > 0) {
      console.warn('SaveValidation: Suspicious money amount')
      // Не блокируем, но логируем
    }

    // Проверка количества генераторов
    if (data.generators && typeof data.generators === 'object') {
      for (const [key, value] of Object.entries(data.generators)) {
        if (typeof value !== 'number' || value < 0 || value > 100000) {
          console.warn(`SaveValidation: Suspicious generator count: ${key} = ${value}`)
          return false
        }
      }
    }

    // Проверка фрагментов (не может быть больше 100)
    if (data.fragments > 100) {
      console.warn('SaveValidation: Fragments > 100')
      return false
    }

    // Проверка квантовых ядер
    if (data.quantumCores > 10000) {
      console.warn('SaveValidation: Suspicious cores amount')
      return false
    }

    return true
  }

  /**
   * Проверка времени (защита от перемотки)
   */
  static validateTime(lastSaveTime: number): boolean {
    const now = Date.now()

    // Время сохранения не может быть в будущем (допустимо 5 минут разницы)
    if (lastSaveTime > now + 5 * 60 * 1000) {
      console.warn('SaveValidation: Save time is in the future')
      return false
    }

    // Время не может быть слишком старым (больше 1 года)
    if (lastSaveTime < now - 365 * 24 * 60 * 60 * 1000) {
      console.warn('SaveValidation: Save time too old')
      return false
    }

    return true
  }

  /**
   * Полная валидация загруженного сохранения
   */
  static fullValidation(data: any, checksum: string): boolean {
    if (!this.verifyChecksum(data, checksum)) {
      return false
    }
    if (!this.validateState(data)) {
      return false
    }
    if (data.lastSaveTime && !this.validateTime(data.lastSaveTime)) {
      return false
    }
    return true
  }
}
