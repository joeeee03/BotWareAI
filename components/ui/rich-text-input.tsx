"use client"

import { useRef } from "react"
import { cn } from "@/lib/utils"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"

interface RichTextInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  rows?: number
  disabled?: boolean
  singleLine?: boolean
  onKeyDown?: (e: React.KeyboardEvent) => void
}

export function RichTextInput({
  value,
  onChange,
  placeholder = "",
  className = "",
  rows = 4,
  disabled = false,
  singleLine = false,
  onKeyDown: externalOnKeyDown,
}: RichTextInputProps) {
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null)

  // Renderizar texto con variables estilizadas
  const renderStyledText = () => {
    if (!value) return null

    const parts = value.split(/(\{nombre\}|\{telefono\})/gi)
    
    return parts.map((part, index) => {
      if (part.match(/^\{(nombre|telefono)\}$/i)) {
        return (
          <span
            key={index}
            className="inline-flex items-center px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium text-sm mx-0.5"
          >
            {part}
          </span>
        )
      }
      return <span key={index}>{part}</span>
    })
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    onChange(e.target.value)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    if (externalOnKeyDown) {
      externalOnKeyDown(e)
    }
  }

  if (singleLine) {
    return (
      <div className="relative">
        {/* Overlay con texto estilizado */}
        <div className="absolute inset-0 px-3 py-2 pointer-events-none overflow-hidden whitespace-nowrap flex items-center text-sm">
          {renderStyledText()}
        </div>
        {/* Input real (invisible cuando hay contenido) */}
        <Input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            value && "text-transparent caret-black dark:caret-white",
            className
          )}
        />
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Overlay con texto estilizado */}
      <div className="absolute inset-0 px-3 py-2 pointer-events-none overflow-auto whitespace-pre-wrap break-words text-sm">
        {renderStyledText()}
      </div>
      {/* Textarea real (invisible cuando hay contenido) */}
      <Textarea
        ref={inputRef as React.RefObject<HTMLTextAreaElement>}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        className={cn(
          value && "text-transparent caret-black dark:caret-white",
          className
        )}
      />
    </div>
  )
}
