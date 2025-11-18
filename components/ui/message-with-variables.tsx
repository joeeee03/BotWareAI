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
              className="text-blue-600 dark:text-blue-400 font-medium underline decoration-2 underline-offset-2"
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
