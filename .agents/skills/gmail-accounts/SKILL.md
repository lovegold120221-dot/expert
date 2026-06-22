---
name: gmail-accounts
description: "Gmail credential management and social media account creation using the user's existing Chrome login session. Use when the user asks to: create a TikTok account, sign up for YouTube, make a social media account, register a new account on any platform, create a Google account, sign up for a service with email, or automate account registration. Credentials are stored locally in ~/.opencode/secrets/social-accounts.json. The Gmail account is ALREADY logged into the user's Chrome browser — use the existing session via Connect Chrome, not headless browser."
---

# Social Media Account Creation

Create accounts on TikTok, YouTube, and other social media platforms. The Gmail account `daddyambo40@gmail.com` is **already logged into the user's Chrome browser** — use the existing session instead of fresh login.

## Critical: How to Launch Browser

**DO NOT use headless browser mode.** The account is already logged into Chrome with full cookies. You must use the user's existing Chrome session:

### Option A: Connect Chrome (Recommended)

Use the `connect-chrome` skill to launch the user's real Chrome with existing sessions:

> Load the **connect-chrome** skill → this launches real Chrome with all cookies/sessions preserved, including the logged-in Gmail account.

### Option B: Import Browser Cookies

If using headless browser tools, import cookies first to carry over the existing Gmail session:

> Load the **setup-browser-cookies** skill → imports cookies from the user's real Chromium browser, preserving the Gmail login state.

## Credential Storage

Credentials are at: **`~/.opencode/secrets/social-accounts.json`** (read-only, `chmod 600`)

### How to load credentials when needed

```bash
cat ~/.opencode/secrets/social-accounts.json
```

### Credential Reference

| Field | Value |
|-------|-------|
| **Email** | `daddyambo40@gmail.com` |
| **Password** | From `~/.opencode/secrets/social-accounts.json` |
| **Browser state** | Already logged into Chrome — use direct navigation to Gmail |
| **Permission** | Full — can create accounts on any platform |

## Account Creation Workflows

### 1. TikTok Account Creation

**URL**: `https://www.tiktok.com/signup`

**Approach**: Since Gmail is logged into Chrome, use the "Google Sign-In" option on TikTok when available, or use email+password.

**Steps**:
```
CONNECT CHROME first (preserves Gmail session)

1. Navigate to https://www.tiktok.com/signup
2. Look for "Continue with Google" button (preferred — uses existing session)
3. If not available, select "Use phone or email" → "Email"
4. Enter: daddyambo40@gmail.com
5. Enter password (from credentials file)
6. Complete captcha
7. For verification code:
   - Open new tab → https://mail.google.com (already logged in)
   - Check inbox for TikTok verification code
   - Switch back to TikTok tab, enter code
8. Complete profile setup
```

### 2. YouTube / Google Account Creation

Since the Gmail is already logged in, you're already one step ahead:

**URL**: `https://www.youtube.com/` → click avatar → "Create a channel"

**Steps**:
```
CONNECT CHROME first (preserves Gmail session)

1. Navigate to https://www.youtube.com/
2. Click your profile avatar (top-right) — already logged in
3. Click "Create a channel"
4. Choose personal or business channel
5. Set channel name and customize
6. Upload profile picture (optional)
7. Done — no verification needed since Gmail is already authenticated
```

### 3. General Social Media Registration

For any platform (Instagram, Twitter/X, Discord, Reddit, etc.):

**Approach Priority**:
1. **"Continue with Google"** — best, uses existing Chrome session, no password needed
2. **"Sign up with email"** — fallback, use stored credentials

**Steps**:
```
CONNECT CHROME first

1. Navigate to platform's sign-up page
2. Check for "Continue with Google" / "Sign in with Google" button
3. Click it → Google will auto-select daddyambo40@gmail.com (already logged in)
4. Grant basic permissions (name, email)
5. Platform creates account from Google profile data
6. Complete any onboarding steps
```

### Gmail Inbox: No Login Needed

Since Gmail is already logged into Chrome:

```javascript
// Just navigate directly — already authenticated
await page.goto('https://mail.google.com/mail/u/0/#inbox');
// Search for verification emails
await page.fill('input[aria-label="Search mail"]', 'TikTok verification');
```

## Account Management Reference

| Platform | Sign-up URL | Best Method | Verification |
|----------|-------------|-------------|--------------|
| TikTok | `https://www.tiktok.com/signup` | Google Sign-In | Email code |
| YouTube | `https://www.youtube.com/` | Already logged in | None needed |
| Instagram | `https://www.instagram.com/accounts/emailsignup/` | Google Sign-In | Email link |
| Twitter/X | `https://twitter.com/i/flow/signup` | Google Sign-In | Email code |
| Discord | `https://discord.com/register` | Google Sign-In | Email |
| Reddit | `https://www.reddit.com/register/` | Google Sign-In | Email |
| Pinterest | `https://www.pinterest.com/` | Google Sign-In | Email |
| LinkedIn | `https://www.linkedin.com/signup` | Google Sign-In | Email + phone |

## Important Notes

- **Already logged in**: You don't need to re-login to Google. Just navigate to `mail.google.com` — it's already authenticated in Chrome.
- **Connect Chrome first**: Always use the `connect-chrome` skill to launch the browser. This preserves all cookies, sessions, and the Gmail login state.
- **Google Sign-In**: Most platforms support "Continue with Google" — this is the fastest path since the account is already logged in.
- **Password for non-Google sign-ups**: Only needed when a platform doesn't offer Google Sign-In and you're using email+password directly.
- **Unique passwords**: When creating platform-specific accounts, you can set unique passwords per platform (the Gmail password is just for Gmail).

## Experience Notes

Path: `{working-directory}/gmail-memories/gmail-accounts.memory.md`

**Before execution**: If the file exists, read it first.

**After execution**: If unexpected situation encountered or better pattern discovered, append:
`{YYYY-MM-DD}: {what happened} → {conclusion}`
