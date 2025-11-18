"use client"

import { forwardRef } from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface InputWithVariablesProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string
}

export const InputWithVariables = forwardRef<HTMLInputElement, InputWithVariablesProps>(
  ({ value, className, ...props }, ref) => {
    // Render highlighted text overlay
    const renderHighlightedText = () => {
      if (!value) return null

      const parts = value.split(/(\{[^}]+\})/g)
      
      return (
        <div className="absolute inset-0 px-3 py-2 flex items-center pointer-events-none overflow-hidden whitespace-nowrap">
          <div className="flex items-center gap-0.5">
            {parts.map((part, index) => {
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
              return <span key={index} className="opacity-0">{part}</span>
            })}
          </div>
        </div>
      )
    }

    return (
      <div className="relative">
        {renderHighlightedText()}
        <Input
          ref={ref}
          value={value}
          className={cn("relative bg-transparent", className)}
          style={{ color: value.includes('{') ? 'transparent' : undefined }}
          {...props}
        />
      </div>
    )
  }
)

InputWithVariables.displayName = "InputWithVariables"
