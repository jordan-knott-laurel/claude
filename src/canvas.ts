// Canvas Kit component builders for Intercom sidebar UI

interface Component {
  type: string;
  [key: string]: unknown;
}

interface Canvas {
  canvas: {
    content: {
      components: Component[];
    };
    stored_data?: Record<string, string>;
  };
}

export function buildCanvas(
  components: Component[],
  storedData?: Record<string, string>
): Canvas {
  return {
    canvas: {
      content: { components },
      ...(storedData && { stored_data: storedData }),
    },
  };
}

export function text(
  content: string,
  style?: "header" | "muted" | "error" | "paragraph"
): Component {
  return {
    type: "text",
    text: content,
    ...(style && { style }),
  };
}

export function textarea(
  id: string,
  label: string,
  placeholder?: string,
  value?: string
): Component {
  return {
    type: "textarea",
    id,
    label,
    ...(placeholder && { placeholder }),
    ...(value && { value }),
  };
}

export function input(
  id: string,
  label: string,
  placeholder?: string,
  value?: string
): Component {
  return {
    type: "input",
    id,
    label,
    ...(placeholder && { placeholder }),
    ...(value && { value }),
  };
}

export function button(
  id: string,
  label: string,
  style: "primary" | "secondary" | "link" = "secondary",
  action: "submit" | "url" = "submit"
): Component {
  return {
    type: "button",
    id,
    label,
    style,
    action: { type: action },
  };
}

export function spacer(size: "xs" | "s" | "m" | "l" | "xl" = "m"): Component {
  return { type: "spacer", size };
}

export function divider(): Component {
  return { type: "divider" };
}

// Build the initial chat canvas shown when the app loads in the sidebar
export function initialCanvas(): Canvas {
  return buildCanvas([
    text("**Laurel — Claude Assistant**", "header"),
    text(
      "Ask Claude anything about this conversation or get help drafting a response.",
      "muted"
    ),
    spacer("s"),
    divider(),
    spacer("s"),
    textarea(
      "user_message",
      "Message",
      "Ask Claude for help with this conversation..."
    ),
    spacer("s"),
    button("send_message", "Ask Claude", "secondary"),
  ]);
}

// Build the response canvas showing Claude's reply with option to continue
export function responseCanvas(
  userMessage: string,
  claudeResponse: string,
  conversationHistory: string
): Canvas {
  return buildCanvas(
    [
      text("**Laurel — Claude Assistant**", "header"),
      spacer("xs"),
      divider(),
      spacer("xs"),
      text(`**You:** ${truncate(userMessage, 200)}`, "paragraph"),
      spacer("xs"),
      text(claudeResponse, "paragraph"),
      spacer("s"),
      divider(),
      spacer("s"),
      textarea(
        "user_message",
        "Follow-up",
        "Ask a follow-up question..."
      ),
      spacer("s"),
      button("send_message", "Send", "secondary"),
      button("reset_conversation", "New conversation", "link"),
    ],
    { conversation_history: conversationHistory }
  );
}

// Build an error canvas
export function errorCanvas(message: string): Canvas {
  return buildCanvas([
    text("**Laurel — Claude Assistant**", "header"),
    spacer("s"),
    divider(),
    spacer("s"),
    text(message, "error"),
    spacer("s"),
    button("reset_conversation", "Try again", "secondary"),
  ]);
}

function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen) + "...";
}
