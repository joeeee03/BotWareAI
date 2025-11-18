"use client"

import { useRef, useEffect, useState } from "react"
import { cn } from "@/lib/utils"

interface RichTextInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  rows?: number
  disabled?: boolean
  singleLine?: boolean // If true, acts like an input (one line only)
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
  const editorRef = useRef<HTMLDivElement>(null)
  const [isFocused, setIsFocused] = useState(false)

  // Convert plain text to HTML with styled variables
  const textToHtml = (text: string): string => {
    if (!text) return ""
    
    // Escape HTML first
    const escaped = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
    
    // Replace variables with styled spans
    const withVariables = escaped.replace(
      /\{(nombre|telefono)\}/gi,
      '<span class="variable-tag" contenteditable="false">{$1}</span>'
    )
    
    // Convert newlines to <br>
    return withVariables.replace(/\n/g, "<br>")
  }

  // Convert HTML back to plain text
  const htmlToText = (html: string): string => {
    const temp = document.createElement("div")
    temp.innerHTML = html
    
    // Replace <br> with newlines
    const text = temp.innerHTML
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<div>/gi, "\n")
      .replace(/<\/div>/gi, "")
    
    temp.innerHTML = text
    return temp.textContent || ""
  }

  // Update editor content when value changes externally
  useEffect(() => {
    if (!editorRef.current) return
    
    const currentText = htmlToText(editorRef.current.innerHTML)
    if (currentText !== value) {
      const selection = window.getSelection()
      const range = selection?.rangeCount ? selection.getRangeAt(0) : null
      const cursorOffset = range ? range.startOffset : 0
      
      editorRef.current.innerHTML = textToHtml(value)
      
      // Restore cursor position
      if (range && editorRef.current.childNodes.length > 0) {
        try {
          const newRange = document.createRange()
          const textNode = editorRef.current.childNodes[0]
          if (textNode) {
            newRange.setStart(textNode, Math.min(cursorOffset, textNode.textContent?.length || 0))
            newRange.collapse(true)
            selection?.removeAllRanges()
            selection?.addRange(newRange)
          }
        } catch (e) {
          // Cursor positioning failed, that's ok
        }
      }
    }
  }, [value])

  const handleInput = () => {
    if (!editorRef.current) return
    const newText = htmlToText(editorRef.current.innerHTML)
    onChange(newText)
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const text = e.clipboardData.getData("text/plain")
    document.execCommand("insertText", false, text)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Call external onKeyDown if provided
    if (externalOnKeyDown) {
      externalOnKeyDown(e)
      if (e.defaultPrevented) return
    }

    // In singleLine mode, prevent Enter from adding newlines
    if (singleLine && e.key === "Enter") {
      return // Let external handler deal with it
    }

    // In multiline mode, handle Enter normally
    if (!singleLine && e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      document.execCommand("insertText", false, "\n")
    }
  }

  const minHeight = singleLine ? 40 : rows * 24 // single line or multiple rows

  return (
    <div className="relative">
      <div
        ref={editorRef}
        contentEditable={!disabled}
        onInput={handleInput}
        onPaste={handlePaste}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={cn(
          "w-full px-3 py-2 text-sm rounded-md border bg-background",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          singleLine ? "overflow-hidden whitespace-nowrap" : "overflow-auto whitespace-pre-wrap break-words",
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
        style={{ 
          minHeight: `${minHeight}px`,
          maxHeight: singleLine ? `${minHeight}px` : undefined 
        }}
        data-placeholder={placeholder}
      />
      
      {!value && !isFocused && (
        <div className="absolute left-3 top-2 text-sm text-muted-foreground pointer-events-none">
          {placeholder}
        </div>
      )}

      <style jsx>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
        }
        
        .variable-tag {
          display: inline-flex;
          align-items: center;
          padding: 2px 6px;
          border-radius: 4px;
          background-color: rgb(219, 234, 254);
          color: rgb(29, 78, 216);
          font-weight: 500;
          font-size: 0.875rem;
          margin: 0 1px;
        }
        
        :global(.dark) .variable-tag {
          background-color: rgba(59, 130, 246, 0.3);
          color: rgb(147, 197, 253);
        }
      `}</style>
    </div>
  )
}
