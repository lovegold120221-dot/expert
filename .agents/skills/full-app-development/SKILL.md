---
name: "full-app-development"
description: "Complete end-to-end application development from idea to production deployment on Vercel with GitHub. Use when: building full-stack apps, frontend apps, APIs, or any project needing code creation + Vercel deployment + GitHub push. Triggers on: 'build an app', 'create and deploy', 'deploy to vercel', 'push to github', 'create project from scratch', 'build me an app that...'"
---

# Full App Development

Complete workflow: **Idea → Project Structure → Code → GitHub → Vercel Deploy**

## Prerequisites

```bash
# Verify tools exist
command -v node >/dev/null 2>&1 || echo "Node.js required"
command -v npm >/dev/null 2>&1 || echo "npm required"
command -v vercel >/dev/null 2>&1 || npm install -g vercel
```

---

## Reference Project (Eburon Extract)

This skill template is based on **Eburon Extract** - a YouTube media extraction app:
- **GitHub**: https://github.com/lovegold120221-dot/yt-extract
- **Live**: https://eburon-extract.vercel.app
- **Stack**: Node.js/Express API + HTML/Tailwind frontend + Vercel

---

## Workflow

### Step 1: Initialize Project

```bash
# Create project directory
mkdir -p /path/to/project
cd /path/to/project

# Initialize git
git init
git branch -M main

# Initialize npm
npm init -y
```

### Step 2: Create Project Structure

```
project/
├── index.html          # Frontend UI
├── server.js           # Express backend API
├── vercel.json        # Vercel configuration
├── package.json       # Dependencies
└── README.md          # Documentation
```

### Step 3: Build Application

#### package.json
```json
{
  "name": "project-name",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5"
  }
}
```

#### server.js (Express API Pattern)
```javascript
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'online', service: 'App Name v1.0' });
});

// API routes
app.post('/api/action', (req, res) => {
    const { param } = req.body;
    res.json({ result: 'success', data: param });
});

// Serve frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;
```

#### index.html (Frontend Pattern)
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>App Name</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
    <h1>Hello World</h1>
    <script>
        const API_BASE = window.location.origin + '/api';
        
        document.getElementById('btn').addEventListener('click', async () => {
            const response = await fetch(`${API_BASE}/action`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ param: 'value' })
            });
            const result = await response.json();
            console.log(result);
        });
    </script>
</body>
</html>
```

#### vercel.json (Routing)
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/server.js"
    },
    {
      "src": "/",
      "dest": "/server.js"
    }
  ]
}
```

### Step 4: GitHub Setup

```bash
# Create .gitignore
cat > .gitignore << 'EOF'
node_modules/
.DS_Store
*.log
.env
.vercel/
EOF

# Commit all files
git add .
git commit -m "Initial commit: Project name"

# Push to GitHub (using PAT in URL)
gh_token="GITHUB_PAT_HERE"
repo_url="https://github.com/USERNAME/REPO.git"
git remote add origin "https://${gh_token}@${repo_url}"
git push -u origin main --force
```

### Step 5: Vercel Deployment

```bash
# Login (one-time)
vercel login

# Deploy
vercel --yes

# Production deploy
vercel --prod
```

---

## Common npm Dependencies

| Package | Purpose | Install |
|---------|---------|---------|
| express | Web server | `npm install express` |
| cors | Cross-origin requests | `npm install cors` |
| dotenv | Environment variables | `npm install dotenv` |
| @neoxr/ytdl-core | YouTube downloads | `npm install @neoxr/ytdl-core` |

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Vercel 404 | Check vercel.json routes |
| API CORS error | Add `app.use(cors())` before routes |
| Static files 404 | Add `app.use(express.static(__dirname))` |
| GitHub 403 | Regenerate PAT with correct scopes |
| Port in use | `lsof -ti:PORT | xargs kill -9` |
| Module not found | Run `npm install` |

---

## Testing Checklist

- [ ] `npm start` runs locally without errors
- [ ] `curl http://localhost:PORT/api/health` returns JSON
- [ ] Frontend loads at http://localhost:PORT
- [ ] GitHub push succeeds
- [ ] Vercel deploy succeeds
- [ ] Production URL works