"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { apiClient } from "@/lib/api-client"

interface User {
  id: number
  email: string
  created_at: string
  requirePasswordChange: boolean
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  const isAuthenticated = !!user && !!apiClient.getToken()

  // Protected routes that require authentication
  const protectedRoutes = ["/chats", "/settings"]
  
  // Routes that should redirect to /chats if user is already authenticated
  const publicRoutes = ["/login", "/"]

  const refreshUser = async () => {
    try {
      const token = apiClient.getToken()
      if (!token) {
        setUser(null)
        return
      }

      const response = await apiClient.getCurrentUser()
      setUser(response.user)
    } catch (error) {
      console.error("Failed to refresh user:", error)
      // If token is invalid, clear it
      apiClient.clearToken()
      setUser(null)
    }
  }

  const login = async (email: string, password: string) => {
    const response = await apiClient.login(email, password)
    
    // Store token
    apiClient.setToken(response.token)
    
    // Store user data
    if (typeof window !== "undefined") {
      localStorage.setItem("user", JSON.stringify(response.user))
      localStorage.setItem("bots", JSON.stringify(response.bots))
    }

    // Set user in context
    setUser({
      ...response.user,
      requirePasswordChange: response.requirePasswordChange
    })

    // Handle redirect based on password change requirement
    if (response.requirePasswordChange) {
      // Save the current password in sessionStorage temporarily
      if (typeof window !== "undefined") {
        sessionStorage.setItem("force_current_password", password)
      }
      router.push("/change-password")
    } else {
      router.push("/chats")
    }
  }

  const logout = () => {
    apiClient.clearToken()
    setUser(null)
    if (typeof window !== "undefined") {
      localStorage.removeItem("user")
      localStorage.removeItem("bots")
      sessionStorage.removeItem("force_current_password")
    }
    router.push("/login")
  }

  // Route protection effect
  useEffect(() => {
    if (isLoading) return

    const token = apiClient.getToken()

    // If no token and trying to access protected route OR on root page
    if (!token && (protectedRoutes.some(route => pathname.startsWith(route)) || pathname === "/")) {
      router.push("/login")
      return
    }

    // If no token and not on login page, redirect to login
    if (!token && pathname !== "/login") {
      router.push("/login")
      return
    }

    // If authenticated
    if (isAuthenticated && user) {
      // If user needs to change password and not on change-password page
      if (user.requirePasswordChange && pathname !== "/change-password") {
        router.push("/change-password")
        return
      }

      // If user doesn't need to change password but is on change-password page
      if (!user.requirePasswordChange && pathname === "/change-password") {
        router.push("/chats")
        return
      }

      // If authenticated and on public routes, redirect to chats
      if (publicRoutes.includes(pathname)) {
        router.push("/chats")
        return
      }
    }
  }, [isAuthenticated, user, pathname, router, isLoading])

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      const token = apiClient.getToken()
      if (token) {
        await refreshUser()
      }
      setIsLoading(false)
    }

    initAuth()
  }, [])

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    refreshUser
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
