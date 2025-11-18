"use client"

import { useEffect, useState } from "react"
import { MessageSquare } from "lucide-react"
import { apiClient } from "@/lib/api-client"

interface Template {
  id: number
  title: string
  message: string
  shortcut?: string
  category?: string
}

interface TemplatesMenuProps {
  onSelect: (message: string) => void
  onClose: () => void
  searchQuery: string
}

export function TemplatesMenu({ onSelect, onClose, searchQuery }: TemplatesMenuProps) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    try {
      const response = await apiClient.getTemplates()
      setTemplates(response.templates || [])
    } catch (error) {
      console.error("Error loading templates:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Filter templates by shortcut or title
  const filteredTemplates = templates.filter(t => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      t.title.toLowerCase().includes(query) ||
      t.shortcut?.toLowerCase().includes(query) ||
      t.message.toLowerCase().includes(query)
    )
  })

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedIndex((prev) => 
          prev < filteredTemplates.length - 1 ? prev + 1 : prev
        )
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0))
      } else if (e.key === "Enter") {
        e.preventDefault()
        if (filteredTemplates[selectedIndex]) {
          onSelect(filteredTemplates[selectedIndex].message)
        }
      } else if (e.key === "Escape") {
        onClose()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [selectedIndex, filteredTemplates, onSelect, onClose])

  if (isLoading) {
    return (
      <div className="absolute bottom-full mb-2 left-0 bg-white dark:bg-slate-800 border-2 dark:border-blue-500 border-blue-400 rounded-xl shadow-2xl p-4 min-w-[350px] max-w-md backdrop-blur-xl">
        <p className="text-sm text-slate-500 flex items-center gap-2">
          <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
          Cargando templates...
        </p>
      </div>
    )
  }

  if (filteredTemplates.length === 0) {
    return (
      <div className="absolute bottom-full mb-2 left-0 bg-white dark:bg-slate-800 border-2 dark:border-slate-600 border-slate-300 rounded-xl shadow-2xl p-4 min-w-[350px] max-w-md backdrop-blur-xl">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {searchQuery ? (
            <>
              🔍 No se encontraron templates para "<span className="font-semibold">{searchQuery}</span>"
            </>
          ) : (
            <>
              💡 No hay templates. Créalos en <span className="font-semibold">Configuración ⚙️</span>
            </>
          )}
        </p>
      </div>
    )
  }

  return (
    <div className="absolute bottom-full mb-2 left-0 bg-white/95 dark:bg-slate-800/95 border-2 dark:border-blue-500 border-blue-400 rounded-xl shadow-2xl overflow-hidden min-w-[350px] max-w-md backdrop-blur-xl">
      <div className="px-4 py-3 border-b dark:border-slate-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800">
        <p className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-blue-500" />
          <span>Templates disponibles {filteredTemplates.length > 0 && `(${filteredTemplates.length})`}</span>
        </p>
        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
          ↑↓ navegar • Enter seleccionar • Esc cerrar
        </p>
      </div>
      <div className="max-h-72 overflow-y-auto">
        {filteredTemplates.map((template, index) => (
          <button
            key={template.id}
            onClick={() => onSelect(template.message)}
            className={`
              w-full text-left px-4 py-3 transition-all duration-150 border-b last:border-b-0 dark:border-slate-700/50 border-slate-200/50
              ${index === selectedIndex 
                ? "bg-blue-100 dark:bg-blue-900/30 border-l-4 border-l-blue-500" 
                : "hover:bg-slate-50 dark:hover:bg-slate-700/50"
              }
            `}
          >
            <div className="flex items-center justify-between gap-3 mb-1">
              <p className={`font-semibold text-sm ${index === selectedIndex ? "text-blue-700 dark:text-blue-300" : "text-slate-800 dark:text-slate-200"}`}>
                {template.title}
              </p>
              {template.shortcut && (
                <span className="text-[10px] font-mono bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300 px-2 py-1 rounded-md">
                  /{template.shortcut}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
              {template.message}
            </p>
          </button>
        ))}
      </div>
    </div>
  )
}
