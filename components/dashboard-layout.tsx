"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"

import { Scan, User, ChevronDown, Settings, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useLanguage } from "@/lib/language-context"

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const { t } = useLanguage()
  const router = useRouter()

  const handleLogout = () => {
    // In a real app, this would clear auth tokens, etc.
    router.push("/")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="border-b border-border/50 gradient-bg px-4 md:px-6 py-3 md:py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Welcome Message */}
          <div className="flex items-center gap-2 md:gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-xl gradient-primary animate-glow">
                <Scan className="h-5 w-5 md:h-6 md:w-6 text-primary-foreground" />
              </div>
              <span className="text-lg md:text-xl font-bold gradient-text">{t('mediAI')}</span>
            </div>
            <div className="hidden lg:flex flex-col">
              <h1 className="text-base md:text-lg font-bold tracking-tight gradient-text">{t('welcome')}</h1>
              <p className="text-xs md:text-sm text-muted-foreground">{t('welcomeDesc')}</p>
            </div>
          </div>

          {/* Profile Dropdown */}
          <DropdownMenu open={isProfileOpen} onOpenChange={setIsProfileOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 hover-lift" aria-label="User profile menu">
                <div className="flex h-7 w-7 md:h-8 md:w-8 items-center justify-center rounded-full gradient-primary animate-glow">
                  <User className="h-3 w-3 md:h-4 md:w-4 text-primary-foreground" />
                </div>
                <div className="hidden md:flex flex-col items-start">
                  <span className="text-sm font-medium text-foreground">Dr. Ahmed</span>
                  <span className="text-xs text-muted-foreground">{t('radiologist')}</span>
                </div>
                <ChevronDown className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 gradient-card border-border/50">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium text-foreground">Dr. Ahmed</p>
                <p className="text-xs text-muted-foreground">{t('radiologist')}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer hover-lift">
                <Settings className="mr-2 h-4 w-4" />
                <span>{t('accountSettings')}</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer hover-lift text-red-600 focus:text-red-600"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>{t('logout')}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto p-3 md:p-4 lg:p-6 max-w-7xl">
        {children}
      </main>
    </div>
  )
}
