"use client"

import { useCurrentLocale, useLocaleSwitch } from "@/lib/i18n/client"
import { localeLabels, localeFlags } from "@/lib/i18n/config"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Globe } from "lucide-react"

export function LanguageSwitcher() {
    const currentLocale = useCurrentLocale()
    const { switchLocale } = useLocaleSwitch()

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                    <Globe className="h-4 w-4" />
                    <span className="hidden sm:inline">
                        {localeFlags[currentLocale]} {localeLabels[currentLocale]}
                    </span>
                    <span className="sm:hidden">{localeFlags[currentLocale]}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => switchLocale("vi")} className={currentLocale === "vi" ? "bg-accent" : ""}>
                    <span className="mr-2">🇻🇳</span>
                    Tiếng Việt
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => switchLocale("en")} className={currentLocale === "en" ? "bg-accent" : ""}>
                    <span className="mr-2">🇺🇸</span>
                    English
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
