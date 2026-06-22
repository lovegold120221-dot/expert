---
name: opencv-video
version: "1.0.0"
description: "OpenCV Video Analysis module — video I/O, motion detection, background subtraction (MOG2, KNN, GMG), object tracking with video, mean shift / CamShift, optical flow (dense and sparse), video stabilization, frame differencing, video analytics pipelines, video quality assessment, video encoding/decoding, FFmpeg integration, multi-camera synchronization, video summarization, and video file manipulation. Use when the user asks to: process a video file, detect motion in video, subtract background from video, stabilize shaky video, track objects across video frames, compute optical flow between frames, analyze video for security/surveillance, synchronize multiple camera feeds, create video from images, extract key frames from video, do video quality analysis, process RTSP/network streams."
argument-hint: 'opencv-video background subtraction | opencv-video motion detection | opencv-video stabilize video | opencv-video optical flow | opencv-video process video file'
allowed-tools: Bash, Read, Write, WebFetch, Grep
user-invocable: true
metadata:
  openclaw:
    emoji: "🎥"
    tags: [opencv, video, video-processing, background-subtraction, motion-detection, optical-flow, video-stabilization, video-io, ffmpeg, tracking, surveillance, rtsp]
    docs: https://docs.opencv.org/4.x/d7/de9/group__video.html
    license: Apache-2.0
---

# 🎥 OpenCV Video — Capture, Analysis & Stabilization

---

## Background Subtraction

The standard approach for **motion detection** in static camera scenes.

### MOG2 — Best for most use cases

```python
backSub = cv2.createBackgroundSubtractorMOG2(
    history=500, varThreshold=36, detectShadows=True
)

while True:
    ret, frame = cap.read()
    if not ret: break
    
    # Apply background subtraction
    fg_mask = backSub.apply(frame)
    
    # Clean up mask
    fg_mask = cv2.medianBlur(fg_mask, 5)
    _, fg_mask = cv2.threshold(fg_mask, 200, 255, cv2.THRESH_BINARY)
    
    # Find contours of moving objects
    contours, _ = cv2.findContours(fg_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    for cnt in contours:
        area = cv2.contourArea(cnt)
        if area > 500:  # Filter small noise
            x, y, w, h = cv2.boundingRect(cnt)
            cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 0), 2)
    
    cv2.imshow('Frame', frame)
    cv2.imshow('FG Mask', fg_mask)
    if cv2.waitKey(30) & 0xFF == ord('q'): break
```

### KNN — Alternative (better in some lighting conditions)

```python
backSub = cv2.createBackgroundSubtractorKNN(
    history=500, dist2Threshold=400.0, detectShadows=True
)
```

### GMG — For very noisy environments (requires initial training frames)

```python
backSub = cv2.bgsegm.createBackgroundSubtractorGMG(
    initializationFrames=120, decisionThreshold=0.8
)
```

---

## Frame Differencing — Simple Motion Detection

```python
ret, frame1 = cap.read()
ret, frame2 = cap.read()

while cap.isOpened():
    ret, frame3 = cap.read()
    if not ret: break
    
    # Absolute difference between consecutive frames
    diff1 = cv2.absdiff(frame1, frame2)
    diff2 = cv2.absdiff(frame2, frame3)
    
    # AND diff (eliminates ghosting)
    motion = cv2.bitwise_and(diff1, diff2)
    gray = cv2.cvtColor(motion, cv2.COLOR_BGR2GRAY)
    _, thresh = cv2.threshold(gray, 30, 255, cv2.THRESH_BINARY)
    
    motion_pixels = cv2.countNonZero(thresh)
    if motion_pixels > 1000:
        cv2.putText(frame2, "MOTION DETECTED", (10, 30),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
    
    cv2.imshow('Motion', frame2)
    
    frame1 = frame2
    frame2 = frame3
    if cv2.waitKey(30) & 0xFF == ord('q'): break
```

---

## Video Stabilization

```python
# Simple stabilization using optical flow

cap = cv2.VideoCapture('shaky_video.mp4')
_, prev_frame = cap.read()
prev_gray = cv2.cvtColor(prev_frame, cv2.COLOR_BGR2GRAY)

# Open output
fourcc = cv2.VideoWriter_fourcc(*'mp4v')
out = cv2.VideoWriter('stabilized.mp4', fourcc, 30, (w, h))

# Pre-compute transforms using feature tracking
transforms = []
prev_pts = cv2.goodFeaturesToTrack(
    prev_gray, maxCorners=200, qualityLevel=0.01, minDistance=30, blockSize=3
)

while True:
    ret, frame = cap.read()
    if not ret: break
    
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    
    # Track features
    next_pts, status, _ = cv2.calcOpticalFlowPyrLK(
        prev_gray, gray, prev_pts, None
    )
    
    # Filter valid points
    idx = np.where(status == 1)[0]
    if len(idx) < 10:  # Not enough points, skip
        continue
    
    prev_pts_good = prev_pts[idx]
    next_pts_good = next_pts[idx]
    
    # Find affine transform
    M, _ = cv2.estimateAffinePartial2D(prev_pts_good, next_pts_good)
    
    if M is not None:
        # Extract translation + rotation + scale
        dx, dy = M[0, 2], M[1, 2]
        transforms.append((dx, dy))
        
        # Moving average smoothing
        window = 30
        if len(transforms) >= window:
            smooth_dx = np.mean([t[0] for t in transforms[-window:]])
            smooth_dy = np.mean([t[1] for t in transforms[-window:]])
        else:
            smooth_dx, smooth_dy = dx, dy
        
        # Apply correction
        correction = np.array([
            [1, 0, -smooth_dx + dx],
            [0, 1, -smooth_dy + dy]
        ], dtype=np.float32)
        
        stabilized = cv2.warpAffine(frame, correction, (w, h))
        out.write(stabilized)
    
    prev_gray = gray
    prev_pts = next_pts_good.reshape(-1, 1, 2)

out.release()
```

---

## Video Quality Assessment

```python
def assess_video_quality(video_path):
    cap = cv2.VideoCapture(video_path)
    frame_count = 0
    total_blur = 0
    total_brightness = 0
    total_contrast = 0
    black_frames = 0
    frozen_frames = 0
    prev_gray = None
    
    while True:
        ret, frame = cap.read()
        if not ret: break
        
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        h, w = gray.shape
        
        # Blur detection (Laplacian variance)
        laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
        total_blur += laplacian_var
        
        # Brightness
        total_brightness += np.mean(gray)
        
        # Contrast (std)
        total_contrast += np.std(gray)
        
        # Black frame detection
        if np.mean(gray) < 5:
            black_frames += 1
        
        # Frozen frame detection
        if prev_gray is not None:
            diff = np.mean(cv2.absdiff(gray, prev_gray))
            if diff < 1.0:
                frozen_frames += 1
        
        prev_gray = gray
        frame_count += 1
    
    cap.release()
    
    return {
        "total_frames": frame_count,
        "avg_blur_score": total_blur / frame_count,
        "avg_brightness": total_brightness / frame_count,
        "avg_contrast": total_contrast / frame_count,
        "black_frame_pct": (black_frames / frame_count) * 100,
        "frozen_frame_pct": (frozen_frames / frame_count) * 100,
    }
    # Blur score: <100 = blurry, >200 = sharp
```

---

## Video from Images (Timelapse)

```python
import glob

images = sorted(glob.glob('frames/*.jpg'))
if not images: exit()

# Read first to get dimensions
first = cv2.imread(images[0])
h, w = first.shape[:2]

fourcc = cv2.VideoWriter_fourcc(*'mp4v')
out = cv2.VideoWriter('timelapse.mp4', fourcc, 30, (w, h))

for fname in images:
    img = cv2.imread(fname)
    out.write(img)

out.release()
print(f"Created timelapse from {len(images)} images")
```

---

## Multi-Camera Synchronization

```python
# Open multiple cameras
caps = [cv2.VideoCapture(i) for i in range(4)]

while True:
    frames = []
    for cap in caps:
        ret, frame = cap.read()
        if ret:
            frames.append(frame)
        else:
            frames.append(np.zeros((480, 640, 3), dtype=np.uint8))
    
    if len(frames) >= 2:
        # Stack horizontally
        top = np.hstack(frames[:2])
        bottom = np.hstack(frames[2:])
        grid = np.vstack([top, bottom])
        
        cv2.imshow('Multi-Camera', grid)
    
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

for cap in caps:
    cap.release()
cv2.destroyAllWindows()
```

---

## Video Summarization — Key Frame Extraction

```python
def extract_key_frames(video_path, threshold=30.0):
    cap = cv2.VideoCapture(video_path)
    key_frames = []
    prev_gray = None
    frame_idx = 0
    
    while True:
        ret, frame = cap.read()
        if not ret: break
        
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        
        if prev_gray is not None:
            diff = np.mean(cv2.absdiff(gray, prev_gray))
            if diff > threshold:
                key_frames.append((frame_idx, frame.copy()))
        
        prev_gray = gray
        frame_idx += 1
    
    cap.release()
    return key_frames

# Save key frames
for idx, frame in extract_key_frames('video.mp4', threshold=25.0):
    cv2.imwrite(f'keyframe_{idx:06d}.jpg', frame)
```

---

## Quick One-Liners

```bash
# Extract all frames from video
python3 -c "
import cv2; c=cv2.VideoCapture('video.mp4'); i=0
while True:
    r,f=c.read()
    if not r: break
    cv2.imwrite(f'frame_{i:06d}.jpg',f); i+=1
c.release()
"

# Background subtraction on video
python3 -c "
import cv2; c=cv2.VideoCapture('video.mp4'); b=cv2.createBackgroundSubtractorMOG2()
while True:
    r,f=c.read()
    if not r: break
    cv2.imshow('Motion',cv2.medianBlur(b.apply(f),5))
    if cv2.waitKey(30)&0xFF==ord('q'): break
c.release(); cv2.destroyAllWindows()
"
```
