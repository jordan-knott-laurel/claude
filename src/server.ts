// Intercom sidebar app server — Laurel's Claude assistant

import express, { Request, Response } from "express";
import { chat } from "./claude";
import { verifySignature } from "./signature";
import {
  initialCanvas,
  responseCanvas,
  errorCanvas,
} from "./canvas";

const app = express();

// Parse JSON bodies and capture raw body for signature verification
app.use(
  express.json({
    verify: (req: Request & { rawBody?: string }, _res, buf) => {
      req.rawBody = buf.toString();
    },
  })
);

// Health check
app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", app: "laurel-intercom-sidebar" });
});

// Initialize endpoint — called when an agent opens the app in the sidebar
app.post("/initialize", verifySignature, (req: Request, res: Response) => {
  const { conversation, contact } = req.body;

  // Store conversation context if available
  const storedData: Record<string, string> = {};
  if (conversation) {
    storedData.conversation_id = String(conversation.id || "");
  }
  if (contact) {
    storedData.contact_name = contact.name || contact.email || "Unknown";
  }

  const canvas = initialCanvas();
  if (Object.keys(storedData).length > 0) {
    canvas.canvas.stored_data = {
      ...canvas.canvas.stored_data,
      ...storedData,
    };
  }

  res.json(canvas);
});

// Submit endpoint — called when an agent interacts with a component
app.post("/submit", verifySignature, async (req: Request, res: Response) => {
  const {
    component_id,
    input_values,
    current_canvas,
    conversation,
    contact,
  } = req.body;

  // Reset conversation — return to initial canvas
  if (component_id === "reset_conversation") {
    res.json(initialCanvas());
    return;
  }

  // Handle message submission
  if (component_id === "send_message") {
    const userMessage = input_values?.user_message;

    if (!userMessage || !userMessage.trim()) {
      res.json(
        errorCanvas("Please enter a message before sending.")
      );
      return;
    }

    // Build conversation context from Intercom data
    let conversationContext: string | null = null;
    if (conversation?.source?.body) {
      const contactName =
        current_canvas?.stored_data?.contact_name ||
        contact?.name ||
        contact?.email ||
        "Customer";

      conversationContext = `**Customer (${contactName}):** ${conversation.source.body}`;

      if (conversation.conversation_parts?.conversation_parts) {
        for (const part of conversation.conversation_parts.conversation_parts) {
          if (part.body) {
            const author =
              part.author?.type === "admin" ? "Agent" : contactName;
            conversationContext += `\n**${author}:** ${part.body}`;
          }
        }
      }
    }

    // Rebuild message history from stored data
    const previousMessages: Array<{
      role: "user" | "assistant";
      content: string;
    }> = [];
    const storedHistory =
      current_canvas?.stored_data?.conversation_history;
    if (storedHistory) {
      try {
        const parsed = JSON.parse(storedHistory);
        if (Array.isArray(parsed)) {
          previousMessages.push(...parsed);
        }
      } catch {
        // ignore malformed history
      }
    }

    try {
      const claudeResponse = await chat(
        userMessage.trim(),
        conversationContext,
        previousMessages
      );

      // Update conversation history for follow-ups
      const updatedHistory = [
        ...previousMessages,
        { role: "user", content: userMessage.trim() },
        { role: "assistant", content: claudeResponse },
      ];

      res.json(
        responseCanvas(
          userMessage.trim(),
          claudeResponse,
          JSON.stringify(updatedHistory)
        )
      );
    } catch (err) {
      console.error("Claude API error:", err);
      res.json(
        errorCanvas(
          "Something went wrong reaching Claude. Please try again."
        )
      );
    }
    return;
  }

  // Unknown component — return initial canvas
  res.json(initialCanvas());
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Laurel Intercom sidebar app running on port ${PORT}`);
});

export default app;
