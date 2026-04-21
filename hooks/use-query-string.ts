'use client'

import { useRouter, useSearchParams } from 'next/navigation'

type UpdateParams =
  | Record<string, string | number | null | undefined>
  | ((params: URLSearchParams) => void)

export function useQueryString() {
  const searchParams = useSearchParams()
  const router = useRouter()

  /**
   * Update nhiều query params trong 1 lần push
   */
  const setQueryParams = (update: UpdateParams) => {
    const newParams = new URLSearchParams(searchParams.toString())

    if (typeof update === 'function') {
      update(newParams)
    } else {
      Object.entries(update).forEach(([key, value]) => {
        if (value === null || value === undefined || value === '') {
          newParams.delete(key)
        } else {
          newParams.set(key, String(value))
        }
      })
    }
    router.replace(`?${newParams.toString()}`, { scroll: false })
  }

  /**
   * Lấy value
   */
  const getValueFromQueryString = (name: string) =>
    searchParams.get(name) as string

  /**
   * Clear 1 param
   */
  const clearQueryString = (name: string) => {
    setQueryParams({ [name]: null })
  }

  /**
   * Clear nhiều param
   */
  const clearManyQueryString = (names: string[]) => {
    setQueryParams((params) => {
      names.forEach((name) => params.delete(name))
    })
  }

  /**
   * Clear tất cả
   */
  const clearAllQueryStrings = () => {
    router.replace(window.location.pathname, { scroll: false })
  }

  return {
    setQueryParams,
    getValueFromQueryString,
    clearQueryString,
    clearManyQueryString,
    clearAllQueryStrings,
    searchParamsUrl: searchParams
  }
}
