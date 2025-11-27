"use client"

import { Sparkles } from "lucide-react"
import { useLanguage } from "@/lib/language-context"

export function WelcomeHeader() {
  const { t } = useLanguage()

  return (
    <div className="relative overflow-hidden rounded-2xl gradient-card p-8 animate-in slide-in-from-top-4 duration-700 hover-lift">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 animate-float"></div>
      <div className="relative flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary animate-in zoom-in-75 duration-500 delay-200 animate-glow">
          <Sparkles className="h-8 w-8 text-primary-foreground animate-pulse" />
        </div>
        <div className="animate-in slide-in-from-right-4 duration-500 delay-300">
          <h1 className="text-4xl font-bold tracking-tight gradient-text mb-2">{t('welcome')}</h1>
          <p className="text-muted-foreground text-lg animate-in fade-in-0 duration-500 delay-500">{t('welcomeDesc')}</p>
        </div>
      </div>
    </div>
  )
}
