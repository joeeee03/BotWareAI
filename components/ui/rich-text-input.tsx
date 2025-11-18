"use client"

import { useRef, useEffect } from "react"
import { cn } from "@/lib/utils"

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
  const editorRef = useRef<HTMLDivElement>(null)

  const handleInput = () => {
    if (!editorRef.current) return
    
    // Guardar posición del cursor
    const sel = window.getSelection()
    let cursorPos = 0
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0)
      const preCaretRange = range.cloneRange()
      preCaretRange.selectNodeContents(editorRef.current)
      preCaretRange.setEnd(range.endContainer, range.endOffset)
      cursorPos = preCaretRange.toString().length
    }
    
    // Obtener texto plano
    const text = editorRef.current.innerText
    onChange(text)
    
    // Aplicar estilos a variables
    const styledHTML = text.replace(
      /\{(nombre|telefono)\}/gi,
      '<span style="color: #2563eb; text-decoration: underline; font-weight: 500;">$&</span>'
    )
    
    // Solo actualizar si el HTML cambió
    if (editorRef.current.innerHTML !== styledHTML) {
      editorRef.current.innerHTML = styledHTML
      
      // Restaurar cursor
      try {
        const range = document.createRange()
        const sel = window.getSelection()
        let charCount = 0
        let foundPosition = false
        
        const traverseNodes = (node: Node): boolean => {
          if (node.nodeType === Node.TEXT_NODE) {
            const textLength = node.textContent?.length || 0
            if (charCount + textLength >= cursorPos) {
              range.setStart(node, cursorPos - charCount)
              range.collapse(true)
              foundPosition = true
              return true
            }
            charCount += textLength
          } else {
            for (let i = 0; i < node.childNodes.length; i++) {
              if (traverseNodes(node.childNodes[i])) {
                return true
              }
            }
          }
          return false
        }
        
        traverseNodes(editorRef.current)
        
        if (foundPosition && sel) {
          sel.removeAllRanges()
          sel.addRange(range)
        }
      } catch (e) {
        // Cursor restoration failed
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (externalOnKeyDown) {
      externalOnKeyDown(e)
    }
    
    if (singleLine && e.key === 'Enter') {
      e.preventDefault()
    }
  }

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerText !== value) {
      editorRef.current.innerText = value
      
      // Aplicar estilos inmediatamente al cargar
      const styledHTML = value.replace(
        /\{(nombre|telefono)\}/gi,
        '<span style="color: #2563eb; text-decoration: underline; font-weight: 500;">$&</span>'
      )
      editorRef.current.innerHTML = styledHTML
    }
  }, [value])

  const minHeight = singleLine ? '2.5rem' : `${rows * 1.5}rem`

  return (
    <div
      ref={editorRef}
      contentEditable={!disabled}
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      data-placeholder={placeholder}
      className={cn(
        "w-full px-3 py-2 text-sm rounded-md border border-input bg-background",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        singleLine ? "overflow-hidden whitespace-nowrap" : "overflow-auto whitespace-pre-wrap",
        "empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      style={{ minHeight }}
    />
  )
}
