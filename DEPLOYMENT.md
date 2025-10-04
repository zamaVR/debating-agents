# Deployment Guide

This guide covers multiple deployment options for the Dostoyevsky Debaters platform, from local development to production deployments.

## Table of Contents

- [Local Development](#local-development)
- [Docker Deployment](#docker-deployment)
- [Cloud Platform Deployments](#cloud-platform-deployments)
- [Environment Configuration](#environment-configuration)
- [Production Considerations](#production-considerations)

## Local Development

### Prerequisites
- Node.js 18+
- npm or yarn
- Git

### Setup
```bash
# Clone the repository
git clone https://github.com/your-username/dostoyevsky-debaters.git
cd dostoyevsky-debaters

# Install dependencies
npm install

# Copy environment template
cp env.template .env

# Edit .env with your agent configurations
nano .env

# Start development server
npm run dev
```

## Docker Deployment

### Single Container Deployment

```bash
# Build the Docker image
docker build -t dostoyevsky-debaters .

# Run with environment variables
docker run -d \
  --name dostoyevsky-debaters \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e AGENT_A_BASE_URL=your-agent-a-url \
  -e AGENT_A_KEY=your-agent-a-key \
  -e AGENT_B_BASE_URL=your-agent-b-url \
  -e AGENT_B_KEY=your-agent-b-key \
  -e AGENT_MEDIATOR_BASE_URL=your-mediator-url \
  -e AGENT_MEDIATOR_KEY=your-mediator-key \
  dostoyevsky-debaters
```

### Docker Compose Deployment

```bash
# Create .env file from template
cp env.template .env
# Edit .env with your configurations

# Start with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Production Docker Compose

```bash
# Start with nginx reverse proxy
docker-compose --profile production up -d
```

## Cloud Platform Deployments

### Digital Ocean App Platform

The `.do/app.yaml` file is already configured for Digital Ocean App Platform:

```bash
# Deploy using Digital Ocean CLI
doctl apps create --spec .do/app.yaml

# Or deploy via GitHub integration in Digital Ocean dashboard
```

### Railway

Create `railway.json`:
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/health"
  }
}
```

Deploy:
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

### Render

Create `render.yaml`:
```yaml
services:
  - type: web
    name: dostoyevsky-debaters
    env: node
    buildCommand: npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: AGENT_A_BASE_URL
        sync: false
      - key: AGENT_A_KEY
        sync: false
      - key: AGENT_B_BASE_URL
        sync: false
      - key: AGENT_B_KEY
        sync: false
      - key: AGENT_MEDIATOR_BASE_URL
        sync: false
      - key: AGENT_MEDIATOR_KEY
        sync: false
```

### Heroku

Create `Procfile`:
```
web: npm start
```

Deploy:
```bash
# Install Heroku CLI and login
heroku login

# Create app
heroku create your-app-name

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set AGENT_A_BASE_URL=your-agent-a-url
heroku config:set AGENT_A_KEY=your-agent-a-key
heroku config:set AGENT_B_BASE_URL=your-agent-b-url
heroku config:set AGENT_B_KEY=your-agent-b-key
heroku config:set AGENT_MEDIATOR_BASE_URL=your-mediator-url
heroku config:set AGENT_MEDIATOR_KEY=your-mediator-key

# Deploy
git push heroku main
```

### AWS (ECS/Fargate)

Create `task-definition.json`:
```json
{
  "family": "dostoyevsky-debaters",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "dostoyevsky-debaters",
      "image": "your-account.dkr.ecr.region.amazonaws.com/dostoyevsky-debaters:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "AGENT_A_BASE_URL",
          "valueFrom": "arn:aws:ssm:region:account:parameter/dostoyevsky-debaters/agent-a-base-url"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/dostoyevsky-debaters",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

### Google Cloud Platform (Cloud Run)

Create `cloudbuild.yaml`:
```yaml
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/dostoyevsky-debaters', '.']
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/dostoyevsky-debaters']
  - name: 'gcr.io/cloud-builders/gcloud'
    args: [
      'run', 'deploy', 'dostoyevsky-debaters',
      '--image', 'gcr.io/$PROJECT_ID/dostoyevsky-debaters',
      '--region', 'us-central1',
      '--platform', 'managed',
      '--allow-unauthenticated'
    ]
```

Deploy:
```bash
# Build and deploy
gcloud builds submit --config cloudbuild.yaml
```

## Environment Configuration

### Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Server port | `3000` |
| `AGENT_A_BASE_URL` | Agent A API endpoint | `https://api.openai.com/v1` |
| `AGENT_A_KEY` | Agent A API key | `sk-...` |
| `AGENT_B_BASE_URL` | Agent B API endpoint | `https://api.openai.com/v1` |
| `AGENT_B_KEY` | Agent B API key | `sk-...` |
| `AGENT_MEDIATOR_BASE_URL` | Mediator API endpoint | `https://api.openai.com/v1` |
| `AGENT_MEDIATOR_KEY` | Mediator API key | `sk-...` |

### Environment Template

Use the `env.template` file as a starting point:

```bash
# Copy template
cp env.template .env

# Edit with your values
nano .env
```

## Production Considerations

### Security

1. **Environment Variables**: Never commit API keys to version control
2. **HTTPS**: Use SSL/TLS certificates for production
3. **Rate Limiting**: Implement rate limiting for API endpoints
4. **CORS**: Configure CORS appropriately for your domain
5. **Security Headers**: Add security headers (X-Frame-Options, etc.)

### Performance

1. **Caching**: Implement Redis for session caching
2. **CDN**: Use a CDN for static assets
3. **Load Balancing**: Use multiple instances behind a load balancer
4. **Monitoring**: Implement health checks and monitoring

### Scaling

1. **Horizontal Scaling**: Use multiple container instances
2. **Database**: Consider external database for session storage
3. **Queue System**: Implement job queues for long-running debates
4. **Auto-scaling**: Configure auto-scaling based on CPU/memory usage

### Monitoring

1. **Health Checks**: Implement `/health` endpoint
2. **Logging**: Use structured logging (Winston, Pino)
3. **Metrics**: Implement Prometheus metrics
4. **Alerting**: Set up alerts for errors and performance issues

## Troubleshooting

### Common Issues

1. **Environment Variables**: Ensure all required variables are set
2. **Port Conflicts**: Check if port 3000 is available
3. **API Keys**: Verify API keys are valid and have proper permissions
4. **Network Issues**: Check firewall and network connectivity

### Debug Commands

```bash
# Check environment variables
docker exec -it dostoyevsky-debaters env

# View logs
docker logs dostoyevsky-debaters

# Test health endpoint
curl http://localhost:3000/health

# Test API endpoint
curl -X POST http://localhost:3000/api/debate \
  -H "Content-Type: application/json" \
  -d '{"topic": "Test topic"}'
```

## Support

For deployment issues:
- Check the [CONTRIBUTORS.md](CONTRIBUTORS.md) for development setup
- Open an issue on GitHub
- Review the logs for error messages
