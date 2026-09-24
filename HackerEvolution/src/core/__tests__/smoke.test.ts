/**
 * Смоук-тесты ядра Этапа 1 (EventBus, GameLoop, NumberFormatter, TimeUtils).
 * Запуск: npm run test:core
 * Тесты не требуют DOM-библиотек: GameLoop тестируется через mock requestAnimationFrame.
 */

import { EventBus } from '../EventBus'
import { GameLoop } from '../GameLoop'
import { formatNumber, formatMoney, parseFormatted, lettersSuffix, formatNumberWith } from '../../utils/NumberFormatter'
import { formatDuration, clampElapsed } from '../../utils/TimeUtils'

/* Объявление для Node-окружения без @types/node */
declare const process: { exit(code?: number): void }

let failures = 0
let passed = 0

function assert(cond: boolean, name: string): void {
  if (cond) {
    passed++
  } else {
    failures++
    console.error(`FAIL: ${name}`)
  }
}

function eq(actual: unknown, expected: unknown, name: string): void {
  assert(
    Object.is(actual, expected),
    `${name} (ожидалось: ${JSON.stringify(expected)}, получено: ${JSON.stringify(actual)})`,
  )
}

// ---------- EventBus ----------
{
  const bus = new EventBus<{ ping: { n: number }; empty: undefined }>()

  const calls: number[] = []
  const handler = (p: { n: number }) => calls.push(p.n)
  const off = bus.on('ping', handler)
  bus.emit('ping', { n: 1 })
  bus.emit('ping', { n: 2 })
  eq(calls.join(','), '1,2', 'EventBus: on/emit вызывает обработчики по порядку')

  off()
  bus.emit('ping', { n: 3 })
  eq(calls.join(','), '1,2', 'EventBus: отписка прекращает вызовы')

  let onceCount = 0
  bus.once('ping', () => onceCount++)
  bus.emit('ping', { n: 4 })
  bus.emit('ping', { n: 5 })
  eq(onceCount, 1, 'EventBus: once срабатывает ровно один раз')

  // Ошибка в обработчике не должна ломать остальные
  const bus2 = new EventBus<{ e: undefined }>()
  let secondRan = false
  bus2.on('e', () => {
    throw new Error('boom')
  })
  bus2.on('e', () => {
    secondRan = true
  })
  bus2.emit('e')
  assert(secondRan, 'EventBus: ошибка в одном обработчике не блокирует другие')

  eq(bus.listenerCount('ping'), 0, 'EventBus: listenerCount учитывает только активных (once уже сработал)')
  bus.clear()
  eq(bus.listenerCount('ping'), 0, 'EventBus: clear удаляет всех слушателей')

}

// ---------- GameLoop ----------
{
  // Мок requestAnimationFrame с управляемым временем
  let time = 0
  let rafId = 0
  const callbacks = new Map<number, (t: number) => void>()
  const g = globalThis as Record<string, unknown>
  g.requestAnimationFrame = (cb: (t: number) => void) => {
    callbacks.set(++rafId, cb)
    return rafId
  }
  g.cancelAnimationFrame = (id: number) => {
    callbacks.delete(id)
  }
  g.performance = { now: () => time }
  g.document = {
    visibilityState: 'visible',
    addEventListener() {},
    removeEventListener() {},
  }

  const loop = new GameLoop({ tickIntervalMs: 1000 })
  let ticks = 0
  let frames = 0
  loop.onTick(() => ticks++)
  loop.onFrame(() => frames++)

  loop.start()
  assert(loop.isRunning, 'GameLoop: start переводит в состояние running')

  // 4 кадра по ~925мс (всего 3.7с) => 3 экономических тика, 4 покадровых вызова
  for (let i = 0; i < 4; i++) {
    time += 925
    const cbs = [...callbacks.values()]
    callbacks.clear()
    for (const cb of cbs) cb(time)
  }
  eq(ticks, 3, 'GameLoop: тики считаются аккумулятором времени (3 из 3.7с)')
  eq(frames, 4, 'GameLoop: покадровые колбэки вызываются каждый кадр')

  loop.stop()
  assert(!loop.isRunning, 'GameLoop: stop останавливает цикл')
  eq(callbacks.size, 0, 'GameLoop: stop отменяет ожидающий RAF')
}

// ---------- NumberFormatter ----------
{
  eq(formatNumber(999), '999', 'formatNumber: <1000')
  eq(formatNumber(12_345), '12.35K', 'formatNumber: K-суффикс')
  eq(formatNumber(1_234_567), '1.23M', 'formatNumber: M-суффикс')
  eq(formatMoney(1234.5), '$1.23K', 'formatMoney: деньги с суффиксами')
  eq(formatMoney(12.5), '$12.50', 'formatMoney: деньги <1000 с копейками')
  eq(parseFormatted('12.35K'), 12350, 'parseFormatted: обратный парсинг')
  // Буквенная система сокращений (a/b/c...aa/ab...)
  eq(lettersSuffix(1), 'a', 'lettersSuffix: tier 1 -> a')
  eq(lettersSuffix(26), 'z', 'lettersSuffix: tier 26 -> z')
  eq(lettersSuffix(27), 'aa', 'lettersSuffix: tier 27 -> aa')
  eq(lettersSuffix(28), 'ab', 'lettersSuffix: tier 28 -> ab')
  eq(lettersSuffix(52), 'az', 'lettersSuffix: tier 52 -> az')
  eq(lettersSuffix(53), 'ba', 'lettersSuffix: tier 53 -> ba')
  eq(formatNumberWith(12_345, 'plain', 'letters'), '12.35a', 'letters: K-разряд -> a')
  eq(formatNumberWith(1e9, 'plain', 'letters'), '1.00d', 'letters: M-разряд (tier 3) -> d')
  eq(formatNumberWith(1e30, 'plain', 'letters'), '1.00j', 'letters: 1e30 (tier 10) -> j')
  eq(formatNumberWith(1e84, 'plain', 'letters'), '1.00ab', 'letters: 1e84 (tier 28) -> ab')
  eq(formatNumberWith(1e81, 'plain', 'letters'), '1.00aa', 'letters: 1e81 (tier 27) -> aa')
  eq(formatNumberWith(1e33, 'plain', 'classic'), '1.00e+33'.replace('+', ''), 'classic: выше Oc -> экспонента')
  eq(parseFormatted('12.35a'), 12350, 'parseFormatted: буквенный суффикс a')
  eq(parseFormatted('1.00aa'), 1e81, 'parseFormatted: двойной буквенный суффикс aa')
}

// ---------- TimeUtils ----------
{
  eq(formatDuration(90), '1м 30с', 'formatDuration: минуты/секунды')
  eq(formatDuration(3725), '1ч 2м', 'formatDuration: часы')
  eq(formatDuration(90061), '1д 1ч', 'formatDuration: дни')
  eq(clampElapsed(Date.now() + 10_000, 60), 0, 'clampElapsed: защита от перемотки назад')
  eq(clampElapsed(Date.now() - 999_999_000, 3600), 3600, 'clampElapsed: ограничение сверху')
}

console.log(`\nИтог: ${passed} passed, ${failures} failed`)
if (failures > 0) process.exit(1)
