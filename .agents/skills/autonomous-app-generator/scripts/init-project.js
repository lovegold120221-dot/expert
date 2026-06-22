#!/usr/bin/env node
/**
 * Autonomous App Generator Script
 * Creates a complete project structure from template
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_DIR = process.argv[2] || './new-project';
const PROJECT_NAME = path.basename(PROJECT_DIR);

console.log(`🚀 Creating project: ${PROJECT_NAME}`);
console.log(`📁 Directory: ${PROJECT_DIR}`);

// Create directory
fs.mkdirSync(PROJECT_DIR, { recursive: true });

// package.json
const packageJson = {
  name: PROJECT_NAME.toLowerCase().replace(/\s+/g, '-'),
  version: '1.0.0',
  main: 'server.js',
  scripts: {
    start: 'node server.js',
    dev: 'node server.js'
  },
  dependencies: {
    express: '^4.18.2',
    cors: '^2.8.5'
  }
};

fs.writeFileSync(
  path.join(PROJECT_DIR, 'package.json'),
  JSON.stringify(packageJson, null, 2)
);

// server.js
const serverJs = `const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

app.get('/api/health', (req, res) => {
    res.json({ status: 'online', service: '${PROJECT_NAME} v1.0' });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(\`${PROJECT_NAME} running on port \${PORT}\`);
});

module.exports = app;
`;

fs.writeFileSync(path.join(PROJECT_DIR, 'server.js'), serverJs);

// index.html
const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${PROJECT_NAME}</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-900 text-white min-h-screen flex items-center justify-center">
    <div class="text-center">
        <h1 class="text-4xl font-bold mb-4">${PROJECT_NAME}</h1>
        <p class="text-gray-400">Built with Autonomous App Generator</p>
    </div>
</body>
</html>
`;

fs.writeFileSync(path.join(PROJECT_DIR, 'index.html'), indexHtml);

// vercel.json
const vercelJson = {
  version: 2,
  builds: [{ src: 'server.js', use: '@vercel/node' }],
  routes: [
    { src: '/api/(.*)', dest: '/server.js' },
    { src: '/', dest: '/server.js' }
  ]
};

fs.writeFileSync(
  path.join(PROJECT_DIR, 'vercel.json'),
  JSON.stringify(vercelJson, null, 2)
);

// .gitignore
fs.writeFileSync(
  path.join(PROJECT_DIR, '.gitignore'),
  'node_modules/\n.DS_Store\n*.log\n.env\n.vercel/\n'
);

// README.md
const readme = `# ${PROJECT_NAME}

Built with Autonomous App Generator.

## Setup

\`\`\`bash
npm install
npm start
\`\`\`

## Deploy

\`\`\`bash
vercel --prod
\`\`\`
`;

fs.writeFileSync(path.join(PROJECT_DIR, 'README.md'), readme);

console.log('✅ Project created!');
console.log(`\nTo get started:`);
console.log(`  cd ${PROJECT_DIR}`);
console.log(`  npm install`);
console.log(`  npm start`);