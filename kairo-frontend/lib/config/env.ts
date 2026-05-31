const REQUIRED_ENV_VARS = ["NODE_ENV"] as const

type RequiredEnvVar = (typeof REQUIRED_ENV_VARS)[number]

function requireEnv(name: RequiredEnvVar) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}. Kairo cannot start without it.`)
  }
  return value
}

export const kairoConfig = {
  nodeEnv: requireEnv("NODE_ENV"),
  groqApiKey: process.env.GROQ_API_KEY,
  groqModel: process.env.GROQ_MODEL ?? "qwen/qwen3-32b",
  memorySource: "data/incidents-seed.json",
} as const

export function hasAgentLlmConfig() {
  return Boolean(kairoConfig.groqApiKey)
}

