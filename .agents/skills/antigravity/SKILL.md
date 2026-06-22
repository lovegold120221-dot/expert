---
name: antigravity
description: "Google Antigravity IDE integration. Provides guidance for opening files, launching Antigravity, managing extensions, MCP server configuration, and Antigravity-specific workflows. WHEN: open in antigravity, launch antigravity, antigravity extensions, antigravity settings, Google Antigravity IDE integration."
license: MIT
metadata:
  author: Google
  version: "1.0.0"
---

# Antigravity Integration

Use this skill when working with Google Antigravity, a VSCode-based IDE with built-in AI.

## CLI Location

```
/Users/eburon/.antigravity/antigravity/bin/antigravity
```

## Key Capabilities

### Opening Files and Folders

```bash
# Open current directory in Antigravity
antigravity .

# Open specific file
antigravity /path/to/file.txt

# Open file at specific line
antigravity /path/to/file.txt:42

# Open file at specific line and column
antigravity /path/to/file.txt:42:10

# Open in new window
antigravity --new-window /path/to/file

# Wait for file to be closed before returning
antigravity --wait /path/to/file
```

### File Comparison

```bash
antigravity --diff file1.txt file2.txt
```

### Three-Way Merge

```bash
antigravity --merge <path1> <path2> <base> <result>
```

### Extension Management

```bash
# List installed extensions
antigravity --list-extensions

# Install extension
antigravity --install-extension <extension-id>

# Install specific version
antigravity --install-extension <extension-id>@<version>

# Install pre-release
antigravity --install-extension <extension-id> --pre-release

# Uninstall extension
antigravity --uninstall-extension <extension-id>

# Update all extensions
antigravity --update-extensions
```

### MCP (Model Context Protocol) Server Configuration

```bash
# Add MCP server to user profile
antigravity --add-mcp '{"name":"server-name","command":"npx","args":["-y","@server/package"]}'
```

### AI Chat

Antigravity has built-in AI chat:

```bash
# Open chat with a prompt
antigravity chat "Explain this function"
```

### Useful Antigravity Flags

- `--disable-extensions`: Launch without extensions
- `--locale <locale>`: Set language (e.g., `en-US`)
- `--user-data-dir <dir>`: Use custom user data directory
- `--profile <profileName>`: Use specific profile
- `--verbose`: Enable verbose logging
- `--log <level>`: Set log level (critical, error, warn, info, debug, trace, off)

### Status and Diagnostics

```bash
# Print process usage and diagnostics
antigravity --status
```

## Common Use Cases

1. **Open workspace in Antigravity**: `antigravity .`
2. **Open file from terminal**: `antigravity path/to/file.ts`
3. **Jump to line**: `antigravity app.ts:42`
4. **Compare files**: `antigravity --diff a.js b.js`
5. **Add MCP server**: `antigravity --add-mcp '{"name":"servers","command":"npx","args":["-y","@modelcontextprotocol/server-filesystem","/Users/eburon/eburon-voix"]}'`
6. **Start AI chat**: `antigravity chat "What does this code do?"`

## Antigravity-Specific Notes

- Antigravity is Google's internal VSCode-based IDE with AI integration
- Built on VSCode architecture with Google-specific enhancements
- The `chat` subcommand opens an AI session in the current working directory
- Supports all VSCode keyboard shortcuts and extensions
- Available at https://antigravity.google
