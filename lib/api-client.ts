// API client - SIMPLE version

// API URL - Conectar directamente al backend
// En producción (Railway), NEXT_PUBLIC_API_URL estará vacío para usar el mismo dominio
const getApiUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== 'undefined' && window.location) {
    return window.location.origin;
  }
  return "http://localhost:3001";
};

const API_URL = getApiUrl();

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

  async getMessages(conversationId: string, limit = 100, offset = 0) {
    return this.request(`/api/conversations/${conversationId}/messages?limit=${limit}&offset=${offset}`)
  }

  async sendMessage(conversationId: string, message: string, tempId?: string, type?: string, url?: string) {
    return this.request("/api/messages/send-message", {
      method: "POST",
      body: JSON.stringify({ conversationId, message, tempId, type, url }),
    })
  }

  // [TAG: Multimedia]
  async uploadImage(file: File) {
    const formData = new FormData()
    formData.append("file", file)

    const token = this.getToken()
    const headers: Record<string, string> = {}
    
    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }

    const response = await fetch(`${API_URL}/api/upload/image`, {
      method: "POST",
      headers: headers as HeadersInit,
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Upload failed" }))
      throw new Error(error.error || "Upload failed")
    }

    return response.json()
  }

  async uploadVideo(file: File) {
    const formData = new FormData()
    formData.append("file", file)

    const token = this.getToken()
    const headers: Record<string, string> = {}
    
    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }

    const response = await fetch(`${API_URL}/api/upload/video`, {
      method: "POST",
      headers: headers as HeadersInit,
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Upload failed" }))
      throw new Error(error.error || "Upload failed")
    }

    return response.json()
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

  // [TAG: Templates]
  async getTemplates() {
    return this.request("/api/templates")
  }

  async createTemplate(title: string, message: string, shortcut?: string, category?: string) {
    return this.request("/api/templates", {
      method: "POST",
      body: JSON.stringify({ title, message, shortcut, category }),
    })
  }

  async updateTemplate(id: number, title: string, message: string, shortcut?: string, category?: string) {
    return this.request(`/api/templates/${id}`, {
      method: "PUT",
      body: JSON.stringify({ title, message, shortcut, category }),
    })
  }

  async deleteTemplate(id: number) {
    return this.request(`/api/templates/${id}`, {
      method: "DELETE",
    })
  }

  // [TAG: Scheduled Messages]
  async getScheduledMessages(status?: string) {
    const query = status ? `?status=${status}` : ''
    return this.request(`/api/scheduled-messages${query}`)
  }

  async createScheduledMessage(
    botId: number,
    conversationIds: number[],
    message: string,
    scheduledFor: string
  ) {
    return this.request("/api/scheduled-messages", {
      method: "POST",
      body: JSON.stringify({
        bot_id: botId,
        conversation_ids: conversationIds,
        message,
        scheduled_for: scheduledFor,
      }),
    })
  }

  async updateScheduledMessage(
    id: number,
    conversationIds: number[],
    message: string,
    scheduledFor: string
  ) {
    return this.request(`/api/scheduled-messages/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        conversation_ids: conversationIds,
        message,
        scheduled_for: scheduledFor,
      }),
    })
  }

  async cancelScheduledMessage(id: number) {
    return this.request(`/api/scheduled-messages/${id}`, {
      method: "DELETE",
    })
  }

  // [TAG: User Profile]
  async updateDisplayName(displayName: string) {
    return this.request("/api/auth/update-profile", {
      method: "PUT",
      body: JSON.stringify({ display_name: displayName }),
    })
  }
}

export const apiClient = new ApiClient()
