# Contributing to Debating Agents

Thank you for your interest in contributing to the Debating Agents project! This guide will help you get started with running, testing, and contributing to the codebase.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Running the Application](#running-the-application)
- [Testing](#testing)
- [Project Structure](#project-structure)
- [Contributing Guidelines](#contributing-guidelines)
- [Code Style](#code-style)
- [Submitting Changes](#submitting-changes)
- [Reporting Issues](#reporting-issues)

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (version 18 or higher)
- **npm** (comes with Node.js)
- **TypeScript** (installed as dev dependency)
- **Git**

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/debating-agents.git
   cd debating-agents
   ```
3. Add the upstream repository:
   ```bash
   git remote add upstream https://github.com/ORIGINAL_OWNER/debating-agents.git
   ```

## Development Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Create a `.env` file in the root directory with your agent configurations:

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

# Optional: Server Configuration
PORT=3000
NODE_ENV=development
```

### 3. Verify Installation

Check that everything is working:

```bash
npm run build
```

This should compile the TypeScript code without errors.

## Running the Application

### Development Mode

Start the development server with hot reloading:

```bash
npm run dev
```

The server will start on `http://localhost:3000` (or the port specified in your `.env` file).

### Production Mode

1. Build the application:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```

### Testing Individual Agents

You can test individual agents using the test utilities:

```bash
npx tsx test-agents.ts
```

This will run tests for each agent to verify they're working correctly.

## Testing

### Manual Testing

1. **Start the server** in development mode
2. **Open the web interface** at `http://localhost:3000`
3. **Test debate functionality**:
   - Enter a debate topic
   - Verify real-time streaming works
   - Check that all three agents participate
   - Ensure proper debate structure (framing, responses, recaps)

### API Testing

Test the API endpoints using curl or a tool like Postman:

```bash
# Start a debate
curl -X POST http://localhost:3000/api/debate \
  -H "Content-Type: application/json" \
  -d '{"topic": "Should artificial intelligence be regulated?"}'
```

### Agent Testing

Test individual agents:

```bash
# Test Agent A
curl -X POST http://localhost:3000/api/test-agent-a \
  -H "Content-Type: application/json" \
  -d '{"message": "What is artificial intelligence?"}'

# Test Agent B  
curl -X POST http://localhost:3000/api/test-agent-b \
  -H "Content-Type: application/json" \
  -d '{"message": "Explain machine learning with citations"}'

# Test Mediator
curl -X POST http://localhost:3000/api/test-mediator \
  -H "Content-Type: application/json" \
  -d '{"topic": "Climate change", "round": 1}'
```

## Project Structure

```
debating-agents/
├── public/
│   └── index.html          # Frontend interface
├── dist/                   # Compiled JavaScript (generated)
├── debate-api.ts           # Core debate logic and agent orchestration
├── server.ts              # Express server and API endpoints
├── debate.ts              # Legacy debate implementation
├── test-agents.ts         # Agent testing utilities
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
├── .env                   # Environment variables (create this)
├── LICENSE                # MIT License
├── README.md             # Project documentation
└── CONTRIBUTORS.md       # This file
```

### Key Files Explained

- **`debate-api.ts`**: Main debate orchestration logic, handles agent communication
- **`server.ts`**: Express server setup, API routes, and middleware
- **`test-agents.ts`**: Utilities for testing individual agents
- **`public/index.html`**: Frontend interface for watching debates
- **`package.json`**: Project dependencies and npm scripts

## Contributing Guidelines

### Types of Contributions

We welcome various types of contributions:

- **Bug fixes**: Fix issues in existing functionality
- **Feature additions**: Add new capabilities to the platform
- **Documentation**: Improve README, code comments, or guides
- **Testing**: Add test cases or improve testing infrastructure
- **Performance**: Optimize code for better performance
- **UI/UX**: Improve the frontend interface

### Development Workflow

1. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**:
   - Write clean, readable code
   - Add comments for complex logic
   - Follow existing code patterns

3. **Test your changes**:
   - Run the application locally
   - Test the specific functionality you modified
   - Ensure no regressions

4. **Commit your changes**:
   ```bash
   git add .
   git commit -m "Add: brief description of changes"
   ```

5. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request**:
   - Go to your fork on GitHub
   - Click "New Pull Request"
   - Provide a clear description of your changes
   - Link any related issues

## Code Style

### TypeScript Guidelines

- Use **TypeScript** for all new code
- Define proper types and interfaces
- Use meaningful variable and function names
- Add JSDoc comments for public functions

### Code Formatting

- Use **2 spaces** for indentation
- Use **semicolons** at the end of statements
- Use **single quotes** for strings
- Use **camelCase** for variables and functions
- Use **PascalCase** for classes and interfaces

### Example Code Style

```typescript
/**
 * Starts a new debate with the given topic
 * @param topic - The debate topic
 * @returns Promise that resolves when debate starts
 */
async function startDebate(topic: string): Promise<void> {
  try {
    const debateId = generateDebateId();
    await initializeDebate(debateId, topic);
    console.log(`Debate started: ${topic}`);
  } catch (error) {
    console.error('Failed to start debate:', error);
    throw error;
  }
}
```

## Submitting Changes

### Pull Request Process

1. **Ensure your branch is up to date**:
   ```bash
   git checkout main
   git pull upstream main
   git checkout feature/your-feature-name
   git rebase main
   ```

2. **Write a clear PR description**:
   - What changes were made
   - Why the changes were necessary
   - How to test the changes
   - Any breaking changes

3. **Request review**:
   - Tag relevant maintainers
   - Respond to feedback promptly
   - Make requested changes

### Commit Message Format

Use clear, descriptive commit messages:

```
Add: implement real-time debate streaming
Fix: resolve agent timeout issues
Update: improve error handling in debate API
Docs: add contribution guidelines
```

## Reporting Issues

### Before Reporting

1. **Check existing issues** to avoid duplicates
2. **Test with latest code** from main branch
3. **Gather relevant information**:
   - Steps to reproduce
   - Expected vs actual behavior
   - Error messages or logs
   - Environment details (OS, Node.js version, etc.)

### Issue Template

When creating an issue, include:

```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- OS: [e.g. macOS, Windows, Linux]
- Node.js version: [e.g. 18.17.0]
- Browser: [e.g. Chrome, Firefox]

**Additional context**
Any other context about the problem.
```

## Getting Help

- **GitHub Issues**: For bugs and feature requests
- **Discussions**: For questions and general discussion
- **Code Review**: Ask questions in pull request comments

## Recognition

Contributors will be recognized in:
- GitHub contributors list
- Project documentation
- Release notes

Thank you for contributing to Debating Agents! 🚀
