---
name: "screenshot"
description: "Take screenshots of applications, websites, or the desktop using native OS tools. Use when user wants to capture what's on screen. Triggers on: 'take a screenshot', 'capture screen', 'screenshot of app', 'screenshot website', 'grab screen'"
---

# Screenshot Skill

Take screenshots using native OS tools.

## macOS

Uses `screencapture` command (built-in).

### Full Screen
```bash
screencapture -x ~/Desktop/screenshot.png
```

### Specific Window (interactive)
```bash
screencapture -W ~/Desktop/screenshot.png
```

### Selected Area (interactive)
```bash
screencapture -s ~/Desktop/screenshot.png
```

### With Delay (for capturing menus/hover states)
```bash
screencapture -T 3 ~/Desktop/screenshot.png  # 3 second delay
```

### Named with Timestamp
```bash
screencapture -x ~/Desktop/screenshot-$(date +%Y%m%d-%H%M%S).png
```

## Linux

Uses `scrot` or `gnome-screenshot`.

### Full Screen
```bash
scrot ~/Desktop/screenshot.png
# or
gnome-screenshot
```

### Selected Area
```bash
scrot -s ~/Desktop/screenshot.png
```

### With Delay
```bash
scrot -d 3 ~/Desktop/screenshot.png
```

## Windows

Uses `Snipping Tool` or PowerShell.

### Capture to Clipboard
```powershell
powershell -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.Screen]::PrimaryScreen"
```

### Save Screenshot
```powershell
# Use built-in Snip & Sketch or Game Bar (Win+G)
```

## Common Use Cases

### Screenshot of Running App
```bash
# 1. Open the app
open http://localhost:5173/

# 2. Wait for it to load
sleep 2

# 3. Take screenshot
screencapture -x ~/Desktop/app-screenshot.png
```

### Screenshot of Website
```bash
# Open in default browser
open https://example.com
sleep 3
screencapture -x ~/Desktop/website.png
```

### Screenshot of URL with Hash Navigation
```bash
open http://localhost:5173/#features
sleep 2
screencapture -x ~/Desktop/features-screenshot.png
```

## Output

Screenshots are saved to the specified path. Default is `~/Desktop/` with timestamped filenames.

## Tips

1. Use `-x` flag to capture without sound (silent mode)
2. Use `-s` for interactive selection mode
3. Use `-T` followed by seconds for delay captures
4. For scrolling websites, use browser DevTools screenshot feature instead
