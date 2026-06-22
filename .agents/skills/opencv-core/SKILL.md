---
name: opencv-core
version: "1.0.0"
description: "OpenCV — Open Source Computer Vision Library. Installation, build from source, core data structures (Mat, Scalar, Point, Size, Rect, RotatedRect), image I/O (imread/imwrite/imencode), high-level GUI (highgui), and basic pixel operations. ⭐89.2k, Apache 2.0. Use when the user asks to: install OpenCV, build OpenCV from source, read/write images in C++ or Python, work with Mat/basic OpenCV types, display images with imshow, convert between color spaces, do basic pixel access and manipulation, set up OpenCV on macOS/Linux/Windows/ARM/Raspberry Pi, benchmark OpenCV performance, work with OpenCV namespaces and core utilities."
argument-hint: 'opencv-core install opencv | opencv-core read image | opencv-core mat operations | opencv-core build from source'
allowed-tools: Bash, Read, Write, WebFetch, Grep
user-invocable: true
metadata:
  openclaw:
    emoji: "📷"
    tags: [opencv, computer-vision, installation, build, cmake, mat, image-io, cpp, python, highgui, core, pixel-manipulation, color-conversion]
    repos:
      - https://github.com/opencv/opencv (⭐89.2k)
    docs: https://docs.opencv.org/4.x/
    license: Apache-2.0
---

# 📷 OpenCV Core — Installation, Data Structures & Basic Operations

**⭐89,200 stars | Apache 2.0 | C++ 87.4% | 36,274 commits | OpenCV 5.0.0 released Jun 2026**

The world's most comprehensive computer vision library. 2500+ optimized algorithms.

---

## Installation

### macOS (Homebrew) — Easiest

```bash
# Install latest stable
brew install opencv

# With Python support (auto-detects your Python)
brew install opencv
python3 -c "import cv2; print(cv2.__version__)"
```

### macOS (MacPorts)

```bash
sudo port install opencv
```

### Linux (apt)

```bash
sudo apt update && sudo apt install libopencv-dev python3-opencv
```

### Python (pip) — Pure Python bindings

```bash
pip install opencv-python           # Main modules
pip install opencv-contrib-python   # Main + contrib modules
pip install opencv-python-headless  # No GUI (servers, Docker)
```

### Windows (vcpkg)

```bash
vcpkg install opencv:x64-windows
```

---

## Build from Source

Full control over modules, CUDA, contrib, optimizations:

```bash
git clone https://github.com/opencv/opencv.git
git clone https://github.com/opencv/opencv_contrib.git

cd opencv && mkdir build && cd build

cmake -D CMAKE_BUILD_TYPE=RELEASE \
      -D CMAKE_INSTALL_PREFIX=/usr/local \
      -D OPENCV_EXTRA_MODULES_PATH=../../opencv_contrib/modules \
      -D WITH_CUDA=ON \
      -D WITH_CUDNN=ON \
      -D OPENCV_DNN_CUDA=ON \
      -D WITH_QT=ON \
      -D WITH_OPENGL=ON \
      -D ENABLE_FAST_MATH=ON \
      ..

make -j$(sysctl -n hw.ncpu 2>/dev/null || nproc)
sudo make install
```

**Key CMake flags:**
| Flag | Purpose |
|------|---------|
| `-D WITH_CUDA=ON` | NVIDIA GPU acceleration |
| `-D WITH_CUDNN=ON` | cuDNN for DNN module |
| `-D OPENCV_DNN_CUDA=ON` | DNN inference on GPU |
| `-D WITH_QT=ON` | Qt-based GUI (nicer than GTK) |
| `-D WITH_OPENGL=ON` | OpenGL support |
| `-D WITH_VTK=ON` | 3D visualization |
| `-D BUILD_EXAMPLES=ON` | Build sample programs |
| `-D BUILD_opencv_python3=ON` | Python 3 bindings |
| `-D OPENCV_ENABLE_NONFREE=ON` | Enable patented algorithms (SIFT, SURF) |

### ARM / Raspberry Pi

```bash
cmake -D CMAKE_BUILD_TYPE=RELEASE \
      -D CMAKE_INSTALL_PREFIX=/usr/local \
      -D ENABLE_NEON=ON \
      -D ENABLE_VFPV3=ON \
      -D WITH_TBB=ON \
      -D BUILD_TBB=ON \
      ..
```

---

## Core Data Structures

### Mat — The Universal Image Container

```cpp
// C++
#include <opencv2/core.hpp>
cv::Mat img(480, 640, CV_8UC3);              // 640x480, 3-channel, uchar
cv::Mat img = cv::imread("photo.jpg");        // Read image
cv::Mat gray(rows, cols, CV_8UC1);            // Grayscale (1-channel)
cv::Mat float_img; img.convertTo(float_img, CV_32F);  // Convert type

// Region of Interest
cv::Mat roi = img(cv::Rect(100, 100, 200, 200));  // Shallow copy
cv::Mat roi_copy = img(cv::Rect(100, 100, 200, 200)).clone();  // Deep copy
```

```python
# Python
import cv2
import numpy as np

img = cv2.imread('photo.jpg')                    # H x W x 3 (BGR)
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)      # H x W
hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)        # H x W x 3

# Create blank images
blank = np.zeros((480, 640, 3), dtype=np.uint8)    # Black
white = np.ones((480, 640, 3), dtype=np.uint8) * 255  # White
red = np.full((480, 640, 3), (0, 0, 255), dtype=np.uint8)

# Access pixels
pixel = img[100, 200]                            # BGR value at (x=200, y=100)
img[100:200, 200:300] = (0, 255, 0)               # Set region to green
```

### Type Naming Convention

```
CV_{BITS}{TYPE}C{CHANNELS}
```

| Type | C++ | NumPy Equivalent |
|------|-----|------------------|
| `CV_8UC3` | `uchar` 3-channel | `np.uint8` |
| `CV_8UC1` | `uchar` 1-channel | `np.uint8` |
| `CV_32FC3` | `float` 3-channel | `np.float32` |
| `CV_64FC1` | `double` 1-channel | `np.float64` |
| `CV_16SC1` | `short` 1-channel | `np.int16` |

### Other Key Types

```cpp
cv::Scalar(255, 0, 0, 255);          // BGR(A) color
cv::Point(100, 200);                 // x, y
cv::Size(640, 480);                  // width, height
cv::Rect(10, 10, 200, 200);          // x, y, width, height
cv::RotatedRect(center, size, angle); // Rotated rectangle
cv::Vec3b(128, 64, 32);              // 3-element vector (uchar)
cv::Range(0, 100);                   // Start, end (exclusive)
```

---

## Image I/O

```python
# Python
img = cv2.imread('input.jpg')                          # Read (BGR)
img = cv2.imread('input.png', cv2.IMREAD_GRAYSCALE)     # As grayscale
img = cv2.imread('input.png', cv2.IMREAD_UNCHANGED)     # With alpha

cv2.imwrite('output.jpg', img)                         # Write JPEG
cv2.imwrite('output.png', img, [cv2.IMWRITE_PNG_COMPRESSION, 9])  # PNG with compression

# Encode to bytes (in-memory)
_, buf = cv2.imencode('.jpg', img, [cv2.IMWRITE_JPEG_QUALITY, 95])
```

```cpp
// C++
cv::Mat img = cv::imread("input.jpg", cv::IMREAD_COLOR);
cv::imwrite("output.jpg", img);
std::vector<uchar> buf;
cv::imencode(".jpg", img, buf, {cv::IMWRITE_JPEG_QUALITY, 95});
```

---

## GUI (HighGUI)

```python
# Python
cv2.imshow('Window', img)
cv2.waitKey(0)                         # Wait for any key
cv2.destroyAllWindows()
key = cv2.waitKey(1) & 0xFF            # Non-blocking key check
if key == ord('q'): break
```

```cpp
// C++
cv::namedWindow("Window", cv::WINDOW_NORMAL);  // Resizable
cv::setWindowProperty("Window", cv::WND_PROP_FULLSCREEN, cv::WINDOW_FULLSCREEN);
cv::imshow("Window", img);
cv::waitKey(0);
```

**Mouse Callback:**
```python
def on_mouse(event, x, y, flags, param):
    if event == cv2.EVENT_LBUTTONDOWN:
        print(f"Click at ({x}, {y}) = {img[y, x]}")

cv2.setMouseCallback('Window', on_mouse)
```

---

## Drawing Primitives

```python
# Python
cv2.line(img, (0, 0), (500, 400), (0, 255, 0), thickness=2)
cv2.circle(img, (250, 250), 100, (255, 0, 0), thickness=2)  # -1 = fill
cv2.rectangle(img, (50, 50), (300, 300), (0, 0, 255), 2)
cv2.ellipse(img, (250, 250), (100, 50), 0, 0, 360, (255, 255, 0), 2)
cv2.putText(img, 'Hello', (50, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
```

```cpp
// C++
cv::line(img, cv::Point(0,0), cv::Point(500,400), cv::Scalar(0,255,0), 2);
cv::circle(img, cv::Point(250,250), 100, cv::Scalar(255,0,0), 2);
cv::putText(img, "Hello", cv::Point(50,50), cv::FONT_HERSHEY_SIMPLEX, 1.0, cv::Scalar(255,255,255), 2);
```

---

## Color Space Conversion

```python
# Python
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
hsv  = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
lab  = cv2.cvtColor(img, cv2.COLOR_BGR2Lab)
rgb  = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)       # For matplotlib display
hls  = cv2.cvtColor(img, cv2.COLOR_BGR2HLS)

# Split / Merge channels
b, g, r = cv2.split(img)
merged = cv2.merge([b, g, r])
```

**HSV Color Ranges (for color filtering):**
```python
# Red: H ~0-10 and 160-180, S ~50-255, V ~50-255
# Green: H ~40-80, S ~50-255, V ~50-255
# Blue: H ~100-140, S ~50-255, V ~50-255
lower_red1 = np.array([0, 50, 50])
upper_red1 = np.array([10, 255, 255])
lower_red2 = np.array([160, 50, 50])
upper_red2 = np.array([180, 255, 255])
```

---

## Pixel Operations

```python
# Python — NumPy is the native OpenCV array type
img = cv2.imread('photo.jpg')
h, w = img.shape[:2]

# Arithmetic
brighter = cv2.add(img, 50)           # Saturated add
blended = cv2.addWeighted(img1, 0.7, img2, 0.3, 0)  # Alpha blend

# Logical
cv2.bitwise_and(img, mask)            # Masking
cv2.bitwise_or(img1, img2)
cv2.bitwise_xor(img1, img2)
cv2.bitwise_not(img)                  # Invert

# Compare
cv2.compare(img, 128, cv2.CMP_GT)     # Threshold comparison

# In-place vs copy
img += 50                             # Numpy (may overflow vs saturate)
cv2.add(img, 50, img)                 # In-place saturated
```

**Performance Benchmarking:**
```python
import time
start = time.perf_counter()
# ... operation ...
elapsed = (time.perf_counter() - start) * 1000
print(f"{elapsed:.1f} ms")
```

```cpp
// C++
cv::TickMeter tm;
tm.start();
// ... operation ...
tm.stop();
std::cout << tm.getTimeMilli() << " ms" << std::endl;
```

---

## Quick One-Liner

```bash
# Verify installation
python3 -c "import cv2; print(f'OpenCV {cv2.__version__}, {cv2.getBuildInformation().split(chr(10))[0]}')"

# Read, resize, save in one line
python3 -c "import cv2; cv2.imwrite('out.jpg', cv2.resize(cv2.imread('in.jpg'), (640, 480)))"
```
