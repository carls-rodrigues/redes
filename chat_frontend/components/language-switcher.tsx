"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useLocale } from "@/lib/locale-context"

export function LanguageSwitcher() {
  const { locale, setLocale } = useLocale()
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const languages = [
    { code: 'en' as const, flag: '🇺🇸' },
    { code: 'pt-BR' as const, flag: '🇧🇷' },
  ]

  const currentLanguage = languages.find(lang => lang.code === locale) || languages[1]

  const handleLanguageChange = (newLocale: 'en' | 'pt-BR') => {
    setLocale(newLocale)
    setDropdownOpen(false)
  }

  return (
    <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:bg-muted w-8 h-8 md:w-10 md:h-10">
          <span className="text-lg">{currentLanguage.flag}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            className={locale === language.code ? "bg-accent" : ""}
          >
            <span className="text-lg mr-2">{language.flag}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}