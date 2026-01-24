import {
  HeadContent,
  Link,
  Outlet,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { Compass, Home } from 'lucide-react'

import Header from '../components/Header'
import { ErrorBoundary } from '../components/ErrorBoundary'
import ConvexProvider from '../integrations/convex/provider'
import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'

import appCss from '../styles.css?url'

import type { QueryClient } from '@tanstack/react-query'
import type { TRPCRouter } from '@/integrations/trpc/router'
import type { TRPCOptionsProxy } from '@trpc/tanstack-react-query'

interface MyRouterContext {
  queryClient: QueryClient
  trpc: TRPCOptionsProxy<TRPCRouter>
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Declination Living - Find Your Optimal Location',
      },
      {
        name: 'description',
        content:
          'Discover your optimal living location based on astrological declination theory. Calculate planetary alignments and find places where your natal chart resonates with Earth geography.',
      },
      // Open Graph
      {
        property: 'og:type',
        content: 'website',
      },
      {
        property: 'og:title',
        content: 'Declination Living - Find Your Optimal Location',
      },
      {
        property: 'og:description',
        content:
          'Discover your optimal living location based on astrological declination theory.',
      },
      {
        property: 'og:image',
        content: '/og-image.png',
      },
      // Twitter Card
      {
        name: 'twitter:card',
        content: 'summary_large_image',
      },
      {
        name: 'twitter:title',
        content: 'Declination Living',
      },
      {
        name: 'twitter:description',
        content:
          'Find your optimal living location based on planetary declinations.',
      },
      {
        name: 'twitter:image',
        content: '/og-image.png',
      },
      // Theme color
      {
        name: 'theme-color',
        content: '#050714',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
      {
        rel: 'icon',
        type: 'image/svg+xml',
        href: '/favicon.svg',
      },
    ],
  }),

  component: RootComponent,
  notFoundComponent: NotFoundComponent,
})

function NotFoundComponent() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="max-w-md text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-800/50 flex items-center justify-center">
          <Compass className="w-10 h-10 text-amber-400" />
        </div>
        <h1 className="font-display text-3xl font-semibold text-white mb-4">
          Page Not Found
        </h1>
        <p className="text-slate-400 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-900 font-semibold rounded-xl hover:shadow-[0_0_30px_rgba(251,191,36,0.3)] transition-all"
        >
          <Home className="w-4 h-4" />
          Go Home
        </Link>
      </div>
    </div>
  )
}

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen bg-slate-900">
        <ConvexProvider>
          <Header />
          <main>
            <ErrorBoundary>{children}</ErrorBoundary>
          </main>
          <TanStackDevtools
            config={{
              position: 'bottom-right',
            }}
            plugins={[
              {
                name: 'Router',
                render: <TanStackRouterDevtoolsPanel />,
              },
              TanStackQueryDevtools,
            ]}
          />
        </ConvexProvider>
        <Scripts />
      </body>
    </html>
  )
}
