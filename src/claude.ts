// Claude API integration for Laurel's assistant

import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

const DEFAULT_MODEL = "claude-sonnet-4-20250514";

const DEFAULT_SYSTEM_PROMPT = `You are Laurel, an AI assistant embedded in the Intercom inbox sidebar. You help support agents handle customer conversations effectively.

Your capabilities:
- Analyze the current customer conversation and provide context
- Draft reply suggestions for the agent
- Answer questions about policies, procedures, or technical details
- Summarize long conversation threads
- Suggest next steps or escalation paths

Guidelines:
- Be concise — agents are working fast and need quick, actionable answers
- When drafting replies, match a professional but friendly support tone
- If you're given conversation context, reference specific details from it
- Format responses with markdown for readability (bold, lists, etc.)
- If you don't have enough context, say so and ask for clarification`;

interface Message {
  role: "user" | "assistant";
  content: string;
}

export async function chat(
  userMessage: string,
  conversationContext: string | null,
  previousMessages: Message[] = []
): Promise<string> {
  const model = process.env.CLAUDE_MODEL || DEFAULT_MODEL;
  const systemPrompt = process.env.LAUREL_SYSTEM_PROMPT || DEFAULT_SYSTEM_PROMPT;

  let system = systemPrompt;
  if (conversationContext) {
    system += `\n\n## Current Intercom Conversation\n${conversationContext}`;
  }

  const messages: Message[] = [
    ...previousMessages,
    { role: "user", content: userMessage },
  ];

  const response = await client.messages.create({
    model,
    max_tokens: 1024,
    system,
    messages,
  });

  const textBlock = response.content.find((block) => block.type === "text");
  return textBlock ? textBlock.text : "No response generated.";
}
