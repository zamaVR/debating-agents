# Dostoyevsky Debaters

A specialized AI debate platform focused on Fyodor Dostoyevsky's literary works. The system orchestrates three AI agents to engage in structured, scholarly debates about classic literature topics from Dostoyevsky's novels, including *Crime and Punishment*, *The Brothers Karamazov*, and other masterpieces. The platform uses a mediator agent to frame rounds, manage the flow, and provide recaps, while two debater agents present arguments with citations from their specialized knowledge bases.

## Live Demo

🚀 **[Try the Dostoyevsky Debaters live demo](https://dostoyevsky-debater-6e9st.ondigitalocean.app/)**

Experience AI agents debating classic literature topics in real-time! Watch scholarly discussions about Dostoyevsky's complex characters, philosophical themes, and moral dilemmas unfold through structured debate rounds.

## Features

- **Real-time Streaming**: Watch debates unfold in real-time with Server-Sent Events
- **Multi-Agent Architecture**: Three specialized AI agents (General Literature Expert, Citation Specialist, Debate Mediator)
- **Structured Debate Rounds**: Organized 4-round format with framing, responses, rebuttals, and recaps
- **Scholarly Citations**: Agents provide specific citations with filename and chunk references
- **Dostoyevsky Focus**: Specialized knowledge bases covering major works and themes
- **Web Interface**: Clean, modern UI optimized for literary debate viewing
- **API Endpoints**: RESTful API for programmatic access to debate functionality

## How Debate Rounds Work

The Dostoyevsky Debaters platform uses a sophisticated 4-round debate structure designed to create engaging, scholarly discussions about literary topics:

### Round Structure

**Round 1: Opening Arguments**
- **Mediator Phase**: Frames the debate topic and introduces the question
- **Agent Responses**: Both agents present their initial positions with citations
- **Mediator Recap**: Summarizes opening arguments and identifies key points

**Round 2: Rebuttals** 
- **Mediator Phase**: Introduces rebuttal round with specific instructions
- **Agent Responses**: Agents challenge each other's claims with concrete quotes and citations
- **Mediator Recap**: Analyzes agreements and disagreements

**Round 3: Cross-Examination**
- **Mediator Phase**: Directs agents to examine evidence and find weaknesses
- **Agent Responses**: Agents present counter-evidence and address opponent's key points
- **Mediator Recap**: Evaluates the strength of arguments

**Round 4: Final Arguments**
- **Mediator Phase**: Introduces final round for strongest case presentation
- **Agent Responses**: Agents make their strongest arguments and address key points
- **Mediator Recap**: Provides closing summary (no winner declared)

### Debate Phases Within Each Round

1. **Framing**: Mediator introduces the round and provides specific instructions
2. **Answer**: Both agents respond simultaneously with their arguments
3. **Round Recap**: Mediator summarizes what each agent said and notes agreements/disagreements
4. **Next Round**: Mediator introduces the next round (except after final round)

### Real-Time Streaming

- **Conversational Delays**: Natural pauses between responses (500-2000ms)
- **Live Updates**: Server-Sent Events stream each phase as it happens
- **Citation Display**: Citations appear with filename and chunk references
- **Phase Indicators**: Clear labeling of each debate phase

## Architecture

The system consists of three specialized AI agents:

1. **Agent A (General Literature Expert)**: Provides broad literary knowledge and context about Dostoyevsky's works, characters, and themes
2. **Agent B (Citation Specialist)**: Requires specific citations for all claims, using only knowledge base content with [filename, chunk #] references
3. **Mediator (Debate Moderator)**: Manages debate flow, frames rounds, provides recaps, and guides the scholarly discussion

## Sample Debate Topics

The platform comes pre-configured with classic Dostoyevsky debate topics:

- **"Does 'The Grand Inquisitor' claim that freedom is a burden rather than a gift?"**
- **"Is Raskolnikov's crime in Crime and Punishment justified by his theory of extraordinary men?"**
- **"Does Dostoevsky present Sonya as a true moral exemplar in Crime and Punishment?"**

These topics explore Dostoyevsky's central themes of:
- Moral philosophy and ethical dilemmas
- The nature of freedom vs. security
- Psychological complexity of characters
- Religious and existential questions
- Social criticism and human nature

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
  "topic": "Does 'The Grand Inquisitor' claim that freedom is a burden rather than a gift?"
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
dostoyevsky-debaters/
├── public/
│   └── index.html          # Frontend interface with Dostoyevsky topics
├── debate-api.ts           # Core debate logic and 4-round orchestration
├── server.ts              # Express server and API endpoints
├── debate.ts              # Legacy debate implementation
├── test-agents.ts         # Agent testing utilities
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
├── LICENSE                # MIT License
├── CONTRIBUTORS.md        # Contribution guidelines
├── CODE_OF_CONDUCT.md     # Community standards
└── README.md             # This file
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details

## Support

For issues and questions, please open an issue on GitHub.
