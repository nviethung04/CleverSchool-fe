'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useCallback, useMemo } from 'react'

type UpdateParams = Record<string, string | number | null | undefined>

export function useTabQueryString(tabName: string) {
  const searchParams = useSearchParams()
  const router = useRouter()

  // Tạo key với prefix - memoize để không tạo lại mỗi lần render
  const createKey = useCallback((key: string) => `${tabName}_${key}`, [tabName])
  
  // Lấy value với prefix - memoize để giữ reference ổn định
  const getValue = useCallback((key: string): string | null => {
    return searchParams.get(createKey(key))
  }, [searchParams, createKey])

  // Set nhiều params - memoize để giữ reference ổn định
  const setParams = useCallback((params: UpdateParams) => {
    const newParams = new URLSearchParams(searchParams.toString())
    
    Object.entries(params).forEach(([key, value]) => {
      const prefixedKey = createKey(key)
      if (value === null || value === undefined || value === '') {
        newParams.delete(prefixedKey)
      } else {
        newParams.set(prefixedKey, String(value))
      }
    })
    
    router.replace(`?${newParams.toString()}`, { scroll: false })
  }, [searchParams, router, createKey])

  // Set value với prefix - memoize
  const setValue = useCallback((key: string, value: string | number | null | undefined) => {
    const newParams = new URLSearchParams(searchParams.toString())
    const prefixedKey = createKey(key)
    
    if (value === null || value === undefined || value === '') {
      newParams.delete(prefixedKey)
    } else {
      newParams.set(prefixedKey, String(value))
    }
    
    router.replace(`?${newParams.toString()}`, { scroll: false })
  }, [searchParams, router, createKey])

  // Clear params của tab này - memoize
  const clearParams = useCallback((keys: string[]) => {
    const newParams = new URLSearchParams(searchParams.toString())
    keys.forEach(key => {
      newParams.delete(createKey(key))
    })
    router.replace(`?${newParams.toString()}`, { scroll: false })
  }, [searchParams, router, createKey])

  return {
    getValue,
    setValue,
    setParams,
    clearParams,
    searchParams
  }
}

