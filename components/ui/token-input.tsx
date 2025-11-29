"use client"

import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

export type TokenInputProps = {
  id?: string
  placeholder?: string
  value: string[]
  onChange: (tokens: string[]) => void
  className?: string
  disabled?: boolean
  // If true, split on comma and space as user types; otherwise only on Enter
  splitOnComma?: boolean
  // Optional validator; return true to accept the token
  validateToken?: (t: string) => boolean
}

export function TokenInput({
  id,
  placeholder,
  value,
  onChange,
  className,
  disabled,
  splitOnComma = true,
  validateToken,
}: TokenInputProps) {
  const [input, setInput] = React.useState("")
  const inputRef = React.useRef<HTMLInputElement | null>(null)

  const addToken = React.useCallback(
    (raw: string) => {
      const t = raw.trim()
      if (!t) return
      if (validateToken && !validateToken(t)) return
      if (value.includes(t)) return
      onChange([...value, t])
      setInput("")
    },
    [onChange, validateToken, value]
  )

  const removeToken = React.useCallback(
    (t: string) => onChange(value.filter((v) => v !== t)),
    [onChange, value]
  )

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return
    if (e.key === "Enter" || e.key === "Tab") {
      if (input.trim()) {
        e.preventDefault()
        addToken(input)
      }
    } else if (e.key === "," && splitOnComma) {
      e.preventDefault()
      addToken(input)
    } else if (e.key === "Backspace" && input.length === 0 && value.length > 0) {
      // Backspace removes the last token when input is empty
      removeToken(value[value.length - 1])
    }
  }

  const onPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    if (!splitOnComma) return
    const text = e.clipboardData.getData("text")
    if (text.includes(",")) {
      e.preventDefault()
      text
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .forEach(addToken)
    }
  }

  const containerClass = cn(
    // Dimensions & layout
    "h-9 w-full rounded-md border px-3 py-1 flex flex-wrap items-center gap-1 outline-none shadow-xs transition-[color,box-shadow]",
    // Light mode: match Input/Textarea (hole effect)
    "bg-background text-foreground border-border",
    // Dark mode: darker field
    "dark:bg-slate-900/60 dark:border-slate-600",
    // Focus ring (same as inputs)
    "focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]",
    disabled && "opacity-50 cursor-not-allowed",
    className
  )

  return (
    <div className={containerClass} onClick={() => inputRef.current?.focus()}>
      {value.map((t) => (
        <span
          key={t}
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs",
            "bg-primary/10 border-primary/30 text-foreground",
            "dark:bg-primary/20 dark:border-primary/40"
          )}
        >
          {t}
          <button
            type="button"
            aria-label={`Remove ${t}`}
            className="ml-1 rounded-full p-0.5 hover:bg-primary/20"
            onClick={(e) => {
              e.stopPropagation()
              removeToken(t)
            }}
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <input
        id={id}
        ref={inputRef}
        value={input}
        disabled={disabled}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={onKeyDown}
        onPaste={onPaste}
        onBlur={() => addToken(input)}
        placeholder={placeholder}
        className={cn(
          "flex-1 bg-transparent outline-none border-0 h-7 px-1",
          // Placeholder tokens
          "placeholder:text-muted-foreground dark:placeholder:text-slate-400",
          "min-w-[8ch]"
        )}
      />
    </div>
  )
}
