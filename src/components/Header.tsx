import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useConvexAuth } from 'convex/react'
import { useAuthActions } from '@convex-dev/auth/react'
import {
  Globe,
  Home,
  Menu,
  Calculator,
  LayoutDashboard,
  LogIn,
  LogOut,
  X,
  User,
} from 'lucide-react'

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const { isAuthenticated, isLoading } = useConvexAuth()
  const { signOut } = useAuthActions()

  const handleSignOut = async () => {
    await signOut()
    setIsOpen(false)
  }

  return (
    <>
      <header className="p-4 flex items-center justify-between bg-slate-900/80 backdrop-blur-sm text-white shadow-lg border-b border-slate-700/50 sticky top-0 z-40">
        <div className="flex items-center">
          <button
            onClick={() => setIsOpen(true)}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors md:hidden"
            aria-label="Open menu"
          >
            <Menu size={24} />
          </button>
          <Link to="/" className="flex items-center gap-2 ml-2 md:ml-0">
            <Globe className="w-8 h-8 text-amber-400" />
            <span className="text-xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
              Declination Living
            </span>
          </Link>
        </div>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            to="/"
            className="text-slate-300 hover:text-white transition-colors"
            activeProps={{ className: 'text-amber-400 font-medium' }}
          >
            Home
          </Link>
          <Link
            to="/calculator"
            className="text-slate-300 hover:text-white transition-colors"
            activeProps={{ className: 'text-amber-400 font-medium' }}
          >
            Calculator
          </Link>
          {isAuthenticated && (
            <Link
              to="/dashboard"
              className="text-slate-300 hover:text-white transition-colors"
              activeProps={{ className: 'text-amber-400 font-medium' }}
            >
              Dashboard
            </Link>
          )}
          {isLoading ? (
            <div className="w-20 h-9 bg-slate-800 rounded-lg animate-pulse" />
          ) : isAuthenticated ? (
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
            >
              <User className="w-4 h-4" />
              Sign Out
            </button>
          ) : (
            <Link
              to="/auth/signin"
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-medium rounded-lg transition-colors"
            >
              Sign In
            </Link>
          )}
        </nav>
      </header>

      {/* Mobile drawer */}
      <aside
        className={`fixed top-0 left-0 h-full w-80 bg-slate-900 text-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col md:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <Globe className="w-6 h-6 text-amber-400" />
            <span className="text-lg font-bold">Declination Living</span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            aria-label="Close menu"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <Link
            to="/"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 transition-colors mb-2"
            activeProps={{
              className:
                'flex items-center gap-3 p-3 rounded-lg bg-amber-600 hover:bg-amber-700 transition-colors mb-2',
            }}
          >
            <Home size={20} />
            <span className="font-medium">Home</span>
          </Link>

          <Link
            to="/calculator"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 transition-colors mb-2"
            activeProps={{
              className:
                'flex items-center gap-3 p-3 rounded-lg bg-amber-600 hover:bg-amber-700 transition-colors mb-2',
            }}
          >
            <Calculator size={20} />
            <span className="font-medium">Calculator</span>
          </Link>

          {isAuthenticated && (
            <Link
              to="/dashboard"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 transition-colors mb-2"
              activeProps={{
                className:
                  'flex items-center gap-3 p-3 rounded-lg bg-amber-600 hover:bg-amber-700 transition-colors mb-2',
              }}
            >
              <LayoutDashboard size={20} />
              <span className="font-medium">Dashboard</span>
            </Link>
          )}

          <div className="border-t border-slate-700 my-4" />

          {isAuthenticated ? (
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 transition-colors mb-2 w-full text-left"
            >
              <LogOut size={20} />
              <span className="font-medium">Sign Out</span>
            </button>
          ) : (
            <Link
              to="/auth/signin"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 transition-colors mb-2"
              activeProps={{
                className:
                  'flex items-center gap-3 p-3 rounded-lg bg-amber-600 hover:bg-amber-700 transition-colors mb-2',
              }}
            >
              <LogIn size={20} />
              <span className="font-medium">Sign In</span>
            </Link>
          )}
        </nav>
      </aside>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}
