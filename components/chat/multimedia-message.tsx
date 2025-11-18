// [TAG: UI]
// [TAG: Multimedia]
// Component to render multimedia messages (text, image, video, audio)

"use client"

import React, { useState } from "react"
import { cn } from "@/lib/utils"
import { formatWhatsAppText } from "@/lib/whatsapp-formatter"
import { Download, Play, Volume2 } from "lucide-react"

interface MultimediaMessageProps {
  type: "text" | "image" | "video" | "audio"
  message: string | null
  url: string | null
  sender: "user" | "bot"
  className?: string
}

export function MultimediaMessage({ type, message, url, sender, className }: MultimediaMessageProps) {
  const [isImageLoading, setIsImageLoading] = useState(true)
  const [imageError, setImageError] = useState(false)

  // Render based on message type
  switch (type) {
    case "image":
      return (
        <div className={cn("flex flex-col gap-2", className)}>
          {url && (
            <div className="relative rounded-lg overflow-hidden bg-slate-800/50 max-w-xs sm:max-w-sm">
              {isImageLoading && !imageError && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-800/80">
                  <div className="w-8 h-8 border-4 border-slate-600 border-t-blue-500 rounded-full animate-spin"></div>
                </div>
              )}
              {imageError ? (
                <div className="p-8 text-center">
                  <div className="text-slate-400 text-sm">
                    ⚠️ Error al cargar imagen
                  </div>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 text-xs mt-2 inline-flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" />
                    Descargar
                  </a>
                </div>
              ) : (
                <img
                  src={url}
                  alt="Imagen del mensaje"
                  className="w-full h-auto max-h-96 object-contain"
                  onLoad={() => setIsImageLoading(false)}
                  onError={() => {
                    setIsImageLoading(false)
                    setImageError(true)
                  }}
                />
              )}
            </div>
          )}
          {message && (
            <div className="text-[15px] sm:text-base break-words leading-relaxed">
              {formatWhatsAppText(message)}
            </div>
          )}
        </div>
      )

    case "video":
      return (
        <div className={cn("flex flex-col gap-2", className)}>
          {url && (
            <div className="relative rounded-lg overflow-hidden bg-slate-800/50 max-w-xs sm:max-w-sm">
              <video
                controls
                className="w-full h-auto max-h-96"
                preload="metadata"
              >
                <source src={url} type="video/mp4" />
                <source src={url} type="video/webm" />
                <source src={url} type="video/ogg" />
                Tu navegador no soporta el elemento de video.
              </video>
            </div>
          )}
          {message && (
            <div className="text-[15px] sm:text-base break-words leading-relaxed">
              {formatWhatsAppText(message)}
            </div>
          )}
        </div>
      )

    case "audio":
      return (
        <div className={cn("flex flex-col gap-2", className)}>
          {url ? (
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-slate-800/50 max-w-xs">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                <Volume2 className="w-5 h-5 text-white" />
              </div>
              <audio controls className="flex-1">
                <source src={url} type="audio/mpeg" />
                <source src={url} type="audio/ogg" />
                <source src={url} type="audio/wav" />
                Tu navegador no soporta el elemento de audio.
              </audio>
            </div>
          ) : (
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-slate-800/50">
              <div className="w-10 h-10 rounded-full bg-blue-600/50 flex items-center justify-center flex-shrink-0">
                <Volume2 className="w-5 h-5 text-white/70" />
              </div>
              <div className="text-sm text-slate-400">
                🎵 Audio (no disponible)
              </div>
            </div>
          )}
          {message && (
            <div className="text-[15px] sm:text-base break-words leading-relaxed">
              {formatWhatsAppText(message)}
            </div>
          )}
        </div>
      )

    case "text":
    default:
      return (
        <div className={cn("text-[15px] sm:text-base break-words leading-relaxed", className)}>
          {message ? formatWhatsAppText(message) : "(Mensaje vacío)"}
        </div>
      )
  }
}
