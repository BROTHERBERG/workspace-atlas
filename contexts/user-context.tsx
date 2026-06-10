'use client'

import React, { createContext, useContext, ReactNode } from 'react'
import { useSession } from 'next-auth/react'

interface UserContextType {
  user: {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
  } | null
  isLoading: boolean
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession()

  const value: UserContextType = {
    user: session?.user ? {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      image: session.user.image,
    } : null,
    isLoading: status === 'loading'
  }

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}