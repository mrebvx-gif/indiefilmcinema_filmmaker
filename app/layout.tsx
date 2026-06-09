import type { Metadata } from 'next'
import { Outfit, Oswald } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'
import { ThemeProvider } from '@/components/theme-provider'
import { ThemeToggle } from '@/components/theme-toggle'

const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' })
const oswald = Oswald({ subsets: ['latin'], variable: '--font-oswald' })

export const metadata: Metadata = {
  title: 'Indie Film Cinema — Filmmaker Portal',
  description: 'Submit your film to Indie Film Cinema',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${outfit.variable} ${oswald.variable} font-sans antialiased text-foreground min-h-screen relative selection:bg-primary selection:text-primary-foreground`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          
          {/* Global Cinematic Background */}
          <div className="fixed inset-0 w-full h-full pointer-events-none z-[-10] overflow-hidden bg-background">
            <img 
              src="/cinematic_hero_bg.png" 
              alt="Cinema Background" 
              className="absolute inset-0 w-full h-full object-cover opacity-40 dark:opacity-30 transition-opacity duration-1000"
            />
            {/* White wash for Light Mode, Dark wash for Dark Mode */}
            <div className="absolute inset-0 bg-white/80 dark:bg-black/70 transition-colors duration-1000" />
            <div className="absolute top-[10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 dark:bg-primary/10 blur-[150px] transition-colors duration-1000" />
          </div>

          <div className="fixed bottom-8 right-8 z-50">
            <ThemeToggle />
          </div>

          <div className="relative z-0">
            {children}
          </div>
          
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
