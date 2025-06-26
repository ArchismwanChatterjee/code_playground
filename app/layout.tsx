import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Code Playground',
  description: 'Created with tech',
  generator: 'dev arch',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
