# Debating Agents

A real-time AI debate platform that orchestrates multiple AI agents to engage in structured debates on any topic. The system uses a mediator agent to frame rounds, manage the flow, and provide recaps, while two debater agents present arguments with citations from their knowledge bases.

## Features

- **Real-time Streaming**: Watch debates unfold in real-time with Server-Sent Events
- **Multi-Agent Architecture**: Three specialized AI agents (Debater A, Debater B, Mediator)
- **Structured Rounds**: Organized debate format with framing, responses, and recaps
- **Citation Support**: Agents provide citations from their knowledge bases
- **Web Interface**: Clean, modern UI for watching debates
- **API Endpoints**: RESTful API for programmatic access

## Architecture

The system consists of three AI agents:

1. **Agent A**: General knowledge assistant providing factual information
2. **Agent B**: Knowledge base specialist requiring citations for all claims
3. **Mediator**: Debate moderator managing rounds and flow

## Prerequisites

- Node.js 18+ 
- TypeScript
- Access to AI agent APIs (OpenAI-compatible endpoints)
- Environment variables for agent configurations

## Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd debating-agents
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file with your agent configurations:
```env
# Agent A Configuration
AGENT_A_BASE_URL=https://your-agent-a-endpoint.com/v1
AGENT_A_KEY=your-agent-a-api-key

# Agent B Configuration  
AGENT_B_BASE_URL=https://your-agent-b-endpoint.com/v1
AGENT_B_KEY=your-agent-b-api-key

# Mediator Configuration
AGENT_MEDIATOR_BASE_URL=https://your-mediator-endpoint.com/v1
AGENT_MEDIATOR_KEY=your-mediator-api-key
```

## Development

Start the development server:
```bash
npm run dev
```

The server will start on `http://localhost:3000`

## Building for Production

Build the TypeScript code:
```bash
npm run build
```

Start the production server:
```bash
npm start
```

## API Usage

### Start a Debate

**POST** `/api/debate`

Request body:
```json
{
  "topic": "Should artificial intelligence be regulated?"
}
```

Response: Server-Sent Events stream with debate messages

Event types:
- `start`: Debate initialization
- `message`: Debate entry (agent response, mediator note, etc.)
- `complete`: Debate finished
- `error`: Error occurred

## Deployment on Digital Ocean App Platform

### 1. Prepare for Deployment

Ensure your `package.json` has the correct build and start scripts:
```json
{
  "scripts": {
    "build": "tsc",
    "start": "node dist/server.js"
  }
}
```

### 2. Create App Spec

Create a `.do/app.yaml` file:
```yaml
name: debating-agents
services:
- name: web
  source_dir: /
  github:
    repo: your-username/debating-agents
    branch: main
  run_command: npm start
  build_command: npm run build
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  http_port: 3000
  envs:
  - key: NODE_ENV
    value: production
  - key: AGENT_A_BASE_URL
    value: ${AGENT_A_BASE_URL}
  - key: AGENT_A_KEY
    value: ${AGENT_A_KEY}
  - key: AGENT_B_BASE_URL
    value: ${AGENT_B_BASE_URL}
  - key: AGENT_B_KEY
    value: ${AGENT_B_KEY}
  - key: AGENT_MEDIATOR_BASE_URL
    value: ${AGENT_MEDIATOR_BASE_URL}
  - key: AGENT_MEDIATOR_KEY
    value: ${AGENT_MEDIATOR_KEY}
```

### 3. Deploy Steps

1. Push your code to GitHub
2. Connect your GitHub repository to Digital Ocean App Platform
3. Set environment variables in the Digital Ocean dashboard
4. Deploy the application

### 4. Environment Variables in Digital Ocean

Set these environment variables in your Digital Ocean App Platform settings:
- `AGENT_A_BASE_URL`
- `AGENT_A_KEY`
- `AGENT_B_BASE_URL`
- `AGENT_B_KEY`
- `AGENT_MEDIATOR_BASE_URL`
- `AGENT_MEDIATOR_KEY`

## Project Structure

```
debating-agents/
├── public/
│   └── index.html          # Frontend interface
├── debate-api.ts           # Core debate logic and agent orchestration
├── server.ts              # Express server and API endpoints
├── debate.ts              # Legacy debate implementation
├── test-agents.ts         # Agent testing utilities
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
└── README.md             # This file
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

ISC License - see package.json for details

## Support

For issues and questions, please open an issue on GitHub.
