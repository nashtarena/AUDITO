import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Audito — LLM Privacy Auditing',
  description: 'Detect data memorization and privacy leakage in language models',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  )
}
