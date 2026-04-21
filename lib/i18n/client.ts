"use client"

import { useLocale, useTranslations } from "next-intl"
import { useRouter, usePathname } from "next/navigation"
import { locales, type Locale } from "./config"

// Hook to get current locale
export function useCurrentLocale() {
    return useLocale() as Locale
}

// Hook to switch locale
export function useLocaleSwitch() {
    const router = useRouter()
    const pathname = usePathname()
    const currentLocale = useCurrentLocale()

    const switchLocale = (newLocale: Locale) => {
        if (newLocale === currentLocale) return

        // Remove current locale from pathname and add new locale
        const pathWithoutLocale = pathname.replace(`/${currentLocale}`, "")
        const newPath = `/${newLocale}${pathWithoutLocale}`

        router.push(newPath)
    }

    return { switchLocale, currentLocale }
}

// Hook for translations with type safety
export function useTypedTranslations(namespace?: string) {
    return useTranslations(namespace)
}

// Hook to format currency based on locale
export function useCurrencyFormatter() {
    const locale = useCurrentLocale()

    return (amount: number) => {
        return new Intl.NumberFormat(locale, {
            style: "currency",
            currency: locale === "vi" ? "VND" : "USD",
        }).format(amount)
    }
}

// Hook to format date based on locale
export function useDateFormatter() {
    const locale = useCurrentLocale()

    return {
        formatShort: (date: Date) => {
            return new Intl.DateTimeFormat(locale, {
                day: "numeric",
                month: "short",
                year: "numeric",
            }).format(date)
        },
        formatLong: (date: Date) => {
            return new Intl.DateTimeFormat(locale, {
                day: "numeric",
                month: "long",
                year: "numeric",
                weekday: "long",
            }).format(date)
        },
    }
}

// Utility to get available locales
export function getAvailableLocales() {
    return locales
}

// Utility to check if locale is valid
export function isValidLocale(locale: string): locale is Locale {
    return locales.includes(locale as Locale)
}
