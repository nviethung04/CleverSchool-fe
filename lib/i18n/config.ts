// Lưu ý:
// Chỉ các trang nằm trong app/[locale]/... mới có prefix /vi hoặc /en trên URL.
// Các trang ngoài [locale] sẽ không có prefix locale.
// Không cần thay đổi gì trong file này để kiểm soát prefix, chỉ cần cấu trúc folder đúng trong app/.

export const locales = ["vi", "en"] as const
export const defaultLocale = "vi" as const

export type Locale = (typeof locales)[number]

// Locale labels for display
export const localeLabels: Record<Locale, string> = {
    vi: "Tiếng Việt",
    en: "English",
}

// Locale flags/icons
export const localeFlags: Record<Locale, string> = {
    vi: "🇻🇳",
    en: "🇺🇸",
}

// Date/time formats for each locale
export const dateTimeFormats = {
    vi: {
        short: {
            day: "numeric",
            month: "short",
            year: "numeric",
        },
        long: {
            day: "numeric",
            month: "long",
            year: "numeric",
            weekday: "long",
        },
    },
    en: {
        short: {
            day: "numeric",
            month: "short",
            year: "numeric",
        },
        long: {
            day: "numeric",
            month: "long",
            year: "numeric",
            weekday: "long",
        },
    },
} as const

// Number formats
export const numberFormats = {
    vi: {
        currency: {
            style: "currency",
            currency: "VND",
        },
        decimal: {
            style: "decimal",
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        },
    },
    en: {
        currency: {
            style: "currency",
            currency: "USD",
        },
        decimal: {
            style: "decimal",
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        },
    },
} as const
