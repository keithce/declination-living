import { createContext, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

interface HeaderContextValue {
  hideHeader: boolean
  setHideHeader: (hide: boolean) => void
}

const HeaderContext = createContext<HeaderContextValue | null>(null)

export function HeaderProvider({ children }: { children: ReactNode }) {
  const [hideHeader, setHideHeader] = useState(false)
  const value = useMemo(() => ({ hideHeader, setHideHeader }), [hideHeader])
  return <HeaderContext.Provider value={value}>{children}</HeaderContext.Provider>
}

export function useHeaderVisibility() {
  const context = useContext(HeaderContext)
  if (!context) throw new Error('useHeaderVisibility must be used within HeaderProvider')
  return context
}
