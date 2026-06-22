---
name: vscode
description: "Microsoft Visual Studio Code IDE integration. Provides guidance for opening files, launching VSCode, managing extensions, MCP server configuration, and VSCode-specific workflows. WHEN: open in vscode, launch vscode, vscode extensions, vscode settings, VSCode IDE integration."
license: MIT
metadata:
  author: Microsoft
  version: "1.0.0"
---

# VSCode Integration

Use this skill when working with Microsoft Visual Studio Code.

## CLI Location

The `code` CLI is typically installed at:
- macOS: `/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code`
- Add to PATH or use full path

## Key Capabilities

### Opening Files and Folders

```bash
# Open current directory in VSCode
code .

# Open specific file
code /path/to/file.txt

# Open file at specific line
code /path/to/file.txt:42

# Open file at specific line and column
code /path/to/file.txt:42:10

# Open in new window
code --new-window /path/to/file

# Wait for file to be closed before returning
code --wait /path/to/file
```

### File Comparison

```bash
code --diff file1.txt file2.txt
```

### Three-Way Merge

```bash
code --merge <path1> <path2> <base> <result>
```

### Extension Management

```bash
# List installed extensions
code --list-extensions

# Install extension
code --install-extension <extension-id>

# Install specific version
code --install-extension <extension-id>@<version>

# Install pre-release
code --install-extension <extension-id> --pre-release

# Uninstall extension
code --uninstall-extension <extension-id>

# Update all extensions
code --update-extensions
```

### MCP (Model Context Protocol) Server Configuration

```bash
# Add MCP server to user profile
code --add-mcp '{"name":"server-name","command":"npx","args":["-y","@server/package"]}'
```

### Useful VSCode Flags

- `--disable-extensions`: Launch without extensions
- `--locale <locale>`: Set language (e.g., `en-US`)
- `--user-data-dir <dir>`: Use custom user data directory
- `--profile <profileName>`: Use specific profile
- `--verbose`: Enable verbose logging

### Chat Subcommand (VSCode Insiders/Copilot)

If using VSCode with GitHub Copilot Chat:

```bash
code chat "your prompt here"
```

## Common Use Cases

1. **Open workspace in VSCode**: `code .`
2. **Open file from terminal**: `code path/to/file.ts`
3. **Jump to line**: `code app.ts:42`
4. **Compare files**: `code --diff a.js b.js`
5. **Add MCP server**: `code --add-mcp '{"name":"servers","command":"npx","args":["-y","@modelcontextprotocol/server-filesystem","/Users/eburon/eburon-voix"]}'`

## Environment Variables

- `PATH` should include VSCode binary location
- On macOS, may need to run `Shell Command: Install 'code' command in PATH` from VSCode Command Palette
