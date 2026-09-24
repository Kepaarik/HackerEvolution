/**
 * Русский словарь (источник истины для ключей локализации).
 */
const ru = {
  'app.title': 'Hacker Evolution',
  'app.description': 'Кликер игра про взлом и киберпреступность',

  'header.chapter': 'Глава {n}',

  'tabs.hack': 'Взлом',
  'tabs.generators': 'Генераторы',
  'tabs.upgrades': 'Апгрейды',
  'tabs.achievements': 'Достижения',

  'hack.button': 'ВЗЛОМАТЬ',

  'stats.money': 'Баланс',
  'stats.incomePerSec': '{value}/сек',
  'stats.clickPower': 'Сила клика: {value}',

  'generator.income': 'Доход: ${value}/сек',
  'generator.cost': 'Цена: ${value}',
  'generator.count': 'Куплено: {count}',
  'generator.buy': 'Купить',
  'generator.locked': 'Откроется после: {condition}',

  'upgrade.buy': 'Купить за ${cost}',
  'upgrade.purchased': 'Куплено',

  'achievement.unlocked': 'Достижение разблокировано: {name}!',

  'chapter.progress': 'Новая глава открыта: {n}',

  'common.off': 'выкл',
  'common.on': 'вкл',
  'common.settings': 'Настройки',
  'common.language': 'Язык',
} as const

export default ru
