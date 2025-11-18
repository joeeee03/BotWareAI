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
      <div className="absolute bottom-full mb-2 left-0 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg shadow-xl p-3 min-w-[300px] max-w-md">
        <p className="text-sm text-slate-500">Cargando templates...</p>
      </div>
    )
  }

  if (filteredTemplates.length === 0) {
    return (
      <div className="absolute bottom-full mb-2 left-0 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg shadow-xl p-3 min-w-[300px] max-w-md">
        <p className="text-sm text-slate-500">
          {searchQuery ? "No se encontraron templates" : "No hay templates. Créalos en Configuración ⚙️"}
        </p>
      </div>
    )
  }

  return (
    <div className="absolute bottom-full mb-2 left-0 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg shadow-2xl overflow-hidden min-w-[300px] max-w-md">
      <div className="p-2 border-b dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
        <p className="text-xs text-slate-500 flex items-center gap-1">
          <MessageSquare className="h-3 w-3" />
          Templates disponibles (↑↓ para navegar, Enter para seleccionar)
        </p>
      </div>
      <div className="max-h-64 overflow-y-auto">
        {filteredTemplates.map((template, index) => (
          <button
            key={template.id}
            onClick={() => onSelect(template.message)}
            className={`
              w-full text-left px-3 py-2 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors
              ${index === selectedIndex ? "bg-blue-100 dark:bg-slate-700" : ""}
            `}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium text-sm">{template.title}</p>
              {template.shortcut && (
                <span className="text-xs bg-slate-200 dark:bg-slate-600 px-2 py-0.5 rounded">
                  {template.shortcut}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 truncate mt-1">
              {template.message}
            </p>
          </button>
        ))}
      </div>
    </div>
  )
}
