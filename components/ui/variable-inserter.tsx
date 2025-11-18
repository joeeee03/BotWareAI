"use client"

import { useState, useRef, useEffect } from "react"
import { Braces } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Variable {
  key: string
  label: string
  description: string
}

const AVAILABLE_VARIABLES: Variable[] = [
  { key: "nombre", label: "Nombre", description: "Nombre del cliente" },
  { key: "telefono", label: "Teléfono", description: "Número de teléfono" },
]

interface VariableInserterProps {
  onInsert: (variable: string) => void
  className?: string
}

export function VariableInserter({ onInsert, className = "" }: VariableInserterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  const handleInsert = (variable: Variable) => {
    onInsert(`{${variable.key}}`)
    setIsOpen(false)
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="h-8 w-8 p-0"
        title="Insertar variable"
      >
        <Braces className="h-4 w-4" />
      </Button>

      {isOpen && (
        <div className="absolute bottom-full mb-2 right-0 bg-white dark:bg-slate-800 border-2 dark:border-blue-500 border-blue-400 rounded-lg shadow-2xl overflow-hidden min-w-[220px] z-50 backdrop-blur-xl">
          <div className="px-3 py-2 border-b dark:border-slate-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800">
            <p className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Braces className="h-3 w-3 text-blue-500" />
              Variables disponibles
            </p>
          </div>
          <div className="py-1">
            {AVAILABLE_VARIABLES.map((variable) => (
              <button
                key={variable.key}
                onClick={() => handleInsert(variable)}
                className="w-full text-left px-3 py-2 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-semibold text-blue-600 dark:text-blue-400">
                    {`{${variable.key}}`}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {variable.description}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
