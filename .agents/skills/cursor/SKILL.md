---
name: cursor
description: "Cursor AI code editor integration. Provides guidance for opening files, launching Cursor, managing extensions, MCP server configuration, and Cursor-specific AI workflows. WHEN: open in cursor, launch cursor, cursor extensions, cursor settings, Cursor IDE integration, AI-first coding editor."
license: MIT
metadata:
  author: Cursor
  version: "1.0.0"
---

# Cursor Integration

Use this skill when working with Cursor, an AI-first code editor built on VSCode.

## CLI Location

Cursor provides a `cursor` CLI. Typical installation paths:

```bash
# Check if installed
which cursor

# Common macOS installation path
/Applications/Cursor.app/Contents/Resources/app/bin/cursor
```

## Key Capabilities

### Opening Files and Folders

```bash
# Open current directory in Cursor
cursor .

# Open specific file
cursor /path/to/file.txt

# Open file at specific line
cursor /path/to/file.txt:42

# Open file at specific line and column
cursor /path/to/file.txt:42:10

# Open in new window
cursor --new-window /path/to/file

# Wait for file to be closed before returning
cursor --wait /path/to/file
```

### File Comparison

```bash
cursor --diff file1.txt file2.txt
```

### Three-Way Merge

```bash
cursor --merge <path1> <path2> <base> <result>
```

### Extension Management

```bash
# List installed extensions
cursor --list-extensions

# Install extension
cursor --install-extension <extension-id>

# Install specific version
cursor --install-extension <extension-id>@<version>

# Install pre-release
cursor --install-extension <extension-id> --pre-release

# Uninstall extension
cursor --uninstall-extension <extension-id>

# Update all extensions
cursor --update-extensions
```

### MCP (Model Context Protocol) Server Configuration

```bash
# Add MCP server to user profile
cursor --add-mcp '{"name":"server-name","command":"npx","args":["-y","@server/package"]}'
```

### AI Features

Cursor has deep AI integration:
- **Cmd+K**: Inline AI edit
- **Cmd+L**: AI chat panel
- **Cmd+K in chat**: Edit code with AI
- **Tab**: AI code completion
- **Cmd+Enter**: Accept AI whole file edit

### Useful Cursor Flags

- `--disable-extensions`: Launch without extensions
- `--locale <locale>`: Set language (e.g., `en-US`)
- `--user-data-dir <dir>`: Use custom user data directory
- `--profile <profileName>`: Use specific profile
- `--verbose`: Enable verbose logging
- `--log <level>`: Set log level

### Status and Diagnostics

```bash
# Print process usage and diagnostics
cursor --status
```

## Common Use Cases

1. **Open workspace in Cursor**: `cursor .`
2. **Open file from terminal**: `cursor path/to/file.ts`
3. **Jump to line**: `cursor app.ts:42`
4. **Compare files**: `cursor --diff a.js b.js`
5. **Add MCP server**: `cursor --add-mcp '{"name":"servers","command":"npx","args":["-y","@modelcontextprotocol/server-filesystem","/Users/eburon/eburon-voix"]}'`

## Cursor-Specific Notes

- Cursor is built on VSCode architecture with deep AI integration
- Supports all VSCode keyboard shortcuts and extensions
- Has its own AI models (Claude, GPT-4, etc.) with context awareness
