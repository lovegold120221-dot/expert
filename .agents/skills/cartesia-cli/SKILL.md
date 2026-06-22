name: cartesia-cli
description: Cartesia CLI for managing voice agents, deployments, phone numbers, and environment variables. Use when the user asks to: authenticate with Cartesia, create/deploy voice agents, manage deployments, provision phone numbers, set environment variables, list agents/deployments/calls, connect self-hosted agents. Covers: cartesia auth, cartesia create, cartesia init, cartesia deploy, cartesia agents, cartesia deployments, cartesia status, cartesia connect, cartesia disconnect, cartesia env, cartesia phone-numbers, cartesia chat.

---

## Cartesia CLI Skill

This skill provides comprehensive guidance for using the Cartesia CLI to manage voice agents and infrastructure.

### Installation

```bash
# Quick install (accepts Cartesia TOS)
curl -fsSL https://cartesia.sh | sh

# Update to latest
cartesia update
```

### Authentication

```bash
# Login with API key (get from play.cartesia.ai/keys)
cartesia auth login

# Validate existing API key
cartesia auth status

# Logout (clears cached credentials)
cartesia auth logout
```

### Project Management

```bash
# Create project from example template
cartesia create my-agent
cd my-agent

# Initialize/link directory to agent
cartesia init

# Check current agent status
cartesia status
```

### Agent Deployment

```bash
# Deploy agent to Cartesia cloud
cartesia deploy

# List all agents in organization
cartesia agents ls

# List all deployments
cartesia deployments ls

# Check deployment status
cartesia status [<deployment-id> or <agent-id>]
```

### Self-Hosted Agent Connection

```bash
# Connect existing agent to self-hosted code
cartesia connect --agent-id <agent-id> --url https://my-agent.example.com

# Interactive connect (select or create agent)
cartesia connect --url https://my-agent.example.com

# Disconnect agent from self-hosted code
cartesia disconnect --agent-id <agent-id>
```

### Environment Variables

```bash
# Set environment variables (encrypted)
cartesia env set API_KEY=FOOBAR MY_CONFIG=FOOBAZ

# Port from .env file
cartesia env set --from .env

# Remove environment variable
cartesia env rm <env-var-name>
```

### Phone Numbers

```bash
# List phone numbers
cartesia phone-numbers ls
cartesia phone-numbers ls --type twilio        # cartesia, twilio, or sip_trunk
cartesia phone-numbers ls --agent-id <agent-id>

# Get phone number details
cartesia phone-numbers get <phone-number-id>

# Provision Cartesia-managed number
cartesia phone-numbers provision "Support Line"
cartesia phone-numbers provision "Support Line" --agent-id <agent-id>

# Assign/unassign phone number to agent
cartesia phone-numbers assign <phone-number-id> --agent-id <agent-id>
cartesia phone-numbers unassign <phone-number-id>

# Update phone number label
cartesia phone-numbers update <phone-number-id> --label "New Label"

# Delete phone number
cartesia phone-numbers delete <phone-number-id>
```

### Local Testing

```bash
# Terminal 1: Run text logic server
PORT=8000 uv run python main.py

# Terminal 2: Chat with agent locally
cartesia chat 8000
```

### Help

```bash
cartesia --help
cartesia <command> --help
```

### API Key Setup

Get API key from: https://play.cartesia.ai/keys (select your organization first)

### Key Files

- `cartesia.json` - Project configuration (created by `cartesia init`)
- `.env` - Local environment variables (not committed)

---

## Usage Notes

- All CLI commands require authentication via `cartesia auth login`
- Environment variables are encrypted at rest
- Managed deployments handle infrastructure automatically
- Self-hosted option gives full control over compute
- Phone numbers: Cartesia-managed, Twilio, or SIP trunk supported
- For Twilio/SIP import, use Playground or Phone Numbers API first