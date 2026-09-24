/**
 * Английский словарь. Тип проверяется против ru — при пропуске ключа сборка упадёт.
 */
import type ru from './ru'

const en: Record<keyof typeof ru, string> = {
  'app.title': 'Hacker Evolution',
  'app.description': 'A clicker game about hacking and cybercrime',

  'header.chapter': 'Chapter {n}',

  'tabs.hack': 'Hack',
  'tabs.generators': 'Generators',
  'tabs.upgrades': 'Upgrades',
  'tabs.achievements': 'Achievements',

  'hack.button': 'HACK',

  'stats.money': 'Balance',
  'stats.incomePerSec': '{value}/sec',
  'stats.clickPower': 'Click power: {value}',

  'generator.income': 'Income: ${value}/sec',
  'generator.cost': 'Cost: ${value}',
  'generator.count': 'Owned: {count}',
  'generator.buy': 'Buy',
  'generator.locked': 'Unlocks after: {condition}',

  'upgrade.buy': 'Buy for ${cost}',
  'upgrade.purchased': 'Purchased',

  'achievement.unlocked': 'Achievement unlocked: {name}!',

  'chapter.progress': 'New chapter unlocked: {n}',

  'common.off': 'off',
  'common.on': 'on',
  'common.settings': 'Settings',
  'common.language': 'Language',
}

export default en
