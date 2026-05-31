function stripOuterMarkdownFence(content: string) {
  const t = content.trim()
  const lines = t.split("\n")
  if (lines.length >= 2) {
    const first = lines[0].trim()
    const last = lines[lines.length - 1].trim()
    if (
      /^```(?:markdown|md|text)?$/i.test(first) &&
      last === "```"
    ) {
      return lines.slice(1, -1).join("\n").trim()
    }
  }
  const singleLine = t.match(/^```(?:markdown|md|text)?\s+([\s\S]*)```\s*$/i)
  if (singleLine) return singleLine[1].trim()
  return t
}

export function cleanModelOutput(content: string | null | undefined) {
  if (!content) return "No response generated."

  let out = content
    .replace(/<redacted_thinking>[\s\S]*?<\/redacted_thinking>/gi, "")
    .trim()

  out = stripOuterMarkdownFence(out)
  return out.trim()
}
