"use client"

interface MessageWithVariablesProps {
  text: string
  className?: string
  preview?: boolean // Si es true, muestra datos de ejemplo en lugar de variables
}

export function MessageWithVariables({ 
  text, 
  className = "",
  preview = false 
}: MessageWithVariablesProps) {
  // Si es preview, reemplazar variables con ejemplos
  let displayText = text
  if (preview) {
    displayText = text
      .replace(/\{nombre\}/gi, "María")
      .replace(/\{telefono\}/gi, "+54 11 5555-1234")
  }

  // Split text by variables pattern {variable}
  const parts = displayText.split(/(\{[^}]+\})/g)

  return (
    <span className={className}>
      {parts.map((part, index) => {
        // Check if part is a variable (solo si no es preview)
        if (!preview && part.match(/^\{[^}]+\}$/)) {
          return (
            <span
              key={index}
              className="inline-flex items-center px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium text-sm"
            >
              {part}
            </span>
          )
        }
        return <span key={index}>{part}</span>
      })}
    </span>
  )
}
