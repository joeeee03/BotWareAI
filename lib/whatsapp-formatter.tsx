// WhatsApp-style message formatting utility
import React from 'react'

export interface FormatOptions {
  enableBold?: boolean
  enableItalic?: boolean
  enableStrikethrough?: boolean
  enableMonospace?: boolean
  enableQuotes?: boolean
}

const defaultOptions: FormatOptions = {
  enableBold: true,
  enableItalic: true,
  enableStrikethrough: true,
  enableMonospace: true,
  enableQuotes: true,
}

// WhatsApp formatting patterns
const PATTERNS = {
  // Bold: *text* (but not **text**)
  bold: /\*([^*\n]+)\*/g,
  // Italic: _text_ (but not __text__)
  italic: /_([^_\n]+)_/g,
  // Strikethrough: ~text~
  strikethrough: /~([^~\n]+)~/g,
  // Monospace: `text` or ```multiline```
  monospace: /```([\s\S]*?)```|`([^`\n]+)`/g,
  // Quotes: > text (at start of line)
  quote: /^>\s*(.+)$/gm,
}

export function formatWhatsAppText(
  text: string,
  options: FormatOptions = defaultOptions
): React.ReactNode {
  if (!text) return text

  let formattedText = text
  const elements: Array<{ start: number; end: number; component: React.ReactNode }> = []

  // Process multiline code blocks first (```code```)
  if (options.enableMonospace) {
    let match: RegExpExecArray | null
    const codeBlockRegex = /```([\s\S]*?)```/g
    while ((match = codeBlockRegex.exec(text)) !== null) {
      elements.push({
        start: match.index,
        end: match.index + match[0].length,
        component: (
          <pre className="bg-slate-100 dark:bg-slate-800 p-2 rounded text-sm font-mono whitespace-pre-wrap my-1 border-l-4 border-blue-400">
            {match[1]}
          </pre>
        ),
      })
    }
  }

  // Process quotes (> text)
  if (options.enableQuotes) {
    let match: RegExpExecArray | null
    const quoteRegex = /^>\s*(.+)$/gm
    while ((match = quoteRegex.exec(text)) !== null) {
      // Skip if this text is already inside a code block
      const isInCodeBlock = elements.some(
        (el) => match!.index >= el.start && match!.index < el.end
      )
      if (!isInCodeBlock) {
        elements.push({
          start: match.index,
          end: match.index + match[0].length,
          component: (
            <div className="border-l-4 border-slate-400 pl-3 py-1 my-1 bg-slate-50 dark:bg-slate-800/50 italic text-slate-600 dark:text-slate-400">
              {match[1]}
            </div>
          ),
        })
      }
    }
  }

  // Sort elements by start position (reverse order for replacement)
  elements.sort((a, b) => b.start - a.start)

  // Replace elements from end to start to maintain indices
  let result: React.ReactNode = text
  elements.forEach((element, index) => {
    const before = text.substring(0, element.start)
    const after = text.substring(element.end)
    result = (
      <>
        {before}
        {element.component}
        {after}
      </>
    )
    text = before + after // Update text for next iteration
  })

  // Process inline formatting (bold, italic, strikethrough, inline code)
  if (typeof result === 'string') {
    result = processInlineFormatting(result, options)
  }

  return result
}

function processInlineFormatting(text: string, options: FormatOptions): React.ReactNode {
  const parts: Array<React.ReactNode> = []
  let lastIndex = 0

  // Create a combined regex for all inline patterns
  const patterns: Array<{ regex: RegExp; type: string }> = []
  
  if (options.enableMonospace) {
    patterns.push({ regex: /`([^`\n]+)`/g, type: 'monospace' })
  }
  if (options.enableBold) {
    patterns.push({ regex: /\*([^*\n]+)\*/g, type: 'bold' })
  }
  if (options.enableItalic) {
    patterns.push({ regex: /_([^_\n]+)_/g, type: 'italic' })
  }
  if (options.enableStrikethrough) {
    patterns.push({ regex: /~([^~\n]+)~/g, type: 'strikethrough' })
  }

  // Find all matches
  const matches: Array<{
    start: number
    end: number
    content: string
    type: string
  }> = []

  patterns.forEach(({ regex, type }) => {
    let match: RegExpExecArray | null
    regex.lastIndex = 0 // Reset regex
    while ((match = regex.exec(text)) !== null) {
      matches.push({
        start: match.index,
        end: match.index + match[0].length,
        content: match[1],
        type,
      })
    }
  })

  // Sort matches by start position
  matches.sort((a, b) => a.start - b.start)

  // Remove overlapping matches (keep first one)
  const filteredMatches = matches.filter((match, index) => {
    for (let i = 0; i < index; i++) {
      const prevMatch = matches[i]
      if (
        (match.start >= prevMatch.start && match.start < prevMatch.end) ||
        (match.end > prevMatch.start && match.end <= prevMatch.end)
      ) {
        return false
      }
    }
    return true
  })

  // Build the result
  filteredMatches.forEach((match, index) => {
    // Add text before this match
    if (match.start > lastIndex) {
      parts.push(text.substring(lastIndex, match.start))
    }

    // Add formatted match
    switch (match.type) {
      case 'bold':
        parts.push(<strong key={`bold-${index}`}>{match.content}</strong>)
        break
      case 'italic':
        parts.push(<em key={`italic-${index}`}>{match.content}</em>)
        break
      case 'strikethrough':
        parts.push(
          <span key={`strike-${index}`} className="line-through">
            {match.content}
          </span>
        )
        break
      case 'monospace':
        parts.push(
          <code
            key={`mono-${index}`}
            className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-sm font-mono"
          >
            {match.content}
          </code>
        )
        break
    }

    lastIndex = match.end
  })

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex))
  }

  return parts.length > 1 ? <>{parts}</> : parts[0] || text
}

// Helper function to strip formatting for plain text display (e.g., in conversation list)
export function stripWhatsAppFormatting(text: string): string {
  if (!text) return text

  return text
    .replace(/```[\s\S]*?```/g, '[código]')
    .replace(/`([^`\n]+)`/g, '$1')
    .replace(/\*([^*\n]+)\*/g, '$1')
    .replace(/_([^_\n]+)_/g, '$1')
    .replace(/~([^~\n]+)~/g, '$1')
    .replace(/^>\s*(.+)$/gm, '$1')
}
