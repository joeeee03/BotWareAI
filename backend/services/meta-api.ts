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

interface SendImageParams {
  phoneNumberId: string
  accessToken: string
  to: string
  imageUrl: string
  caption?: string
}

interface SendVideoParams {
  phoneNumberId: string
  accessToken: string
  to: string
  videoUrl: string
  caption?: string
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
   * Send an image message via Meta WhatsApp API
   */
  async sendImageMessage({ phoneNumberId, accessToken, to, imageUrl, caption = '' }: SendImageParams): Promise<SendMessageResponse> {
    try {
      const url = `${this.baseUrl}/${phoneNumberId}/messages`
      
      // Clean phone number (remove +, spaces, etc.)
      const cleanedPhoneNumber = to.replace(/[^0-9]/g, "")
      
      console.log('[META-API] Sending image:', {
        to: cleanedPhoneNumber,
        imageUrl,
        caption,
        phoneNumberId: phoneNumberId.substring(0, 10) + '...'
      })

      const response = await axios.post(
        url,
        {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: cleanedPhoneNumber,
          type: "image",
          image: {
            link: imageUrl,
            caption: caption || undefined,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          timeout: 10000,
        },
      )

      console.log("[META-API] Image sent successfully:", response.data)

      return {
        success: true,
        messageId: response.data.messages?.[0]?.id,
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<any>
        console.error("[META-API] Error sending image:", {
          status: axiosError.response?.status,
          data: axiosError.response?.data,
          message: axiosError.message,
        })

        return {
          success: false,
          error: axiosError.response?.data?.error?.message || axiosError.message,
        }
      }

      console.error("[META-API] Unexpected error:", error)
      return {
        success: false,
        error: "Unexpected error occurred",
      }
    }
  }

  /**
   * Send a video message via Meta WhatsApp API
   */
  async sendVideoMessage({ phoneNumberId, accessToken, to, videoUrl, caption = '' }: SendVideoParams): Promise<SendMessageResponse> {
    try {
      const url = `${this.baseUrl}/${phoneNumberId}/messages`
      
      // Clean phone number (remove +, spaces, etc.)
      const cleanedPhoneNumber = to.replace(/[^0-9]/g, "")
      
      console.log('[META-API] Sending video:', {
        to: cleanedPhoneNumber,
        videoUrl,
        caption,
        phoneNumberId: phoneNumberId.substring(0, 10) + '...'
      })

      const response = await axios.post(
        url,
        {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: cleanedPhoneNumber,
          type: "video",
          video: {
            link: videoUrl,
            caption: caption || undefined,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          timeout: 10000,
        },
      )

      console.log("[META-API] Video sent successfully:", response.data)

      return {
        success: true,
        messageId: response.data.messages?.[0]?.id,
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<any>
        console.error("[META-API] Error sending video:", {
          status: axiosError.response?.status,
          data: axiosError.response?.data,
          message: axiosError.message,
        })

        return {
          success: false,
          error: axiosError.response?.data?.error?.message || axiosError.message,
        }
      }

      console.error("[META-API] Unexpected error:", error)
      return {
        success: false,
        error: "Unexpected error occurred",
      }
    }
  }

  /**
   * Get media URL from Meta WhatsApp API
   */
  async getMediaUrl(mediaId: string, accessToken: string): Promise<string | null> {
    try {
      const url = `${this.baseUrl}/${mediaId}`
      
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      console.log('[META-API] Media URL retrieved:', response.data.url)
      return response.data.url || null
    } catch (error) {
      const axiosError = error as AxiosError
      console.error('[META-API] Failed to get media URL:', axiosError.response?.data || axiosError.message)
      return null
    }
  }

  /**
   * Parse incoming webhook data from Meta (supports text, image, video, audio)
   */
  parseWebhook(body: any): {
    keyBot?: string
    customerPhone?: string
    customerName?: string
    message?: string
    messageId?: string
    type?: 'text' | 'image' | 'video' | 'audio'
    url?: string | null
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

      // Detect message type and extract content
      let messageType: 'text' | 'image' | 'video' | 'audio' = 'text'
      let messageText = ''
      let mediaUrl: string | null = null

      if (incomingMessage.type === 'text') {
        messageType = 'text'
        messageText = incomingMessage.text?.body || ''
      } else if (incomingMessage.type === 'image') {
        messageType = 'image'
        messageText = incomingMessage.image?.caption || ''
        mediaUrl = incomingMessage.image?.id || null // Media ID to download later
        console.log('[META-API] Received image message:', { mediaId: mediaUrl, caption: messageText })
      } else if (incomingMessage.type === 'video') {
        messageType = 'video'
        messageText = incomingMessage.video?.caption || ''
        mediaUrl = incomingMessage.video?.id || null
        console.log('[META-API] Received video message:', { mediaId: mediaUrl, caption: messageText })
      } else if (incomingMessage.type === 'audio') {
        messageType = 'audio'
        messageText = '[Audio]'
        mediaUrl = incomingMessage.audio?.id || null
        console.log('[META-API] Received audio message:', { mediaId: mediaUrl })
      } else {
        // Unknown type, log it
        console.log('[META-API] Received unknown message type:', incomingMessage.type)
        messageText = `[${incomingMessage.type}]`
      }

      return {
        customerPhone: incomingMessage.from,
        customerName: contact?.profile?.name || null,
        message: messageText,
        messageId: incomingMessage.id,
        type: messageType,
        url: mediaUrl,
      }
    } catch (error) {
      console.error("[META-API] Failed to parse webhook:", error)
      return null
    }
  }
}

export const metaApiService = new MetaApiService()
