# Laurel — Intercom Sidebar App

An Intercom inbox sidebar app that gives support agents access to Claude directly within conversations.

## What it does

When an agent opens a conversation in Intercom, this app appears in the sidebar and lets them:

- Ask Claude questions about the current customer conversation
- Get help drafting replies
- Have multi-turn follow-up conversations with Claude
- Get context-aware answers (Claude sees the conversation thread)

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Set the required values:

- `ANTHROPIC_API_KEY` — your Anthropic API key
- `INTERCOM_CLIENT_SECRET` — your Intercom app's OAuth client secret (for webhook signature verification)

Optional:

- `CLAUDE_MODEL` — Claude model to use (defaults to `claude-sonnet-4-20250514`)
- `LAUREL_SYSTEM_PROMPT` — custom system prompt override
- `PORT` — server port (defaults to `3000`)

### 3. Run

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

### 4. Configure in Intercom Developer Hub

1. Go to the [Intercom Developer Hub](https://developers.intercom.com/) and create a new app
2. Navigate to **Configure > Canvas Kit**
3. Click **"For teammates"** and check **"Add to conversation details"**
4. Set the webhook URLs:
   - **Initialize URL**: `https://your-domain.com/initialize`
   - **Submit URL**: `https://your-domain.com/submit`
5. Install the app in your workspace
6. Open a conversation in the Inbox → click **Edit Apps** in the sidebar → pin the app

### Docker

```bash
docker build -t laurel-intercom .
docker run -p 3000:3000 --env-file .env laurel-intercom
```

## Architecture

```
POST /initialize  →  Returns initial chat canvas
POST /submit      →  Handles message send / reset
                     Calls Claude API with conversation context
                     Returns response canvas with follow-up input
GET  /health      →  Health check
```

The app uses Intercom's Canvas Kit to render UI components in the sidebar. All state is managed via Canvas Kit's `stored_data` — no database required.
