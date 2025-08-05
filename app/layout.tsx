import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SparkGPT – Uncensored AI',
  description: 'SparkGPT is an uncensored AI assistant that helps you generate viral ideas, smart prompts, and bold content.',
  generator: 'v0.dev',
  metadataBase: new URL('https://sparkgpt.fun'),
  openGraph: {
    title: 'SparkGPT – Uncensored AI',
    description: 'SparkGPT is an uncensored AI assistant that helps you generate viral ideas, smart prompts, and bold content.',
    url: 'https://sparkgpt.fun',
    siteName: 'SparkGPT',
    images: [
      {
        url: '/imagine-gpt-logo.png',
        width: 500,
        height: 500,
        alt: 'SparkGPT Logo',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SparkGPT – Uncensored AI',
    description: 'SparkGPT is an uncensored AI assistant that helps you generate viral ideas, smart prompts, and bold content.',
    images: ['/imagine-gpt-logo.png'],
  },
  icons: {
    icon: '/imagine-gpt-logo.png',
  },
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
