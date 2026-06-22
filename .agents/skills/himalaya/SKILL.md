---
name: himalaya
description: "Himalaya CLI email client — read, send, manage emails from the terminal. List folders, list messages, read messages, send via SMTP, search, delete, move, flag, manage attachments, and configure multiple IMAP/SMTP accounts. Use when you need to check email, send email, manage inboxes, search messages, or automate email workflows."
---

# Himalaya Skill

Himalaya is a CLI email client using IMAP + SMTP.

## Configuration

Config is at `~/.config/himalaya/config.toml`. It stores account settings (IMAP server, SMTP server, credentials). Never print or commit passwords.

```bash
# Run the wizard to set up an account interactively
himalaya wizard

# Check current config location
himalaya config path
```

## Common Operations

### List Folders
```bash
himalaya folder list
```

### List Messages in Inbox
```bash
# Default inbox (most recent 10)
himalaya list

# Specify folder and count
himalaya list -f INBOX -a -c 20

# All folders
himalaya list -a

# With specific account
himalaya list -a my-account
```

### Read Messages
```bash
# Read message by ID (from list output)
himalaya read 1

# Read with full headers
himalaya read 1 -h

# Read raw email source
himalaya read 1 -r

# Download attachments
himalaya read 1 -a
```

### Send Email
```bash
# Quick send (one-liner)
himalaya send --to user@example.com --subject "Hello" --body "Email body text"

# Send with CC and BCC
himalaya send --to user@example.com --cc cc@example.com --subject "Subject" --body "Body"

# Send with attachment
himalaya send --to user@example.com --subject "With file" --body "See attached" --attachment /path/to/file.pdf

# Send from specific account
himalaya send -a work --to user@example.com --subject "From work" --body "Sent via work account"
```

### Search
```bash
# Search all folders
himalaya search "query text"

# Search in specific folder
himalaya search -f INBOX "meeting"

# Search with date filter (using IMAP syntax)
himalaya search -f INBOX "SINCE 01-Jan-2025"
```

### Manage Messages
```bash
# Delete
himalaya delete 1

# Move to folder
himalaya copy 1 -t "Archive"
himalaya move 1 -t "Archive"     # copy + delete

# Flag / unflag
himalaya flag 1 --add "\\Flagged"
himalaya flag 1 --remove "\\Flagged"

# Mark as read/unread
himalaya flag 1 --add "\\Seen"
himalaya flag 1 --remove "\\Seen"
```

### Multiple Accounts
```bash
# List messages from specific account
himalaya list -a work

# Send from specific account
himalaya send -a personal --to user@example.com --subject "Hi" --body "Hello"

# Switch default account
himalaya default-account set personal
```

### Envelope (compact list)
```bash
# Compact one-line per message
himalaya envelope list -c 15

# With folder
himalaya envelope list -f Sent -c 10
```

### Templates / Composing
```bash
# Reply to message 1
himalaya reply 1

# Forward message 1
himalaya forward 1

# Open in editor (uses $EDITOR)
himalaya send --to user@example.com --subject "Draft"
```

## Tips

- Use `himalaya list` first to get message IDs, then `himalaya read <id>` to read
- For automated email sending, use the one-line `--body` flag
- For interactive composing, omit `--body` and himalaya will open $EDITOR
- Attachments: download all with `himalaya read <id> -a`, saves to current directory
- Account switching: use `-a <account-name>` on any command
- Never expose email credentials in logs or code
- If no account is configured, run `himalaya wizard` to set one up interactively
