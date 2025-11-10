// [TAG: Mensajes]
// Meta WhatsApp API service for sending messages

import axios, { type AxiosError } from "axios"

const META_API_VERSION = process.env.META_API_VERSION || "v20.0"

interface SendMessageParams {
  phoneNumberId: string
  accessToken: string
  to: string
  message: string
}

interface SendMessageResponse {
  success: boolean
  messageId?: string
  error?: string
}

export class MetaApiService {
  private baseUrl: string

  constructor() {
    this.baseUrl = `https://graph.facebook.com/${META_API_VERSION}`
  }

  /**
   * Send a text message via Meta WhatsApp API
   */
  async sendTextMessage({ phoneNumberId, accessToken, to, message }: SendMessageParams): Promise<SendMessageResponse> {
    try {
      const url = `${this.baseUrl}/${phoneNumberId}/messages`
      
      // Clean phone number (remove +, spaces, etc.)
      const cleanedPhoneNumber = to.replace(/[^0-9]/g, "")
      
      console.log('[META-API] Sending message:', {
        original: to,
        cleaned: cleanedPhoneNumber,
        phoneNumberId: phoneNumberId.substring(0, 10) + '...'
      })

      const response = await axios.post(
        url,
        {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: cleanedPhoneNumber, // Remove non-numeric characters
          type: "text",
          text: {
            preview_url: false,
            body: message,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          timeout: 10000, // 10 seconds timeout
        },
      )

      console.log("[v0] Meta API response:", response.data)

      return {
        success: true,
        messageId: response.data.messages?.[0]?.id,
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<any>
        console.error("[v0] Meta API error:", {
          status: axiosError.response?.status,
          data: axiosError.response?.data,
          message: axiosError.message,
        })

        return {
          success: false,
          error: axiosError.response?.data?.error?.message || axiosError.message,
        }
      }

      console.error("[v0] Unexpected error:", error)
      return {
        success: false,
        error: "Unexpected error occurred",
      }
    }
  }

  /**
   * Parse incoming webhook data from Meta
   */
  parseWebhook(body: any): {
    keyBot?: string
    customerPhone?: string
    customerName?: string
    message?: string
    messageId?: string
  } | null {
    try {
      const entry = body.entry?.[0]
      const changes = entry?.changes?.[0]
      const value = changes?.value

      if (!value?.messages || value.messages.length === 0) {
        return null
      }

      const incomingMessage = value.messages[0]
      const contact = value.contacts?.[0]

      return {
        customerPhone: incomingMessage.from,
        customerName: contact?.profile?.name || null,
        message: incomingMessage.text?.body || "",
        messageId: incomingMessage.id,
      }
    } catch (error) {
      console.error("[v0] Failed to parse webhook:", error)
      return null
    }
  }
}

export const metaApiService = new MetaApiService()
