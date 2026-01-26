import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'

interface HeaderContextValue {
  hideHeader: boolean
  setHideHeader: (hide: boolean) => void
}

const HeaderContext = createContext<HeaderContextValue | null>(null)

export function HeaderProvider({ children }: { children: ReactNode }) {
  const [hideHeader, setHideHeader] = useState(false)
  return (
    <HeaderContext.Provider value={{ hideHeader, setHideHeader }}>
      {children}
    </HeaderContext.Provider>
  )
}

export function useHeaderVisibility() {
  const context = useContext(HeaderContext)
  if (!context) throw new Error('useHeaderVisibility must be used within HeaderProvider')
  return context
}
