---
name: machine-access
description: "Full machine control and visual access — type into browsers, control desktop GUI, take screenshots, interact with any app, automate macOS via AppleScript, click UI elements, fill forms, navigate the web, open/close apps, manage files, use keyboard shortcuts, and observe everything a human user sees on screen. Use when you need to interact with the machine like a human: typing in browsers, clicking desktop UI, observing screen state, controlling GUI apps, or performing any visual/input task."
---

# Machine Access Skill

You have full control of this machine. Use the tools below to see everything a user sees and interact with everything a user can interact with.

## Core Principle

This machine runs macOS. You can:
- **See** via screenshots (`screencapture`) and Playwright browser snapshots
- **Type** via Playwright MCP (in browsers) and AppleScript (`keystroke`) (system-wide)
- **Click** via Playwright MCP (in browsers) and AppleScript UI scripting (system-wide)
- **Navigate the web** via Playwright MCP (preferred) or `curl`/`open` (CLI)
- **Control apps** via `open -a`, `osascript`, `quit app`
- **Access files** via shell commands (read, write, list, search)

---

## 1. Browser Control — Playwright MCP (preferred for ALL browser tasks)

Playwright MCP is the primary tool for anything in a browser. Use the `playwright` MCP tool for:

### Navigation & Page Control
```
navigate to "https://example.com"
go back / go forward
reload
```

### Typing & Forms
```
click "input[name='search']"
fill "input[name='search']" with "query text"
press "Enter"
type "text into focused element"
select option from dropdown
upload file to input
```

### Reading & Extraction
```
get text content of "h1"
get all links on page
get page title
get URL
extract text from element
get table rows
get console logs
```

### Visual Observation
```
take screenshot (full page, or visible viewport)
take screenshot of specific element
```

### Dialog Handling
```
accept alert / dismiss alert
get alert text
```

### Multi-Page
```
list all pages / tabs
switch to page by URL or title
close page
new page
```

### Example: Full User Flow
```
1. navigate to "https://google.com"
2. fill "textarea[name='q']" with "eburon ai"
3. press "Enter"
4. wait for navigation
5. take screenshot
6. get all search result links
```

---

## 2. Desktop GUI Control — AppleScript / System Events

For anything outside the browser — controlling native macOS apps, the Finder, system dialogs, etc.

### Open & Focus Apps
```bash
# Open an app
open -a "Safari"
open -a "Terminal"
open -a "Visual Studio Code"

# Open a URL in default browser
open https://example.com

# Focus/bring to front
osascript -e 'tell application "System Events" to set frontmost of (first process whose name is "Safari") to true'

# Quit
osascript -e 'quit app "Safari"'
```

### Typing Anywhere (system-wide keystrokes)
```bash
# Type text into whatever is focused
osascript -e 'tell application "System Events" to keystroke "Hello from Eburon AI"'

# Special keys
osascript -e 'tell application "System Events" to keystroke return'     # Enter
osascript -e 'tell application "System Events" to keystroke tab'        # Tab
osascript -e 'tell application "System Events" to key code 53'          # Escape
osascript -e 'tell application "System Events" to key code 124'         # Right arrow
osascript -e 'tell application "System Events" to key code 123'         # Left arrow
osascript -e 'tell application "System Events" to key code 125'         # Down arrow
osascript -e 'tell application "System Events" to key code 126'         # Up arrow

# Modifier combinations
osascript -e 'tell application "System Events" to keystroke "c" using command down'   # Cmd+C copy
osascript -e 'tell application "System Events" to keystroke "v" using command down'   # Cmd+V paste
osascript -e 'tell application "System Events" to keystroke "a" using command down'   # Cmd+A select all
osascript -e 'tell application "System Events" to keystroke "s" using command down'   # Cmd+S save
osascript -e 'tell application "System Events" to keystroke "w" using command down'   # Cmd+W close tab
osascript -e 'tell application "System Events" to keystroke "t" using command down'   # Cmd+T new tab
osascript -e 'tell application "System Events" to keystroke "n" using command down'   # Cmd+N new window
osascript -e 'tell application "System Events" to keystroke "`" using command down'   # Cmd+` switch window
osascript -e 'tell application "System Events" to keystroke space using command down' # Cmd+Space Spotlight
osascript -e 'tell application "System Events" to keystroke tab using command down'   # Cmd+Tab app switcher
```

### GUI Automation — Clicking UI Elements
```bash
# Click a menu bar item
osascript -e 'tell application "System Events" to click menu bar item "File" of process "Safari"'

# Click a button in a specific window
osascript -e 'tell application "System Events" to click button "OK" of window 1 of process "Finder"'

# Get all UI elements of frontmost app (accessibility tree)
osascript -e 'tell application "System Events" to get name of every UI element of (first process whose frontmost is true)'

# List all windows of an app
osascript -e 'tell application "System Events" to get name of every window of process "Safari"'

# Get position and size of window
osascript -e 'tell application "System Events" to get position of window 1 of process "Safari"'
osascript -e 'tell application "System Events" to get size of window 1 of process "Safari"'

# Set window position
osascript -e 'tell application "System Events" to set position of window 1 of process "Safari" to {0, 0}'
```

### System Dialogs
```bash
# Show a notification
osascript -e 'display notification "Task complete" with title "Eburon AI"'

# Show dialog with input
osascript -e 'display dialog "Enter your name:" default answer "" buttons {"OK"} default button 1'

# Show alert
osascript -e 'display alert "Warning" message "Something needs attention"'
```

### Clipboard
```bash
# Get clipboard content
osascript -e 'the clipboard'

# Set clipboard
echo -n "text to copy" | pbcopy

# Paste from clipboard
pbpaste
```

### Finder
```bash
# Get frontmost Finder path
osascript -e 'tell application "Finder" to get POSIX path of (target of front window as alias)'

# Make new folder on desktop
osascript -e 'tell application "Finder" to make new folder at desktop with properties {name:"New Folder"}'

# Select file
osascript -e 'tell application "Finder" to select file "Macintosh HD:Users:eburon:file.txt"'

# Empty trash
osascript -e 'tell application "Finder" to empty trash'
```

---

## 3. Visual Observation — See What the User Sees

### Desktop Screenshots
```bash
# Full desktop
screencapture -x ~/Desktop/screenshot.png

# With delay (for capturing menus, hover states)
screencapture -T 2 -x ~/Desktop/screenshot.png

# Selected area (interactive)
screencapture -s ~/Desktop/selection.png

# Specific window (interactive)
screencapture -W ~/Desktop/window.png
```

### Browser Snapshots (via Playwright MCP)
```
playwright tool: navigate to URL, then take screenshot
playwright tool: take screenshot of specific element
playwright tool: get full page screenshot
```

### What's Visible Right Now
```bash
# All visible windows
osascript -e 'tell application "System Events" to get name of every window of (every process whose background only is false)'

# Frontmost app and window title
osascript -e 'tell application "System Events" to get name of first process whose frontmost is true'
osascript -e 'tell application "System Events" to get name of every window of (first process whose frontmost is true)'

# All running GUI apps
osascript -e 'tell application "System Events" to get name of every process whose background only is false'

# Screen resolution
osascript -e 'tell application "Finder" to get bounds of window of desktop'
```

---

## 4. Application-Specific Automation

### Safari/Chrome
```bash
# Get URL of active tab
osascript -e 'tell application "Safari" to get URL of current tab of front window'
osascript -e 'tell application "Google Chrome" to get URL of active tab of front window'

# Get page text
osascript -e 'tell application "Safari" to get text of current tab of front window'

# Execute JavaScript in browser
osascript -e 'tell application "Safari" to do JavaScript "document.title" in current tab of front window'

# Open new tab
osascript -e 'tell application "Safari" to make new tab at end of tabs of front window with properties {URL:"https://example.com"}'
osascript -e 'tell application "Google Chrome" to open location "https://example.com"'
```

### Terminal
```bash
# Run command in Terminal
osascript -e 'tell application "Terminal" to do script "echo hello"'

# Get Terminal content
osascript -e 'tell application "Terminal" to get text of front window'

# Open new Terminal window
osascript -e 'tell application "Terminal" to do script ""'
```

---

## 5. File System Access

```bash
# Navigate and list
ls -la ~/Desktop/
ls -la ~/Downloads/

# Read files
cat ~/Desktop/notes.txt
python3 -c "print(open('file.txt').read())"

# Write files
echo "content" > ~/Desktop/newfile.txt

# Search
mdfind "kind:pdf eburon"
grep -r "pattern" ~/Documents/

# Spotlight metadata
mdls ~/Desktop/file.pdf
```

---

## 6. Full Observation + Action Workflow

Use this pattern when the user asks you to "look at" or "check" something visible:

```
1. SCREENSHOT: screencapture -x ~/Desktop/state-before.png
2. OBSERVE: Read the screenshot (it's an image — describe what you see)
3. LIST APPS: osascript to get running apps and visible windows
4. ACT: Use Playwright MCP (in browser) or AppleScript (desktop) to interact
5. SCREENSHOT AGAIN: screencapture -x ~/Desktop/state-after.png
6. CONFIRM: Describe what changed
```

## Tips & Limitations

- **Playwright MCP is for browser interactions** — navigating, typing into web pages, clicking web elements, extracting web content
- **AppleScript/osascript is for desktop interactions** — controlling native apps, system-wide keystrokes, Finder, dialogs
- **screencapture** — captures pixel-perfect screenshots of the entire desktop
- **Accessibility permissions** — some AppleScript UI interactions require the terminal app to have Accessibility access in System Settings > Privacy & Security > Accessibility
- For complex multi-step actions, take a screenshot first to see the current state, then act
