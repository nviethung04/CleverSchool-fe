'use client'

import { useEffect } from 'react'

export function MaintenanceSessionCleanup() {
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Xóa cookies khi đóng tab/browser
      document.cookie = 'maintenance_session_checked=; path=/; max-age=0'
      document.cookie = 'pre_maintenance_url=; path=/; max-age=0'
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [])

  return null
}