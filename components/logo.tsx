"use client"
import Image from "next/image"
import { useEffect, useState } from "react"

export function Logo(props: { width?: number; height?: number; className?: string }) {
    const [logoSrc, setLogoSrc] = useState("/logo.svg")
    useEffect(() => {
        if (typeof window !== "undefined") {
            if (window.location.hostname.includes("urp.com.vn")) {
                setLogoSrc("/logo-urp.png")
            }
        }
    }, [])
    return (
        <Image
            src={logoSrc}
            alt="Logo"
            width={props.width || 120}
            height={props.height || 32}
            className={props.className || ""}
            priority
        />
    )
}