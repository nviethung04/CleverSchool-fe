import { defineRouting } from "next-intl/routing"
import { createNavigation } from "next-intl/navigation"

export const routing = defineRouting({
    locales: ["vi", "en"],
    defaultLocale: "vi",
    localePrefix: "always" // Luôn hiển thị prefix để tránh confusion
})

export const { Link, redirect, usePathname, useRouter } = createNavigation(routing)