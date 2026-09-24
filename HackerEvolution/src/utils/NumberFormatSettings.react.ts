/**
 * React-слой над NumberFormatSettings: реактивный хук useNumberSuffixSystem().
 * Отделён от самого модуля настроек, чтобы ядро (NumberFormatter и node-тесты)
 * не зависело от React.
 */

import { useSyncExternalStore } from 'react'
import {
  getNumberSuffixSystem,
  subscribeToNumberSuffixSystem,
  type NumSuffixSystem,
} from './NumberFormatSettings'

/** React-хук: реактивная текущая система сокращений. */
export function useNumberSuffixSystem(): NumSuffixSystem {
  return useSyncExternalStore(subscribeToNumberSuffixSystem, getNumberSuffixSystem, getNumberSuffixSystem)
}
