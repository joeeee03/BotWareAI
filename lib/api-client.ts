// [TAG: Mensajes]
// API client for HTTP requests

// IMPORTANTE: En Railway, Next.js hace REWRITE de /api/* y /socket.io/* al backend interno
// Railway solo expone UN puerto, así que usamos rutas relativas que Next.js proxea
// En local, conectamos directamente a localhost:3001
let API_URL: string

if (typeof window !== 'undefined') {
  const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
  
  if (isProduction) {
    // RAILWAY: Usar rutas relativas para que Next.js haga el rewrite al backend interno
    API_URL = ''
    console.log('[API-CLIENT] RAILWAY MODE - Using Next.js rewrites (relative URLs)')
  } else {
    // LOCAL: Conectar directamente a localhost:3001
    API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
    console.log('[API-CLIENT] LOCAL MODE - Backend URL:', API_URL)
  }
} else {
  // SSR: usar rutas relativas también
  API_URL = ''
}

export class ApiClient {
  private token: string | null = null

  setToken(token: string) {
    this.token = token
    if (typeof window !== "undefined") {
      localStorage.setItem("auth_token", token)
    }
  }

  getToken(): string | null {
    if (this.token) return this.token
    if (typeof window !== "undefined") {
      return localStorage.getItem("auth_token")
    }
    return null
  }

  clearToken() {
    this.token = null
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token")
    }
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const token = this.getToken()
    // Use a plain object so we can index/set the Authorization header safely
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string> | undefined),
    }

    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: headers as HeadersInit,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Request failed" }))
      throw new Error(error.error || "Request failed")
    }

    return response.json()
  }

  // [TAG: Autenticación]
  async login(email: string, password: string) {
    return this.request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    })
  }

  async getCurrentUser() {
    return this.request("/api/auth/me")
  }

  // Accept either (currentPassword, newPassword) or just newPassword
  async changePassword(currentOrNew: string, maybeNew?: string) {
    let body: any
    if (maybeNew !== undefined) {
      body = { currentPassword: currentOrNew, newPassword: maybeNew }
    } else {
      body = { newPassword: currentOrNew }
    }

    return this.request("/api/auth/change-password", {
      method: "POST",
      body: JSON.stringify(body),
    })
  }

  // [TAG: Mensajes]
  async getConversations(limit = 50, offset = 0) {
    return this.request(`/api/conversations?limit=${limit}&offset=${offset}`)
  }

  async getMessages(conversationId: string, limit = 100, cursor?: string) {
    const cursorParam = cursor ? `&cursor=${cursor}` : ""
    return this.request(`/api/conversations/${conversationId}/messages?limit=${limit}${cursorParam}`)
  }

  async sendMessage(conversationId: string, message: string, tempId?: string) {
    return this.request("/api/messages/send-message", {
      method: "POST",
      body: JSON.stringify({ conversationId, message, tempId }),
    })
  }

  // [TAG: DB]
  async getBots() {
    return this.request("/api/bots")
  }

  async createBot(keyBot: string, phoneNumberId: string, accessToken: string) {
    return this.request("/api/bots", {
      method: "POST",
      body: JSON.stringify({
        key_bot: keyBot,
        phone_number_id: phoneNumberId,
        access_token: accessToken,
      }),
    })
  }
}

export const apiClient = new ApiClient()
