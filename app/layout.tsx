import type { Metadata, Viewport } from "next"
import { Outfit } from "next/font/google"

import { ThemeProvider } from "@/components/theme-provider"

import "./globals.css"

import GridPattern from "../components/grid-pattern"
import { Toaster } from "../components/ui/toaster"
import { cn } from "../lib/utils"

const outfit = Outfit({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Flux Lura - Your Unlimited Free File Converter",
  description:
    "Unlock your creative potential with Flux Lura, the premier online tool for seamless multimedia conversion. Effortlessly transform images, audio, and videos without any limitations. Experience the freedom of unlimited conversions and elevate your content like never before. Start your journey with Flux Lura today!",
  creator: "Aayush Bharti",
  keywords:
    "image converter, video converter, audio converter, unlimited image converter, unlimited video converter, unlimited file conversion, multimedia transformation",
  authors: [
    {
      name: "Aayush Bharti",
      url: "https://aayushbharti.vercel.app",
    },
  ],
}
export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: [{ media: "(prefers-color-scheme: dark)", color: "black" }],
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        className={cn(
          "relative h-full antialiased selection:bg-purple-600/20 selection:text-purple-400",
          outfit.className
        )}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Toaster />
          <GridPattern />
          <div className="mx-auto min-h-screen max-w-4xl pt-28 lg:max-w-6xl lg:pt-32 2xl:max-w-7xl 2xl:pt-40">
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
