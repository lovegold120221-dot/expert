---
name: windsurf
description: "Windsurf AI IDE by Codeium integration. Provides guidance for opening files, launching WindSurf, managing extensions, MCP server configuration, and WindSurf-specific AI workflows. WHEN: open in windsurf, launch windsurf, windsurf extensions, windsurf settings, Windsurf IDE integration, Codeium AI coding."
license: MIT
metadata:
  author: Codeium
  version: "1.0.0"
---

# WindSurf Integration

Use this skill when working with WindSurf, Codeium's AI-first coding IDE.

## CLI Location

```
/Users/eburon/.codeium/windsurf/bin/windsurf
```

## Key Capabilities

### Opening Files and Folders

```bash
# Open current directory in WindSurf
windsurf .

# Open specific file
windsurf /path/to/file.txt

# Open file at specific line
windsurf /path/to/file.txt:42

# Open file at specific line and column
windsurf /path/to/file.txt:42:10

# Open in new window
windsurf --new-window /path/to/file

# Wait for file to be closed before returning
windsurf --wait /path/to/file
```

### File Comparison

```bash
windsurf --diff file1.txt file2.txt
```

### Three-Way Merge

```bash
windsurf --merge <path1> <path2> <base> <result>
```

### Extension Management

```bash
# List installed extensions
windsurf --list-extensions

# Install extension
windsurf --install-extension <extension-id>

# Install specific version
windsurf --install-extension <extension-id>@<version>

# Install pre-release
windsurf --install-extension <extension-id> --pre-release

# Uninstall extension
windsurf --uninstall-extension <extension-id>

# Update all extensions
windsurf --update-extensions
```

### MCP (Model Context Protocol) Server Configuration

```bash
# Add MCP server to user profile
windsurf --add-mcp '{"name":"server-name","command":"npx","args":["-y","@server/package"]}'
```

### AI Chat (Cascade)

WindSurf has built-in AI chat via Cascade:

```bash
# Open chat with a prompt
windsurf chat "Explain this function"
```

### Useful WindSurf Flags

- `--disable-extensions`: Launch without extensions
- `--locale <locale>`: Set language (e.g., `en-US`)
- `--user-data-dir <dir>`: Use custom user data directory
- `--profile <profileName>`: Use specific profile
- `--verbose`: Enable verbose logging
- `--log <level>`: Set log level (critical, error, warn, info, debug, trace, off)

### Status and Diagnostics

```bash
# Print process usage and diagnostics
windsurf --status
```

## Common Use Cases

1. **Open workspace in WindSurf**: `windsurf .`
2. **Open file from terminal**: `windsurf path/to/file.ts`
3. **Jump to line**: `windsurf app.ts:42`
4. **Compare files**: `windsurf --diff a.js b.js`
5. **Add MCP server**: `windsurf --add-mcp '{"name":"servers","command":"npx","args":["-y","@modelcontextprotocol/server-filesystem","/Users/eburon/eburon-voix"]}'`
6. **Start AI chat**: `windsurf chat "What does this code do?"`

## WindSurf-Specific Notes

- WindSurf is built on VSCode architecture but with AI-first design
- The `chat` subcommand opens a Cascade AI session in the current working directory
- Supports all VSCode keyboard shortcuts and extensions
- Cascade AI can contextually understand the entire codebase
