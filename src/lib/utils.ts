import type { ClassValue } from 'clsx'
import { clsx } from 'clsx'
import jsLevenshtein from 'js-levenshtein'
import { useCallback, useState } from 'react'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function levenshtein(a: string, b: string): number {
  return jsLevenshtein(a, b)
}

export function useQueryState(key: string, defaultValue: string = '') {
  const [value, setValue] = useState(() => {
    if (typeof window === 'undefined')
      return defaultValue
    return new URLSearchParams(window.location.search).get(key) || defaultValue
  })

  const setQueryValue = useCallback((newValue: string | null) => {
    setValue(newValue || defaultValue)
    const url = new URL(window.location.href)
    if (newValue && newValue !== defaultValue) {
      url.searchParams.set(key, newValue)
    }
    else {
      url.searchParams.delete(key)
    }
    window.history.pushState({}, '', url)
  }, [key, defaultValue])

  return [value, setQueryValue] as const
}
