'use client'
import { deleteCookie, getCookie, setCookie } from '@/lib/utils'
import '../globals.css'
import { useEffect, useState } from 'react'
import MobileVerticalGuard from '@/components/MobileVerticalGuard'

export const dynamic = 'force-dynamic'

export default function MaintenancePage() {
  const [ready, setReady] = useState(false)
  const [url, setUrl] = useState('/')

  useEffect(() => {
    setUrl(getCookie('pre_maintenance_url') || '/')
    setReady(true)
  }, [])

  if (!ready) return null

  const handleReload = () => {
     // Xóa session cookies
    deleteCookie('pre_maintenance_url')
    deleteCookie('maintenance_session_checked')
    
    // Set cookie để báo middleware cần check lại
    setCookie('force_recheck', 'true', {
      path: '/',
      maxAge: 10, // 10 giây - đủ cho 1 lần reload
    })
    
    // Reload về URL cũ (không cần params)
    window.location.href = decodeURIComponent(url)
  }
  
  return (
    <MobileVerticalGuard>
      {/* BACKGROUND */}
      <div
        aria-hidden="true"
        className="
          font-maintenance
          fixed inset-0 -z-10
          w-screen h-screen bg-cover
          bg-no-repeat
          bg-[url('/bg-maintenance-mobile.png')]
          landscape:bg-[url('/bg-maintenance.png')]
          lg:bg-[url('/bg-maintenance.png')]
        "
        style={{
          backgroundPosition: 'top right',
        }}
      />

      {/* CONTENT */}
      <div
        className="
          fixed flex flex-col
          px-8
          bottom-6 left-0 w-full
          lg:px-0 lg:left-20 md:bottom-[5%] lg:bottom-[10%]
          lg:w-2/5
        "
      >
        {/* TITLE */}
        <h1
          className='flex flex-col font-bold leading-none lg:leading-tight'
          style={{ fontSize: 'clamp(1.75rem, 4.2vw, 3.75rem)'}}
        >
          <span className="text-[#FD9F13]">Hệ thống </span>
          <span className="text-[#0078FF]">đang tạm gián đoạn</span>
        </h1>

        {/* DESCRIPTION */}
        <p
          className="text-[#2561A5]"
          style={{ fontSize: 'clamp(0.95rem, 2.2vw, 1.625rem)'}}
        >
          Hệ thống đang gặp sự cố kỹ thuật và tạm thời không thể truy cập.
          Chúng tôi đang khắc phục để hệ thống hoạt động trở lại sớm nhất.
        </p>

        {/* SUB TITLE */}
        <h4
          className="font-semibold text-[#2089FF]"
          style={{ fontSize: 'clamp(1.1rem, 2.8vw, 2rem)'}}
        >
          Bạn nên làm gì?
        </h4>

        {/* LIST */}
        <ul
          className="text-[#2089FF]"
          style={{ fontSize: 'clamp(0.9rem, 2vw, 1.375rem)'}}
        >
          <li>Vui lòng quay lại sau 15–30 phút.</li>
          <li>
            Nếu bạn đang làm dở bài, đừng lo — dữ liệu học tập không bị mất.
          </li>
          <li className='hidden lg:block'>
            Bạn có thể thử tải lại trang bằng Ctrl + F5 (hoặc Command + Shift +
            R trên Mac).
          </li>
        </ul>

        {/* BUTTON */}
        <div className='text-center lg:text-left'>
          <button
            onClick={handleReload}
            style={{
              fontSize: 'clamp(1rem, 2.4vw, 1.75rem)',
              boxShadow: '0 6px 0 0 #0121BC',
            }}
            className="
              mt-3 lg:mt-6
              bg-[#0078FF]
              text-white font-bold
              rounded-full
              py-1 mdpy-2
              w-full max-w-[360px]
            "
          >
            Tải lại trang
          </button>
        </div>
      </div>
    </MobileVerticalGuard>
  )
}
