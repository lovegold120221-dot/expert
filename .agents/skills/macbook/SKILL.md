---
name: macbook
description: "MacBook and macOS automation: AppleScript, system info, hardware diagnostics, Finder, Dock, keyboard shortcuts, power management, network config, file operations, app control, and desktop interaction. Use when you need to control macOS, query system info, automate the desktop, manage files, configure network, or interact with Mac hardware. For combined browser + desktop machine control with Playwright, use the 'machine-access' skill instead."
---

# MacBook Skill

Control and query macOS using built-in tools.

## System Information

```bash
# Hardware info
system_profiler SPHardwareDataType
system_profiler SPSoftwareDataType
system_profiler SPDisplaysDataType

# CPU / Memory / Disk
sysctl -n machdep.cpu.brand_string
sysctl hw.memsize
df -h /

# Battery
pmset -g batt
system_profiler SPPowerDataType

# Serial number
ioreg -l | grep IOPlatformSerialNumber

# macOS version
sw_vers
```

## Application Control

```bash
# Open app
open -a "Safari"
open -a "Terminal"
open -a "Visual Studio Code"

# Open URL in default browser
open https://example.com

# Open file with default app
open document.pdf

# Reveal in Finder
open -R /path/to/file

# Quit app
osascript -e 'quit app "Safari"'

# List running apps
osascript -e 'tell application "System Events" to get name of every process whose background only is false'
```

## AppleScript Automation

```bash
# Create a new Finder window
osascript -e 'tell application "Finder" to make new Finder window to (path to desktop folder)'

# Get frontmost window title
osascript -e 'tell application "System Events" to get name of every window of (first process whose frontmost is true)'

# Set volume
osascript -e 'set volume output volume 50'

# Get clipboard content
osascript -e 'the clipboard'

# Display dialog
osascript -e 'display dialog "Hello from Eburon AI" buttons {"OK"} default button 1'

# Run shell command from AppleScript
osascript -e 'do shell script "echo hello"'
```

## Finder & File Operations

```bash
# Get current Finder path
osascript -e 'tell application "Finder" to get POSIX path of (target of front window as alias)'

# Get desktop path
echo "$HOME/Desktop"

# List recent files
mdfind -name "kMDItemLastUsedDate >= \$time.today(-1)" -onlyin ~/Documents | head -20

# Spotlight search
mdfind "kind:pdf neural network"
```

## Keyboard & Input

```bash
# Simulate key press (requires accessibility permissions)
osascript -e 'tell application "System Events" to key code 124'  # right arrow

# Copy (Cmd+C)
osascript -e 'tell application "System Events" to keystroke "c" using command down'

# Type text
osascript -e 'tell application "System Events" to keystroke "Hello World"'

# Paste (Cmd+V)
osascript -e 'tell application "System Events" to keystroke "v" using command down'

# Enter
osascript -e 'tell application "System Events" to keystroke return'
```

## Power Management

```bash
# Check power source and battery health
pmset -g batt
pmset -g ps

# Display power management settings
pmset -g

# Prevent sleep temporarily (useful during long operations)
caffeinate -d -t 3600

# Check sleep/wake history
pmset -g log | tail -50
```

## Network

```bash
# Get network interfaces
ifconfig
networksetup -listallhardwareports

# Get current IP (primary interface)
ipconfig getifaddr en0

# Check Wi-Fi status and SSID
/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport -I

# List available Wi-Fi networks
/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport -s

# Get DNS servers
scutil --dns | grep "nameserver"

# Flush DNS
sudo dscacheutil -flushcache && sudo killall -HUP mDNSResponder
```

## Display & Resolution

```bash
# Get display info
system_profiler SPDisplaysDataType

# Get screen resolution
osascript -e 'tell application "Finder" to get bounds of window of desktop'
```

## Processes & System

```bash
# Top CPU processes
ps aux --sort=-%cpu | head -10

# Top memory processes
ps aux --sort=-%mem | head -10

# Kill a process
kill <PID>
pkill -f "process-name"

# Check disk usage
du -sh ~/* | sort -hr | head -20

# Check uptime
uptime
```
