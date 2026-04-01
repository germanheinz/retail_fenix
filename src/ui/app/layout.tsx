import type { Metadata } from 'next'
import type { Theme } from '@/lib/types'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { SWRProvider } from '@/components/providers/SWRProvider'
import { ChatWidget } from '@/components/chat/ChatWidget'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Fenix Shop',
  description: 'Your premium e-commerce experience',
}

const THEME = (process.env.RETAIL_UI_THEME || 'default') as Theme
const CHAT_ENABLED = process.env.RETAIL_UI_CHAT_ENABLED === 'true'
const VERSION = process.env.RETAIL_UI_VERSION || 'v1.0.0'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" data-theme={THEME}>
      <body className={inter.className}>
        <SWRProvider>
          <div className="flex flex-col min-h-screen">
            <Navbar version={VERSION} />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </div>
          {CHAT_ENABLED && <ChatWidget />}
          <Toaster position="bottom-right" richColors />
        </SWRProvider>
      </body>
    </html>
  )
}
