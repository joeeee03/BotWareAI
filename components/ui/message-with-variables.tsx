"use client"

interface MessageWithVariablesProps {
  text: string
  className?: string
}

export function MessageWithVariables({ text, className = "" }: MessageWithVariablesProps) {
  // Split text by variables pattern {variable}
  const parts = text.split(/(\{[^}]+\})/g)

  return (
    <span className={className}>
      {parts.map((part, index) => {
        // Check if part is a variable
        if (part.match(/^\{[^}]+\}$/)) {
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
