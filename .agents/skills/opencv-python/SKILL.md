---
name: opencv-python
version: "1.0.0"
description: "OpenCV Python API — idiomatic Python patterns, numpy integration, matplotlib integration, video capture with OpenCV, real-time camera pipelines, OpenCV with threading/asyncio, OpenCV with Flask/FastAPI web servers, OpenCV with Streamlit, desktop application patterns, OpenCV with PyTorch/TensorFlow interop, memory and performance optimization in Python, debugging OpenCV Python code. Use when the user asks to: use OpenCV with Python, integrate OpenCV with numpy, stream video from webcam, build a real-time video processing loop, serve OpenCV results via web API, deploy OpenCV with Flask/FastAPI, use OpenCV in a Jupyter notebook, convert between OpenCV and PIL images, process video frames in parallel, optimize OpenCV Python performance, do async video capture."
argument-hint: 'opencv-python webcam capture | opencv-python opencv with flask | opencv-python numpy integration | opencv-python async video | opencv-python jupyter notebook'
allowed-tools: Bash, Read, Write, WebFetch, Grep
user-invocable: true
metadata:
  openclaw:
    emoji: "🐍"
    tags: [opencv, python, numpy, cv2, video-capture, flask, fastapi, streamlit, jupyter, pillow, interop, threading, async, optimization]
    docs: https://docs.opencv.org/4.x/d6/d00/tutorial_py_root.html
    license: Apache-2.0
---

# 🐍 OpenCV Python — Idiomatic Patterns & Integration

---

## NumPy — The Native OpenCV Array

OpenCV images **are** NumPy arrays. No conversion needed.

```python
import cv2
import numpy as np

img = cv2.imread('photo.jpg')         # numpy.ndarray, dtype=uint8, shape=(H, W, 3)
print(type(img))                       # <class 'numpy.ndarray'>
print(img.shape)                       # (480, 640, 3)  — H, W, C
print(img.dtype)                       # uint8
print(img.nbytes)                      # 921,600 bytes (480*640*3)

# NumPy slicing = OpenCV ROI (zero-copy)
roi = img[100:300, 200:400]            # View, not copy — modifying roi modifies img
roi_copy = img[100:300, 200:400].copy()  # Deep copy

# NumPy operations directly on OpenCV images
img[:, :, 0] = 0                       # Zero out blue channel (in-place)
img[img < 50] = 0                      # Threshold in place
img = np.clip(img * 1.5, 0, 255).astype(np.uint8)  # Brighten
```

### Useful NumPy Patterns for OpenCV

```python
# Fast pixel comparison
mask = cv2.inRange(hsv, lower, upper)  # Use instead of manual loops

# Color channel manipulation
b, g, r = cv2.split(img)              # Slow — creates copies
b = img[:, :, 0].copy()               # Same as split
b = img[:, :, 0]                      # View (no copy)

# Fast channel swap
rgb = img[:, :, ::-1]                 # BGR → RGB (view, no copy)

# Create masks quickly
mask = np.zeros(img.shape[:2], dtype=np.uint8)
cv2.circle(mask, (cx, cy), 50, 255, -1)

# Apply mask
result = cv2.bitwise_and(img, img, mask=mask)
```

---

## Video Capture — Webcam / Video File

```python
# From webcam (0 = default camera)
cap = cv2.VideoCapture(0)

# From video file
cap = cv2.VideoCapture('input.mp4')

# From IP camera (RTSP)
cap = cv2.VideoCapture('rtsp://user:pass@192.168.1.100:554/stream1')

# From video URL
cap = cv2.VideoCapture('https://example.com/stream.m3u8')

# Check if opened
if not cap.isOpened():
    print("Cannot open camera/video")
    exit()

# Get properties
w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
fps = cap.get(cv2.CAP_PROP_FPS)
total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

# Set properties
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
cap.set(cv2.CAP_PROP_FPS, 30)
cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)   # Minimize latency
```

---

## Real-Time Video Loop

```python
cap = cv2.VideoCapture(0)
fps_start = cv2.getTickCount()
frame_count = 0

while True:
    ret, frame = cap.read()
    if not ret:
        break
    
    # Process frame
    processed = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    
    # FPS counter
    frame_count += 1
    if frame_count >= 30:
        fps = frame_count / ((cv2.getTickCount() - fps_start) / cv2.getTickFrequency())
        print(f"FPS: {fps:.1f}")
        frame_count = 0
        fps_start = cv2.getTickCount()
    
    cv2.imshow('Frame', processed)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
```

---

## Video Writing

```python
# Define codec and create VideoWriter
fourcc = cv2.VideoWriter_fourcc(*'mp4v')  # or 'XVID','MJPG','H264'
out = cv2.VideoWriter('output.mp4', fourcc, fps, (w, h))

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break
    out.write(frame)  # Write frame

out.release()

# Common fourcc codes:
# 'mp4v' — MP4 (H.263)
# 'avc1' — MP4 (H.264)
# 'XVID' — AVI (MPEG-4)
# 'MJPG' — AVI (Motion JPEG)
# 'VP90' — WebM (VP9)
```

---

## Threading — Non-Blocking Capture

```python
import threading
import queue

class VideoCaptureThread:
    def __init__(self, src=0):
        self.cap = cv2.VideoCapture(src)
        self.q = queue.Queue(maxsize=2)  # Buffer only 2 frames
        self.running = True
        self.thread = threading.Thread(target=self._update, daemon=True)
        self.thread.start()
    
    def _update(self):
        while self.running:
            ret, frame = self.cap.read()
            if ret:
                if self.q.full():
                    try:
                        self.q.get_nowait()  # Drop oldest
                    except queue.Empty:
                        pass
                self.q.put(frame)
    
    def read(self):
        return self.q.get() if not self.q.empty() else None
    
    def release(self):
        self.running = False
        self.thread.join()
        self.cap.release()
```

---

## OpenCV + Flask — Web Streaming

```python
from flask import Flask, Response
import cv2

app = Flask(__name__)
camera = cv2.VideoCapture(0)

def generate_frames():
    while True:
        success, frame = camera.read()
        if not success:
            break
        ret, buffer = cv2.imencode('.jpg', frame)
        frame_bytes = buffer.tobytes()
        
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

@app.route('/video_feed')
def video_feed():
    return Response(generate_frames(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/capture')
def capture():
    success, frame = camera.read()
    ret, buffer = cv2.imencode('.jpg', frame)
    return Response(buffer.tobytes(), mimetype='image/jpeg')

# app.run(host='0.0.0.0', port=5000, debug=False)
```

---

## OpenCV + FastAPI — Async Video Processing

```python
from fastapi import FastAPI, File, UploadFile
from fastapi.responses import StreamingResponse
import cv2
import numpy as np
import io

app = FastAPI()

@app.post("/process")
async def process_image(file: UploadFile = File(...)):
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    # Process
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, 100, 200)
    
    # Encode back
    _, buffer = cv2.imencode('.jpg', edges)
    return StreamingResponse(io.BytesIO(buffer.tobytes()), media_type="image/jpeg")

@app.post("/detect_faces")
async def detect_faces(file: UploadFile = File(...)):
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    faces = face_cascade.detectMultiScale(gray, 1.1, 5)
    
    return {"faces_detected": len(faces), "faces": [(x, y, w, h) for (x, y, w, h) in faces]}
```

---

## OpenCV + Streamlit — Interactive UI

```python
import streamlit as st
import cv2
import numpy as np
from PIL import Image

st.title("📷 OpenCV Image Processor")

uploaded_file = st.file_uploader("Choose an image", type=['jpg', 'png', 'jpeg'])

if uploaded_file:
    file_bytes = np.frombuffer(uploaded_file.read(), np.uint8)
    img = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)
    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    st.image(img_rgb, caption="Original", use_container_width=True)
    
    operation = st.selectbox("Operation", [
        "Grayscale", "Edge Detection", "Blur", "Threshold", "Contours"
    ])
    
    if operation == "Grayscale":
        result = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        st.image(result, caption="Grayscale", use_container_width=True)
    
    elif operation == "Edge Detection":
        low = st.slider("Low threshold", 0, 255, 100)
        high = st.slider("High threshold", 0, 255, 200)
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        edges = cv2.Canny(gray, low, high)
        st.image(edges, caption="Edges", use_container_width=True)
```

---

## OpenCV ↔ PIL Conversion

```python
from PIL import Image
import numpy as np

# PIL → OpenCV
pil_img = Image.open('photo.jpg')
opencv_img = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)

# OpenCV → PIL
opencv_img = cv2.imread('photo.jpg')
pil_img = Image.fromarray(cv2.cvtColor(opencv_img, cv2.COLOR_BGR2RGB))
pil_img.save('converted.jpg')
```

---

## Jupyter Notebook — Inline Display

```python
from IPython.display import display, Image as IPyImage
import cv2
import numpy as np

def show_cv(img, fmt='.jpg', quality=90):
    """Display OpenCV image inline in Jupyter"""
    ret, buf = cv2.imencode(fmt, img, [cv2.IMWRITE_JPEG_QUALITY, quality])
    display(IPyImage(data=buf.tobytes()))

# Usage:
img = cv2.imread('photo.jpg')
show_cv(img)
edges = cv2.Canny(cv2.cvtColor(img, cv2.COLOR_BGR2GRAY), 100, 200)
show_cv(edges)
```

---

## OpenCV + PyTorch Interop

```python
import torch
import cv2
import numpy as np
from torchvision import transforms

# OpenCV → PyTorch tensor
img = cv2.imread('photo.jpg')
img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
tensor = transforms.ToTensor()(img_rgb)           # (3, H, W), [0,1], float32
tensor = tensor.unsqueeze(0)                      # (1, 3, H, W)

# PyTorch tensor → OpenCV
tensor = tensor.squeeze(0).permute(1, 2, 0).numpy()  # (H, W, 3)
tensor = (tensor * 255).numpy().astype(np.uint8)
img_bgr = cv2.cvtColor(tensor, cv2.COLOR_RGB2BGR)
```

---

## Memory & Performance Optimization

```python
# ❌ Slow — creates copies
for i in range(len(frames)):
    gray = cv2.cvtColor(frames[i], cv2.COLOR_BGR2GRAY)
    
# ✅ Fast — reuse output buffer
gray = np.empty((h, w), dtype=np.uint8)
for frame in frames:
    cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY, dst=gray)

# ❌ Avoid split() for single channel
b = cv2.split(img)[0]      # Creates 3 channels, then takes one
# ✅ Direct slice
b = img[:, :, 0].copy()

# ✅ Use cv2.UMat for OpenCL acceleration
umat = cv2.UMat(img)
gauss = cv2.GaussianBlur(umat, (5, 5), 1.5)
result = gauss.get()  # Back to numpy

# ✅ Pre-allocate
result = np.empty_like(img)
cv2.addWeighted(img1, 0.5, img2, 0.5, 0, dst=result)
```

---

## Quick One-Liners

```bash
# Webcam snapshot
python3 -c "import cv2; c=cv2.VideoCapture(0); r,f=c.read(); cv2.imwrite('snap.jpg',f); c.release()"

# Live webcam with edge detection
python3 -c "
import cv2
c=cv2.VideoCapture(0)
while True:
    r,f=c.read()
    cv2.imshow('Edges',cv2.Canny(cv2.cvtColor(f,cv2.COLOR_BGR2GRAY),100,200))
    if cv2.waitKey(1)&0xFF==ord('q'): break
c.release(); cv2.destroyAllWindows()
"
```
