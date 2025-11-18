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
            className="text-blue-600 dark:text-blue-400 font-medium underline decoration-2 underline-offset-2"
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
        {/* Input real */}
        <Input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            value && "[color:transparent] caret-black dark:caret-white [-webkit-text-fill-color:transparent] selection:bg-blue-200 dark:selection:bg-blue-800",
            className
          )}
        />
        {/* Overlay con texto estilizado - mismo padding y altura que el Input */}
        {value && (
          <div className="absolute left-0 top-0 right-0 bottom-0 px-3 flex items-center pointer-events-none overflow-hidden whitespace-nowrap text-base sm:text-sm leading-[2.5rem] sm:leading-[2.25rem]">
            {renderStyledText()}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Textarea real */}
      <Textarea
        ref={inputRef as React.RefObject<HTMLTextAreaElement>}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        className={cn(
          value && "[color:transparent] caret-black dark:caret-white [-webkit-text-fill-color:transparent] selection:bg-blue-200 dark:selection:bg-blue-800",
          className
        )}
      />
      {/* Overlay con texto estilizado - mismo padding que el Textarea */}
      {value && (
        <div className="absolute left-0 top-0 right-0 bottom-0 px-3 py-2 pointer-events-none overflow-hidden whitespace-pre-wrap break-words text-sm leading-5">
          {renderStyledText()}
        </div>
      )}
    </div>
  )
}
