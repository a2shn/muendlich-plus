import {
  Outlet,
  createRootRoute,
  HeadContent,
  Scripts,
} from "@tanstack/react-router"
import { useEffect } from "react"
import { ThemeProvider } from "@/components/theme-provider"
import "./globals.css"

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes",
      },
      {
        title: "Mündliche Beteiligung Tracker - Digitale Strichliste für Schüler",
      },
      {
        name: "description",
        content:
          "Kostenlose digitale Strichliste zur Erfassung mündlicher Beteiligung im Unterricht. Stundenplan-basiertes Tracking, Notenkorrelationen, Statistiken und Dark Mode.",
      },
      {
        name: "keywords",
        content:
          "mündliche Beteiligung, Strichliste, Schule, Unterricht, Stundenplan, Noten, Schüler, deutsches Schulsystem, Doppelstunden, Partizipation, offline, kostenlos",
      },
      { name: "author", content: "Mündliche Beteiligung Tracker" },
      { name: "generator", content: "TanStack Start" },
      { name: "robots", content: "index, follow" },
    ],
    links: [
      {
        rel: "icon",
        type: "image/svg+xml",
        href: "/favicon.svg",
      },
      {
        rel: "icon",
        type: "image/png",
        href: "/favicon-96x96.png",
        sizes: "96x96",
      },
      {
        rel: "shortcut icon",
        href: "/favicon.ico",
      },
      {
        rel: "apple-touch-icon",
        href: "/apple-touch-icon.png",
      },
      {
        rel: "manifest",
        href: "/site.webmanifest",
      },
    ],
  }),
  component: RootLayout,
})

function RootLayout() {
  // PWA Service Worker Registration
  useEffect(() => {
  if ("serviceWorker" in navigator) {
    // Inside GitHub Codespaces/Dev Containers, sw.js might be at a different path
    // or handled differently. This ensures we point to the root.
    const swUrl = "/sw.js";
    
    navigator.serviceWorker
      .register(swUrl)
      .then((registration) => {
        console.log("Service Worker registered");
      })
      .catch((error) => {
        // In local dev/Codespaces, 404s are common if the build hasn't run
        console.warn("Service Worker registration skipped or failed:", error);
      });
  }
}, []);

  return (
    <html lang="de" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          storageKey="participation-theme"
        >
          <Outlet />
        </ThemeProvider>
        <Scripts />
      </body>
    </html>
  )
}