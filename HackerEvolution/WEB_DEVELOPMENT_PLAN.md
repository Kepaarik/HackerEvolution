# План разработки веб-приложения Hacker Evolution

## Адаптированная версия для браузерных мобильных устройств

---

## 1. Общая концепция проекта

**Жанр:** Idle clicker / Incremental game
**Платформа:** Веб-приложение (PWA), адаптированное под мобильные браузеры
**Технологический стек:** HTML5, CSS3, JavaScript (ES6+), TypeScript (опционально)
**Ориентация:** Портретная (mobile-first)
**Визуальный стиль:** Пиксель-арт, адаптивный UI
**Целевая аудитория:** Казуальные игроки 16–35 лет
**Сеттинг:** Игрок начинает как гаражный хакер, строит хакерскую империю, эволюционирует в глобальный ИИ.

### Ключевые отличия от Unity-версии

- **Движок:** Чистый JavaScript/TypeScript вместо Unity
- **Рендеринг:** DOM + Canvas для анимаций вместо Unity UI
- **Хранение данных:** localStorage + IndexedDB вместо PlayerPrefs
- **Распространение:** PWA (Progressive Web App) с возможностью установки на домашний экран
- **Монетизация:** Web-based рекламные сети вместо мобильных SDK

---

## 2. Целевые показатели первой сессии

| Момент времени | Цель                                                 |
| -------------- | ---------------------------------------------------- |
| 0–2 мин        | Первый клик, покупка первого генератора              |
| 2–5 мин        | Понятный рост, 8–15 вычислений/сек                   |
| 5–10 мин       | Первый апгрейд, первая мини-игра как опция           |
| 10–20 мин      | Первая синергия, первый квест                        |
| 20–30 мин      | Мягкий потолок, желание купить новый тип генератора  |
| 30–45 мин      | Визуальная эволюция, тизер престижа                  |
| 45–60 мин      | Игрок понимает смысл престижа или возвращается позже |
| 3–5 часов      | Первый престиж при активной игре                     |

---

## 3. Технический стек

### 3.1. Основные технологии

```
Frontend:
├── HTML5 (семантическая разметка)
├── CSS3 (Flexbox, Grid, CSS Variables)
├── JavaScript ES6+ (модули, async/await)
├── TypeScript (рекомендуется для типизации)
└── Webpack/Vite (сборка и оптимизация)

Хранение данных:
├── localStorage (настройки, небольшие данные)
├── IndexedDB (основные сохранения игры)
└── Service Worker (кэширование, оффлайн-режим)

Анимации:
├── CSS Transitions/Animations (UI элементы)
├── Canvas API (частицы, всплывающие цифры)
└── requestAnimationFrame (игровой цикл)

Звук:
└── Web Audio API (звуковые эффекты, музыка)

Монетизация:
└── Google AdSense for Games / AdMob для веба

Аналитика:
└── Google Analytics 4 / Plausible / Fathom
```

### 3.2. Структура проекта

```
hacker-evolution-web/
├── index.html              # Основная HTML-страница
├── manifest.json           # PWA манифест
├── sw.js                   # Service Worker
├── src/
│   ├── main.js             # Точка входа
│   ├── core/
│   │   ├── GameLoop.js     # Игровой цикл
│   │   ├── EventBus.js     # Система событий
│   │   └── Constants.js    # Константы игры
│   ├── economy/
│   │   ├── EconomyService.js
│   │   ├── GeneratorService.js
│   │   ├── UpgradeService.js
│   │   ├── PrestigeService.js
│   │   └── BigNumber.js    # Работа с большими числами
│   ├── resources/
│   │   ├── ComputeResource.js
│   │   ├── DataResource.js
│   │   ├── CoresResource.js
│   │   └── FragmentsResource.js
│   ├── chapters/
│   │   ├── Chapter1.js     # Земля
│   │   ├── Chapter2.js     # Орбита
│   │   ├── Chapter3.js     # Солнечная система
│   │   └── Chapter4.js     # Межзвёздная экспансия
│   ├── minigames/
│   │   ├── MinigameManager.js
│   │   ├── PacketIntercept.js
│   │   ├── PasswordHack.js
│   │   ├── TrafficSort.js
│   │   └── BugPatch.js
│   ├── quests/
│   │   ├── QuestService.js
│   │   ├── DailyQuests.js
│   │   └── WeeklyQuests.js
│   ├── achievements/
│   │   └── AchievementService.js
│   ├── save/
│   │   ├── SaveService.js
│   │   ├── SaveMigration.js
│   │   └── SaveValidation.js
│   ├── ui/
│   │   ├── UIManager.js
│   │   ├── Components/
│   │   │   ├── Header.js
│   │   │   ├── ClickButton.js
│   │   │   ├── GeneratorList.js
│   │   │   ├── UpgradePanel.js
│   │   │   ├── Navigation.js
│   │   │   └── Modals.js
│   │   └── Animations/
│   │       ├── FloatingNumbers.js
│   │       └── ParticleEffects.js
│   ├── audio/
│   │   └── AudioService.js
│   ├── ads/
│   │   └── AdService.js
│   ├── analytics/
│   │   └── AnalyticsService.js
│   ├── utils/
│   │   ├── NumberFormatter.js
│   │   ├── TimeUtils.js
│   │   └── DeviceUtils.js
│   └── styles/
│       ├── main.css
│       ├── variables.css
│       ├── components.css
│       └── responsive.css
├── assets/
│   ├── images/
│   │   ├── generators/
│   │   ├── icons/
│   │   └── backgrounds/
│   ├── audio/
│   │   ├── sfx/
│   │   └── music/
│   └── fonts/
│       └── pixel-font.woff2
├── locales/
│   ├── ru.json
│   └── en.json
└── tests/
    ├── unit/
    └── e2e/
```

---

## 4. Этапы разработки

### Этап 1: Подготовка и архитектура (Недели 1-2)

#### Задачи:

- [ ] Настройка проекта (Webpack/Vite, ESLint, Prettier)
- [ ] Создание базовой HTML-структуры
- [ ] Настройка PWA (manifest.json, Service Worker)
- [ ] Создание системы событий (EventBus)
- [ ] Реализация игрового цикла (GameLoop)
- [ ] Настройка системы локализации
- [ ] Создание утилит форматирования чисел

#### Критерии приёмки:

- Проект собирается без ошибок
- PWA устанавливается на домашний экран
- Event Bus работает корректно
- Игровой цикл стабилен при 60 FPS

---

### Этап 2: Базовая экономика (Недели 3-4)

#### Задачи:

- [ ] Реализация ресурса "Вычисления" (ComputeResource)
- [ ] Создание системы клика (ClickService)
- [ ] Реализация базовых генераторов Главы 1
- [ ] Система покупки генераторов (1/10/25/MAX)
- [ ] Расчёт дохода в секунду (CPS)
- [ ] Сохранение и загрузка прогресса (localStorage)
- [ ] Базовый UI (верхняя панель, кнопка клика)

#### Критерии приёмки:

- Клик приносит вычисления
- Генераторы покупаются и дают доход
- Прогресс сохраняется между сессиями
- UI отображает актуальные значения

---

### Этап 3: Генераторы и апгрейды (Недели 5-6)

#### Задачи:

- [x] Все 5 генераторов Главы 1 с балансом из ТЗ
- [x] Система апгрейдов "Железо" (удвоение генераторов)
- [x] Система апгрейдов "Софт" (синергии)
- [x] Система апгрейдов "Ручной взлом" (клик)
- [x] Математика роста цен генераторов
- [x] Система синергий с лимитами
- [x] Критические клики (5% шанс, x10 множитель)
- [x] Отображение условий разблокировки генераторов

#### Критерии приёмки:

- Все генераторы работают по формулам из ТЗ
- Апгрейды применяются корректно
- Синергии имеют верхние пределы
- Криты работают только на ручных кликах

---

### Этап 4: Престиж-система (Недели 7-8)

#### Задачи:

- [ ] Ресурс "Квантовые ядра" (CoresResource)
- [ ] Формула расчёта ядер при престиже
- [ ] Экран престижа с предпросмотром наград
- [ ] Система престиж-апгрейдов ("Квантовые протоколы")
- [ ] Сохранение престиж-прогресса
- [ ] Сброс обычных ресурсов при престиже
- [ ] Визуальные эффекты престижа (глитч, распад)

#### Критерии приёмки:

- Престиж доступен при 1+ ядре
- Ядра рассчитываются по формуле √(заработано/1M)
- Престиж-апгрейды сохраняются после сброса
- Игрок понимает, что потеряет и получит

---

### Этап 5: Данные и мини-игры (Недели 9-11)

#### Задачи:

- [ ] Ресурс "Данные" (DataResource)
- [ ] Мини-игра "Перехват пакетов" (Canvas + touch)
- [ ] Мини-игра "Взлом пароля" (логика)
- [ ] Мини-игра "Сортировка трафика" (свайпы)
- [ ] Система наград за мини-игры
- [ ] Ежедневные квесты с наградой в Данных
- [ ] Достижения с наградой в Данных
- [ ] Лимиты на повторные прохождения

#### Критерии приёмки:

- Мини-игры адаптированы под touch-интерфейс
- Награда не превышает 10-15 минут пассивного дохода
- Данные не являются единственным путём прогресса
- Мини-игры длятся не более 40 секунд

---

### Этап 6: Главы 2-4 (Недели 12-14)

#### Задачи:

- [ ] Глава 2: Орбита (спутники, станции, лунный дата-центр)
- [ ] Пассивная добыча Данных в Главе 2
- [ ] Глава 3: Солнечная система (Марс, астероиды, Дайсон)
- [ ] Глава 4: Межзвёздная экспансия
- [ ] Условия открытия глав (престижи, Данные, фрагменты)
- [ ] Визуальная эволюция фона
- [ ] Новые генераторы с увеличенными ценами

#### Критерии приёмки:

- Главы открываются по условиям из ТЗ
- Баланс доходов соответствует таблице
- Визуальный стиль меняется с прогрессом

---

### Этап 7: Фрагменты и эндгейм (Недели 15-16)

#### Задачи:

- [ ] Ресурс "Фрагменты исходного кода" (FragmentsResource)
- [ ] Система сбора фрагментов (100 всего)
- [ ] Еженедельные квесты с фрагментами
- [ ] Условие Сингулярности (100 фрагментов)
- [ ] Финальная сцена
- [ ] New Game+ "Трансцендентность"
- [ ] Модификаторы сложности

#### Критерии приёмки:

- 100 фрагментов собираются из всех источников
- Сингулярность открывается при 100%
- New Game+ сохраняет косметику и достижения

---

### Этап 8: Оффлайн-прогресс (Неделя 17)

#### Задачи:

- [ ] Расчёт оффлайн-дохода по формуле из ТЗ
- [ ] Лимиты оффлайна (2ч / 8ч / 24ч / безлимит)
- [ ] Экран получения оффлайн-награды
- [ ] Интеграция вознаграждаемой рекламы (×2)
- [ ] Защита от перемотки времени
- [ ] Сохранение времени последнего выхода

#### Критерии приёмки:

- Оффлайн-доход считается корректно
- Реклама удваивает награду
- Перемотка времени назад блокирует доход

---

### Этап 9: Механики риска (Неделя 18)

#### Задачи:

- [ ] Система "Слежка" (SurveillanceService)
- [ ] Система "Перегрев" (OverheatService)
- [ ] Теневой рынок с контрактами
- [ ] Престиж-апгрейд "Модуль разгона"
- [ ] События "Файрвол" при высокой слежке
- [ ] Способы снижения рисков

#### Критерии приёмки:

- Слежка влияет на доход по уровням
- Разгон даёт ×3 но повышает температуру
- Контракты имеют риск и награду

---

### Этап 10: UI/UX и адаптивность (Неделя 19)

#### Задачи:

- [ ] Адаптивная вёрстка (mobile-first)
- [ ] Навигация: 4 таба (Главная, Магазин, Задания, Меню)
- [ ] Безопасные зоны для вырезов экрана
- [ ] Минимальный размер кнопок 44×44 dp
- [ ] Поддержка жестов браузера
- [ ] Настройки доступности (уменьшение эффектов)
- [ ] Цветовая слепота (не только красный/зелёный)

#### Критерии приёмки:

- Интерфейс работает на экранах 320px–768px
- Все кнопки в зоне большого пальца
- Вырезы камеры не перекрывают UI
- Настройки доступности работают

---

### Этап 11: Аудио и тактильность (Неделя 20)

#### Задачи:

- [ ] Web Audio API для звуков
- [ ] Звуки: клик, покупка, ошибка, крит, победа
- [ ] Фоновая музыка (опционально)
- [ ] Vibration API для тактильной отдачи
- [ ] Настройки громкости и вибрации
- [ ] Отключение звука в фоне (экономия батареи)

#### Критерии приёмки:

- Все звуки воспроизводятся корректно
- Вибрация работает на поддерживаемых устройствах
- Настройки сохраняются

---

### Этап 12: Сохранения и защита (Неделя 21)

#### Задачи:

- [ ] IndexedDB для основных сохранений
- [ ] JSON-сериализация с версионированием
- [ ] Контрольная сумма сохранений (HMAC)
- [ ] Шифрование чувствительных данных
- [ ] Миграция старых сохранений
- [ ] Резервные копии в localStorage
- [ ] Автосохранение каждые 30-60 секунд

#### Критерии приёмки:

- Сохранение переживает перезагрузку страницы
- Старые сейвы мигрируют на новую версию
- Читы с редактированием обнаруживаются

---

### Этап 13: Монетизация и реклама (Неделя 22)

#### Задачи:

- [ ] Интеграция Google AdSense for Games
- [ ] Размещения: оффлайн ×2, бонусы, мини-игры
- [ ] Лимиты: 1 реклама в 2-3 минуты, 10-12 в сутки
- [ ] Fallback при отсутствии рекламы
- [ ] Consent-механизм для GDPR
- [ ] Настройка отключения персонализации

#### Критерии приёмки:

- Реклама только rewarded video
- Лимиты соблюдаются
- При загрузке реклама не блокирует игру

---

### Этап 14: Аналитика и Remote Config (Неделя 23)

#### Задачи:

- [ ] Google Analytics 4 / альтернатива
- [ ] События онбординга
- [ ] Экономические события
- [ ] События престижа и рекламы
- [ ] Remote Config для баланса (Firebase)
- [ ] Локальные значения по умолчанию
- [ ] Валидация удалённых значений

#### Критерии приёмки:

- Все ключевые события отправляются
- Remote Config может изменить баланс без обновления
- Отрицательные значения отклоняются

---

### Этап 15: Оптимизация и тестирование (Недели 24-25)

#### Задачи:

- [ ] Object Pooling для частиц и цифр
- [ ] Оптимизация обновлений UI
- [ ] Минимизация перерисовок
- [ ] Тесты на разных устройствах
- [ ] Проверка больших чисел
- [ ] Тесты перемотки времени
- [ ] Проверка потери соединения
- [ ] Нагрузочное тестирование (30+ минут)

#### Критерии приёмки:

- 60 FPS на средних устройствах
- Загрузка до 5 секунд
- Нет утечек памяти за 30 минут
- Большие числа отображаются корректно

---

### Этап 16: Локализация и запуск (Неделя 26)

#### Задачи:

- [ ] Русский язык (полный)
- [ ] Английский язык (полный)
- [ ] Форматирование чисел по локали
- [ ] Пиксельный шрифт с кириллицей
- [ ] Финальное тестирование
- [ ] Развёртывание на хостинге
- [ ] Настройка домена и HTTPS
- [ ] Публикация PWA

#### Критерии приёмки:

- Оба языка работают без ошибок
- Игра доступна по HTTPS
- PWA устанавливается на устройства

---

## 5. Детальная реализация ключевых систем

### 5.1. Игровой цикл

```javascript
// GameLoop.js
class GameLoop {
  constructor() {
    this.lastTick = Date.now();
    this.accumulatedTime = 0;
    this.TICK_INTERVAL = 1000; // 1 секунда
    this.isRunning = false;
  }

  start() {
    this.isRunning = true;
    this.loop();
  }

  stop() {
    this.isRunning = false;
  }

  loop() {
    if (!this.isRunning) return;

    const now = Date.now();
    const deltaTime = now - this.lastTick;
    this.lastTick = now;

    this.accumulatedTime += deltaTime;

    // Экономический тик каждую секунду
    while (this.accumulatedTime >= this.TICK_INTERVAL) {
      EconomyService.addIncome();
      this.accumulatedTime -= this.TICK_INTERVAL;
    }

    // Рендеринг каждый кадр
    UIManager.update();
    AnimationService.update();

    requestAnimationFrame(() => this.loop());
  }
}
```

### 5.2. Работа с большими числами

```javascript
// BigNumber.js
class BigNumber {
  constructor(value = 0) {
    this.value = typeof value === "number" ? value : parseFloat(value);
  }

  add(other) {
    return new BigNumber(this.value + other.value);
  }

  multiply(other) {
    return new BigNumber(this.value * other.value);
  }

  format() {
    return NumberFormatter.format(this.value);
  }

  toString() {
    return this.value.toString();
  }
}

// NumberFormatter.js
class NumberFormatter {
  static suffixes = ["", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc"];

  static format(num) {
    if (num < 1000) return Math.floor(num).toLocaleString();

    const tier = Math.floor(Math.log10(num) / 3);
    if (tier >= this.suffixes.length) {
      return num.toExponential(2);
    }

    const scaled = num / Math.pow(1000, tier);
    return scaled.toFixed(2) + this.suffixes[tier];
  }
}
```

### 5.3. Система событий

```javascript
// EventBus.js
class EventBus {
  constructor() {
    this.events = {};
  }

  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter((cb) => cb !== callback);
  }

  emit(event, data) {
    if (!this.events[event]) return;
    this.events[event].forEach((callback) => callback(data));
  }
}

// Использование
const eventBus = new EventBus();

// События из ТЗ
const EVENTS = {
  COMPUTE_CHANGED: "computeChanged",
  DATA_CHANGED: "dataChanged",
  CORES_CHANGED: "coresChanged",
  CPS_CHANGED: "cpsChanged",
  GENERATOR_BOUGHT: "generatorBought",
  UPGRADE_BOUGHT: "upgradeBought",
  PRESTIGE_COMPLETED: "prestigeCompleted",
  MINIGAME_STARTED: "minigameStarted",
  MINIGAME_COMPLETED: "minigameCompleted",
  QUEST_COMPLETED: "questCompleted",
  ACHIEVEMENT_UNLOCKED: "achievementUnlocked",
  OFFLINE_REWARD: "offlineReward",
  SETTINGS_CHANGED: "settingsChanged",
};
```

### 5.4. Сохранение данных

```javascript
// SaveService.js
class SaveService {
  constructor() {
    this.DB_VERSION = 1;
    this.DB_NAME = "HackerEvolutionDB";
    this.STORE_NAME = "saveData";
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          db.createObjectStore(this.STORE_NAME);
        }
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve();
      };

      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  }

  async save(gameState) {
    const transaction = this.db.transaction([this.STORE_NAME], "readwrite");
    const store = transaction.objectStore(this.STORE_NAME);

    const saveData = {
      version: this.DB_VERSION,
      timestamp: Date.now(),
      checksum: this.calculateChecksum(gameState),
      gameState,
    };

    await new Promise((resolve, reject) => {
      const request = store.put(saveData, "currentSave");
      request.onsuccess = resolve;
      request.onerror = reject;
    });

    // Резервная копия в localStorage
    localStorage.setItem("he_backup", JSON.stringify(saveData));

    eventBus.emit(EVENTS.SAVE_COMPLETED);
  }

  async load() {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.STORE_NAME], "readonly");
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.get("currentSave");

      request.onsuccess = (event) => {
        const saveData = event.target.result;
        if (!saveData) {
          resolve(null);
          return;
        }

        // Проверка контрольной суммы
        if (!this.verifyChecksum(saveData.data, saveData.checksum)) {
          console.warn("Save file corrupted, trying backup...");
          resolve(this.loadBackup());
          return;
        }

        resolve(saveData.data);
      };

      request.onerror = reject;
    });
  }

  calculateChecksum(data) {
    const json = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < json.length; i++) {
      const char = json.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }

  verifyChecksum(data, checksum) {
    return this.calculateChecksum(data) === checksum;
  }

  loadBackup() {
    const backup = localStorage.getItem("he_backup");
    if (backup) {
      try {
        return JSON.parse(backup).data;
      } catch (e) {
        console.error("Backup corrupted");
        return null;
      }
    }
    return null;
  }
}
```

### 5.5. Адаптивный UI

```css
/* variables.css */
:root {
  --color-compute: #00FF41;
  --color- #7C4DFF;
  --color-cores: #FFA500;
  --color-danger: #FF5252;
  --color-minigame: #00BFFF;

  --safe-area-top: env(safe-area-inset-top, 20px);
  --safe-area-bottom: env(safe-area-inset-bottom, 20px);
  --safe-area-left: env(safe-area-inset-left, 0);
  --safe-area-right: env(safe-area-inset-right, 0);

  --touch-target-min: 44px;
  --font-pixel: 'Press Start 2P', cursive;
}

/* responsive.css */
@media (max-width: 374px) {
  /* Очень маленькие экраны */
  .generator-card {
    flex-direction: column;
    padding: 8px;
  }

  .click-button {
    width: 120px;
    height: 120px;
  }
}

@media (min-width: 375px) and (max-width: 767px) {
  /* Стандартные мобильные */
  .generator-card {
    padding: 12px;
  }

  .click-button {
    width: 160px;
    height: 160px;
  }
}

@media (min-width: 768px) {
  /* Планшеты */
  .main-container {
    max-width: 768px;
    margin: 0 auto;
  }
}

/* Общие стили для touch */
* {
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

.button {
  min-height: var(--touch-target-min);
  min-width: var(--touch-target-min);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 12px 16px;
}

/* Safe areas */
.header {
  padding-top: var(--safe-area-top);
}

.bottom-nav {
  padding-bottom: var(--safe-area-bottom);
}

.container {
  padding-left: var(--safe-area-left);
  padding-right: var(--safe-area-right);
}
```

---

## 6. Критерии приёмки (из ТЗ)

Игра считается готовой к мягкому запуску, если:

1. ✅ Первая сессия понятна без обучения текстом более 3 подсказок
2. ✅ Игрок покупает первый генератор менее чем за 60 секунд
3. ✅ Первый апгрейд появляется в течение 2–4 минут
4. ✅ Мини-игра не обязательна для базового прогресса
5. ✅ Первый престиж достижим за 3–5 часов активной игры
6. ✅ Престиж не вызывает ощущения ошибки
7. ✅ Оффлайн-доход считается корректно после сворачивания
8. ✅ Сохранение переживает убийство приложения (закрытие вкладки)
9. ✅ Реклама не блокирует прогресс
10. ✅ Экономика не ломается автокликом, критом и синергиями
11. ✅ Приложение стабильно работает на среднем устройстве
12. ✅ Нет критических утечек памяти за 30 минут игры
13. ✅ Все ключевые события аналитики отправляются
14. ✅ Рекламные согласия работают (GDPR)
15. ✅ Игра корректно отображается на экранах с вырезом

---

## 7. Риски и решения

| Риск                                     | Решение                                                    |
| ---------------------------------------- | ---------------------------------------------------------- |
| Производительность на слабых устройствах | Object pooling, ленивая загрузка, отключение эффектов      |
| Потеря данных при закрытии вкладки       | Автосохранение, IndexedDB, резервные копии                 |
| Блокировщики рекламы                     | Fallback-механики, не блокировать прогресс                 |
| Разные размеры экранов                   | Mobile-first CSS, тесты на популярных разрешениях          |
| Проблемы с аудио в Safari                | User gesture required, fallback на визуальные эффекты      |
| Читы через консоль                       | Валидация сохранений, серверная проверка критичных событий |
| Перемотка времени                        | Проверка timestamp, блокировка оффлайн-дохода              |

---

## 8. MVP (Минимально жизнеспособный продукт)

### Входит в MVP:

- [ ] Глава 1 (5 генераторов)
- [ ] Система клика с критом
- [ ] Система апгрейдов (Железо, Софт, Ручной взлом)
- [ ] Базовые синергии
- [ ] Престиж с квантовыми ядрами
- [ ] 3 мини-игры
- [ ] Оффлайн-доход
- [ ] Вознаграждаемая реклама
- [ ] Ежедневные квесты
- [ ] 15–20 достижений
- [ ] Локальные сохранения
- [ ] Русский и английский языки

### Не входит в MVP (откладывается):

- [ ] Главы 2, 3, 4
- [ ] Все 10 мини-игр
- [ ] Теневой рынок
- [ ] Перегрев и слежка
- [ ] New Game+
- [ ] Сезонные события
- [ ] Расширенная косметика

---

## 9. Roadmap после MVP

### Обновление 1.1 (Месяц 7)

- Глава 2: Орбита
- Пассивная добыча Данных
- 2 новые мини-игры
- Косметические темы

### Обновление 1.2 (Месяц 8)

- Глава 3: Солнечная система
- Система слежки
- Теневой рынок
- Еженедельные события

### Обновление 1.3 (Месяц 9)

- Глава 4: Межзвёздная экспансия
- Фрагменты исходного кода (100%)
- Сингулярность
- New Game+ "Трансцендентность"

---

## 10. Итого

**Общее время разработки:** 26 недель (~6 месяцев)

**Команда (минимальная):**

- 1 Frontend-разработчик (JavaScript/TypeScript)
- 1 UI/UX дизайнер (пиксель-арт, адаптивный дизайн)
- 1 Геймдизайнер (баланс экономики)
- 1 QA-инженер (тестирование на устройствах)

**Бюджет (ориентировочно):**

- Разработка: 6 человеко-месяцев
- Дизайн и арт: 2-3 человеко-месяца
- Хостинг и домен: $10-50/месяц
- Сервисы (аналитика, реклама): бесплатно до масштаба

**Ключевые преимущества веб-версии:**

- Не требует публикации в сторах
- Мгновенный доступ по ссылке
- Легче обновлять (без модерации)
- Кроссплатформенность (iOS, Android, Desktop)
- PWA позволяет установку на домашний экран

---

_Документ составлен на основе технического задания Hacker Evolution (Specification.md)_
_Версия плана: 1.0_
_Дата: 2026_
