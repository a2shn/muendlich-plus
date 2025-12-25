import { createRootRoute, HeadContent, Outlet, Scripts, createFileRoute, lazyRouteComponent, createRouter } from "@tanstack/react-router";
import { jsx, jsxs } from "react/jsx-runtime";
import { useEffect } from "react";
import { ThemeProvider as ThemeProvider$1 } from "next-themes";
function ThemeProvider({ children, ...props }) {
  return /* @__PURE__ */ jsx(ThemeProvider$1, { ...props, children });
}
const Route$1 = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes"
      },
      {
        title: "Mündliche Beteiligung Tracker - Digitale Strichliste für Schüler"
      },
      {
        name: "description",
        content: "Kostenlose digitale Strichliste zur Erfassung mündlicher Beteiligung im Unterricht. Stundenplan-basiertes Tracking, Notenkorrelationen, Statistiken und Dark Mode."
      },
      {
        name: "keywords",
        content: "mündliche Beteiligung, Strichliste, Schule, Unterricht, Stundenplan, Noten, Schüler, deutsches Schulsystem, Doppelstunden, Partizipation, offline, kostenlos"
      },
      { name: "author", content: "Mündliche Beteiligung Tracker" },
      { name: "generator", content: "TanStack Start" },
      { name: "robots", content: "index, follow" }
    ],
    links: [
      {
        rel: "icon",
        type: "image/svg+xml",
        href: "/favicon.svg"
      },
      {
        rel: "icon",
        type: "image/png",
        href: "/favicon-96x96.png",
        sizes: "96x96"
      },
      {
        rel: "shortcut icon",
        href: "/favicon.ico"
      },
      {
        rel: "apple-touch-icon",
        href: "/apple-touch-icon.png"
      },
      {
        rel: "manifest",
        href: "/site.webmanifest"
      }
    ]
  }),
  component: RootLayout
});
function RootLayout() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      const swUrl = "/sw.js";
      navigator.serviceWorker.register(swUrl).then((registration) => {
        console.log("Service Worker registered");
      }).catch((error) => {
        console.warn("Service Worker registration skipped or failed:", error);
      });
    }
  }, []);
  return /* @__PURE__ */ jsxs("html", { lang: "de", suppressHydrationWarning: true, children: [
    /* @__PURE__ */ jsx("head", { children: /* @__PURE__ */ jsx(HeadContent, {}) }),
    /* @__PURE__ */ jsxs("body", { className: "font-sans antialiased", children: [
      /* @__PURE__ */ jsx(
        ThemeProvider,
        {
          attribute: "class",
          defaultTheme: "system",
          enableSystem: true,
          disableTransitionOnChange: true,
          storageKey: "participation-theme",
          children: /* @__PURE__ */ jsx(Outlet, {})
        }
      ),
      /* @__PURE__ */ jsx(Scripts, {})
    ] })
  ] });
}
const $$splitComponentImporter = () => import("./index-Gx_8wPrh.js");
const Route = createFileRoute("/")({
  component: lazyRouteComponent($$splitComponentImporter, "component")
});
const IndexRoute = Route.update({
  id: "/",
  path: "/",
  getParentRoute: () => Route$1
});
const rootRouteChildren = {
  IndexRoute
};
const routeTree = Route$1._addFileChildren(rootRouteChildren)._addFileTypes();
function getRouter() {
  const router = createRouter({
    routeTree,
    scrollRestoration: true
  });
  return router;
}
export {
  getRouter
};
