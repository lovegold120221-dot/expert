---
name: "autonomous-app-generator"
description: "Autonomous AI agent that conceives, builds, and deploys complete applications to production without user input. Use when user asks to: 'build me an app', 'create an app that does X', 'make a full-stack app', 'build and deploy automatically', 'create a complete project from description'"
---

# Autonomous App Generator

Builds complete production-ready applications autonomously from idea to deployment.

## How It Works

1. **Analyze** - Understand requirements from user description
2. **Design** - Create project structure and architecture
3. **Implement** - Write complete code (frontend + backend)
4. **Document** - Add README and comments
5. **Deploy** - Push to GitHub and deploy to Vercel
6. **Report** - Provide live URLs and documentation

## Reference Implementation

**Eburon Extract** - YouTube media extraction app built with this workflow:
- Live: https://eburon-extract.vercel.app
- GitHub: https://github.com/lovegold120221-dot/yt-extract
- Stack: Node.js/Express + Tailwind CSS + Vercel

## Workflow Commands

### Initialize Project
```bash
mkdir -p /path/to/project
cd /path/to/project
git init
npm init -y
```

### Build Core Files
```bash
# Create package.json with dependencies
# Create server.js with Express API
# Create index.html with frontend
# Create vercel.json for deployment
# Create .gitignore
# Create README.md
```

### Install & Test
```bash
npm install
npm start &
sleep 2
curl http://localhost:PORT/api/health
```

### Deploy
```bash
git add .
git commit -m "Initial commit: [project name]"
git push origin main --force
vercel --prod
```

## Architecture Patterns

### API Pattern
```javascript
app.post('/api/action', (req, res) => {
    const { param } = req.body;
    // Process request
    res.json({ status: 'success', data: result });
});
```

### Frontend Pattern
```javascript
const API_BASE = window.location.origin + '/api';

async function callAPI(action, data) {
    const response = await fetch(`${API_BASE}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    return response.json();
}
```

### Vercel Config
```json
{
  "version": 2,
  "builds": [{ "src": "server.js", "use": "@vercel/node" }],
  "routes": [
    { "src": "/api/(.*)", "dest": "/server.js" },
    { "src": "/", "dest": "/server.js" }
  ]
}
```

## Implementation Steps

1. **Create SPEC.md** - Document project requirements and design
2. **Build package.json** - Define dependencies
3. **Build server.js** - Express API with all endpoints
4. **Build index.html** - Complete frontend UI
5. **Build vercel.json** - Vercel configuration
6. **Test locally** - Verify functionality
7. **Commit to GitHub** - With PAT in remote URL
8. **Deploy to Vercel** - Production deployment
9. **Report** - Provide URLs and instructions

## Autonomy Rules

- **Always deploy** - Never leave a build unfinished
- **Use existing patterns** - Follow reference implementations
- **Complete code** - No TODOs or placeholders
- **Production ready** - Handle errors, CORS, edge cases
- **Document** - README with setup instructions

## Example Autonomy Session

```
User: "build me a URL shortener"
Agent:
  1. Creates project structure
  2. Implements Express API with:
     - POST /api/shorten (create short URL)
     - GET /api/short/:code (redirect)
     - GET /api/health
  3. Creates HTML UI with form
  4. Configures Vercel
  5. Deploys to GitHub
  6. Deploys to Vercel
  7. Reports: "Live at https://short.vercel.app"
```