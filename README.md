# AICoach

AI-powered tennis coach library that creates personalized training sessions using LangChain and ChromaDB.

## Features

- **AI Training Sessions**: Generate custom tennis training plans with 3 parts (Initial, Main, Final)
- **Exercise Search**: Retrieve exercises from ChromaDB vector store based on player level and topics
- **Level Guidelines**: Get program guidelines for specific player levels
- **Session Management**: Track user sessions, history, and context
- **User Personalization**: Store user feedback and preferences for improved responses over time
- **Stream Support**: Stream AI responses in real-time

## Installation

```bash
npm install aicoach
```

## Prerequisites

- Node.js 18+
- OpenAI API key
- ChromaDB server running (for exercise search)
- Supabase (optional, for persistent user data)

## Quick Start

```typescript
import { AICoach } from 'aicoach';

const coach = new AICoach({
  model: 'gpt-4',
});

// Create a training session
const result = await coach.createTrainingSession('user-123');

// Chat with the coach
const response = await coach.chat({
  sessionId: 'user-123',
  messages: [{ role: 'human', content: 'Can we focus on backhand today?' }]
});
```

## API

### `new AICoach(config?)`

Create a new AICoach instance.

```typescript
const coach = new AICoach({
  model: 'gpt-4',           // Model to use (default: gpt-5.4-nano)
  checkpointer: new MemorySaver(), // LangGraph checkpointer
});
```

### `createTrainingSession(sessionId: string)`

Generate a training session for a user.

```typescript
const result = await coach.createTrainingSession('user-123');
```

### `chat(input: { sessionId?: string; messages:[] })`

Send a message and get AI response.

```typescript
const response = await coach.chat({
  sessionId: 'user-123',
  messages: [{ role: 'human', content: 'I need help with my serve' }]
});
```

### `chatStream(input)`

Stream AI responses.

```typescript
for await (const chunk of coach.chatStream(input)) {
  console.log(chunk);
}
```

### Session Management

```typescript
// Create session
const session = coach.createSession('user-123');

// Get session
const session = coach.getSession('user-123');

// Delete session
coach.deleteSession('user-123');
```

## Available Tools

The agent has access to these tools:

| Tool | Description |
|------|-------------|
| `searchExercises` | Search for training exercises in ChromaDB by level, topics, and session part |
| `getLevelGuidelines` | Get program guidelines for a specific player level |

## Configuration

### Environment Variables

```bash
# Optional: For Supabase (user persistence)
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key

# Optional: For ChromaDB (default: http://localhost:8000)
CHROMA_URL=http://localhost:8000
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Watch tests
npm run test:watch

# UI tests
npm run test:ui

# Run dev
npm run dev
```

## License

MIT
