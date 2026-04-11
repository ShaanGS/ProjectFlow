import Groq from "groq-sdk"

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

export function hasGroqConfig() {
  return Boolean(process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== "your_groq_api_key")
}

export default groq
