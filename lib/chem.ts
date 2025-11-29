export function toSubscriptDigits(text: string): string {
  const map: Record<string, string> = {
    "0": "₀",
    "1": "₁",
    "2": "₂",
    "3": "₃",
    "4": "₄",
    "5": "₅",
    "6": "₆",
    "7": "₇",
    "8": "₈",
    "9": "₉",
  }
  // Replace only digit runs that follow letters, ) or ] — common in chemical formulae and units like CO2
  return text.replace(/(\d+)/g, (m, p1, offset, full) => {
    // If previous char exists and is a letter, ), ] or right after a lowercase/uppercase element symbol, subscript it
    const prev = offset > 0 ? full.charAt(offset - 1) : ""
    const shouldSub = /[A-Za-z)\]]/.test(prev)
    if (!shouldSub) return m
    return m
      .split("")
      .map((ch) => map[ch] ?? ch)
      .join("")
  })
}

export function formatChemicalLabel(text: string): string {
  return toSubscriptDigits(text)
}
