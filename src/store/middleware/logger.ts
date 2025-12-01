/**
 * Logger Middleware
 * Optional middleware for debugging store state changes
 * Only active in development mode
 */

import type { StateCreator, StoreMutatorIdentifier } from 'zustand'

type Logger = <
  T,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = [],
>(
  f: StateCreator<T, Mps, Mcs>,
  name?: string
) => StateCreator<T, Mps, Mcs>

type LoggerImpl = <T>(f: StateCreator<T, [], []>, name?: string) => StateCreator<T, [], []>

const loggerImpl: LoggerImpl = (f, name) => (set, get, store) => {
  const loggedSet: typeof set = (...args) => {
    // Only log in development
    if (process.env.NODE_ENV === 'development') {
      const prevState = get()
      set(...args)
      const nextState = get()

      console.group(
        `%c[Zustand] ${name || 'Store'} @ ${new Date().toLocaleTimeString()}`,
        'color: #9E9E9E; font-weight: bold;'
      )
      console.log('%cprev state', 'color: #9E9E9E; font-weight: bold;', prevState)
      console.log('%cnext state', 'color: #4CAF50; font-weight: bold;', nextState)
      console.groupEnd()
    } else {
      set(...args)
    }
  }

  return f(loggedSet, get, store)
}

export const logger = loggerImpl as Logger
