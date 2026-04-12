const { App } = require("@slack/bolt");
require("dotenv").config();

// Reuse the same Groq call your Next.js app already uses
const Groq = require("groq-sdk");
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const conversationHistories = {}; // store per-channel history

const systemPrompt = `You are Kairo, an AI-powered incident memory 
copilot for SRE teams. You have deep memory of past incidents across 
Razorpay, Stripe, Twilio, AWS S3, MSG91, SendGrid, and Cashfree.

FIRST message about an incident: give structured response with
BOUNDARY, ROOT_CAUSE, RESOLUTION_STEPS, SKIP, and MEMORY_REF.

FOLLOW-UP messages: answer in 2-3 sharp sentences like a senior SRE.
Never repeat the full structure for follow-ups.
Always reference past incidents by date to show memory.`;

async function askKairo(channelId, userMessage) {
  if (!conversationHistories[channelId]) {
    conversationHistories[channelId] = [];
  }

  const history = conversationHistories[channelId];

  const response = await groq.chat.completions.create({
    model: "qwen/qwen3-32b",
    messages: [
      { role: "system", content: systemPrompt },
      ...history,
      { role: "user", content: userMessage }
    ],
    temperature: 0.75,
    max_tokens: 500
  });

  const reply = response.choices[0].message.content;

  history.push({ role: "user", content: userMessage });
  history.push({ role: "assistant", content: reply });

  return reply;
}

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN
});

// Respond when @mentioned in a channel
app.event("app_mention", async ({ event, say }) => {
  const userMessage = event.text.replace(/<@[^>]+>/g, "").trim();
  try {
    await say({ text: "⏳ Kairo is thinking...", thread_ts: event.ts });
    const reply = await askKairo(event.channel, userMessage);
    await say({ text: reply, thread_ts: event.ts });
  } catch (err) {
    await say({ text: "❌ Kairo hit an error. Check GROQ_API_KEY.", thread_ts: event.ts });
  }
});

// Respond in DMs
app.event("message", async ({ event, say }) => {
  if (event.subtype || event.bot_id) return;
  try {
    const reply = await askKairo(event.channel, event.text);
    await say(reply);
  } catch (err) {
    await say("❌ Kairo hit an error.");
  }
});

(async () => {
  await app.start();
  console.log("⚡ Kairo Slack bot is running!");
})();
