---
name: opencv-image-processing
version: "1.0.0"
description: "OpenCV imgproc module — Image Processing. Filtering (blur, Gaussian, median, bilateral), morphological operations (erode, dilate, open, close, gradient, tophat, blackhat), geometric transforms (resize, rotate, warpAffine, warpPerspective, remap), image pyramids (pyrDown, pyrUp), thresholding (binary, adaptive, Otsu), edge detection (Canny, Sobel, Laplacian), contours (findContours, drawContours, boundingRect, minAreaRect, convexHull), Hough transforms (lines, circles), histograms (calcHist, equalizeHist, compareHist), connected components, distance transform, watershed, GrabCut, flood fill. Use when the user asks to: filter an image, detect edges, find contours, apply morphology, threshold images, transform images geometrically, equalize histogram, segment images, detect lines/circles, inpaint images."
argument-hint: 'opencv-image-processing blur image | opencv-image-processing edge detection | opencv-image-processing find contours | opencv-image-processing image segmentation'
allowed-tools: Bash, Read, Write, WebFetch, Grep
user-invocable: true
metadata:
  openclaw:
    emoji: "🎨"
    tags: [opencv, imgproc, image-processing, filtering, morphology, edge-detection, contours, hough, histogram, threshold, segmentation, grabcut, watershed, inpainting]
    docs: https://docs.opencv.org/4.x/d7/dbd/group__imgproc.html
    license: Apache-2.0
---

# 🎨 OpenCV Image Processing (imgproc)

The `imgproc` module — the workhorse of OpenCV. 500+ image processing functions.

---

## Smoothing / Blurring

```python
import cv2
img = cv2.imread('photo.jpg')

# Averaging — simple box blur
blur = cv2.blur(img, (5, 5))

# Gaussian — weighted kernel (best for general use)
gauss = cv2.GaussianBlur(img, (5, 5), sigmaX=1.5)

# Median — excellent for salt-and-pepper noise
median = cv2.medianBlur(img, 5)

# Bilateral — preserves edges while smoothing
# sigmaColor=75, sigmaSpace=75
bilateral = cv2.bilateralFilter(img, 9, 75, 75)

# Stacked comparison
stacked = cv2.hconcat([blur, gauss, median, bilateral])
```

**When to use each:**
| Filter | Noise Type | Edge Preservation | Speed |
|--------|-----------|-------------------|-------|
| Blur | Uniform | ❌ | Fastest |
| Gaussian | Gaussian | ❌ | Fast |
| Median | Salt & pepper | Moderate | Medium |
| Bilateral | Any | ✅ Best | Slow |

---

## Morphological Operations

Operate on binary or grayscale images:

```python
kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
kernel_ellipse = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
kernel_cross = cv2.getStructuringElement(cv2.MORPH_CROSS, (5, 5))

eroded  = cv2.erode(binary_img, kernel, iterations=1)
dilated = cv2.dilate(binary_img, kernel, iterations=1)
opened  = cv2.morphologyEx(binary_img, cv2.MORPH_OPEN, kernel)     # Erode → Dilate
closed  = cv2.morphologyEx(binary_img, cv2.MORPH_CLOSE, kernel)    # Dilate → Erode
gradient = cv2.morphologyEx(binary_img, cv2.MORPH_GRADIENT, kernel)  # Dilation - Erosion
tophat  = cv2.morphologyEx(binary_img, cv2.MORPH_TOPHAT, kernel)    # Original - Open
blackhat = cv2.morphologyEx(binary_img, cv2.MORPH_BLACKHAT, kernel) # Close - Original
```

**Pipeline for cleaning binary masks:**
```python
# Remove noise → close gaps → smooth
cleaned = cv2.morphologyEx(
    cv2.morphologyEx(binary_img, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3,3))),
    cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7,7))
)
```

---

## Geometric Transforms

### Resize

```python
# Absolute size
resized = cv2.resize(img, (640, 480))

# Scale factor
resized = cv2.resize(img, None, fx=0.5, fy=0.5)

# Interpolation methods (quality/speed tradeoff):
# cv2.INTER_NEAREST — fastest, pixelated (for pixel art)
# cv2.INTER_LINEAR — default, good balance
# cv2.INTER_CUBIC — smoother, slower
# cv2.INTER_LANCZOS4 — best quality, slowest
resized = cv2.resize(img, None, fx=2.0, fy=2.0, interpolation=cv2.INTER_LANCZOS4)
```

### Rotation

```python
(h, w) = img.shape[:2]
center = (w // 2, h // 2)
M = cv2.getRotationMatrix2D(center, angle=45, scale=1.0)
rotated = cv2.warpAffine(img, M, (w, h))

# Rotate with auto-sizing (no clipping)
cos, sin = abs(M[0,0]), abs(M[0,1])
new_w = int(h * sin + w * cos)
new_h = int(h * cos + w * sin)
M[0,2] += new_w//2 - center[0]
M[1,2] += new_h//2 - center[1]
rotated = cv2.warpAffine(img, M, (new_w, new_h))
```

### Affine & Perspective

```python
# Affine (3 points → 3 points)
pts_src = np.float32([[50,50],[200,50],[50,200]])
pts_dst = np.float32([[10,100],[200,50],[100,250]])
M = cv2.getAffineTransform(pts_src, pts_dst)
affine = cv2.warpAffine(img, M, (w, h))

# Perspective (4 points → 4 points — for document scans)
pts_src = np.float32([[0,0],[w-1,0],[w-1,h-1],[0,h-1]])
pts_dst = np.float32([[50,0],[w-50,0],[w-1,h-1],[0,h-1]])
M = cv2.getPerspectiveTransform(pts_src, pts_dst)
perspective = cv2.warpPerspective(img, M, (w, h))
```

### Image Pyramids

```python
# Gaussian pyramid (reduce)
smaller = cv2.pyrDown(img)     # ½ size
larger = cv2.pyrUp(smaller)    # Back to original size (blurry)

# Laplacian pyramid (for blending)
gaussian = cv2.pyrDown(img)
laplacian = img - cv2.pyrUp(gaussian)
```

---

## Thresholding

```python
# Simple binary threshold
_, binary = cv2.threshold(gray, thresh=127, maxval=255, type=cv2.THRESH_BINARY)

# Threshold types:
# THRESH_BINARY       — dst = (src > thresh) ? maxval : 0
# THRESH_BINARY_INV   — dst = (src > thresh) ? 0 : maxval
# THRESH_TRUNC        — dst = (src > thresh) ? thresh : src
# THRESH_TOZERO       — dst = (src > thresh) ? src : 0
# THRESH_TOZERO_INV   — dst = (src > thresh) ? 0 : src

# Otsu's method — automatic threshold selection
_, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

# Adaptive threshold — handles uneven lighting
adaptive = cv2.adaptiveThreshold(
    gray, 255,
    cv2.ADAPTIVE_THRESH_GAUSSIAN_C,  # or ADAPTIVE_THRESH_MEAN_C
    cv2.THRESH_BINARY,
    blockSize=11,                     # Must be odd
    C=2                               # Subtract from mean
)
```

---

## Edge Detection

### Canny — The Gold Standard

```python
edges = cv2.Canny(gray, threshold1=100, threshold2=200)

# Automatic parameter tuning
sigma = 0.33
median_px = np.median(gray)
lower = int(max(0, (1.0 - sigma) * median_px))
upper = int(min(255, (1.0 + sigma) * median_px))
edges = cv2.Canny(gray, lower, upper)
```

### Sobel — Gradient-based

```python
grad_x = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)    # dx
grad_y = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)    # dy
mag    = cv2.magnitude(grad_x, grad_y)                    # √(dx² + dy²)
angle  = cv2.phase(grad_x, grad_y, angleInDegrees=True)   # Direction
```

### Laplacian — Second derivative

```python
laplacian = cv2.Laplacian(gray, cv2.CV_64F, ksize=3)
```

---

## Contours

```python
# Find contours (OpenCV 4.x+)
contours, hierarchy = cv2.findContours(
    binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
)

# Retrieval modes:
# RETR_EXTERNAL — only outermost
# RETR_LIST — all, no hierarchy
# RETR_TREE — full hierarchy (parent-child)
# RETR_CCOMP — two-level hierarchy

# Approximation:
# CHAIN_APPROX_SIMPLE — compresses (only endpoints)
# CHAIN_APPROX_NONE — all points

# Draw contours
cv2.drawContours(img, contours, -1, (0, 255, 0), 2)     # All
cv2.drawContours(img, contours, idx, (0, 255, 0), 2)     # By index

# Analyze each contour
for cnt in contours:
    area = cv2.contourArea(cnt)                     # Pixel area
    perimeter = cv2.arcLength(cnt, True)            # Perimeter
    approx = cv2.approxPolyDP(cnt, 0.02 * perimeter, True)  # Simplify
    
    # Bounding boxes
    x, y, w, h = cv2.boundingRect(cnt)              # Axis-aligned
    rect = cv2.minAreaRect(cnt)                      # Rotated
    box = cv2.boxPoints(rect)                        # 4 corner points
    
    # Convex hull
    hull = cv2.convexHull(cnt)
    hull_area = cv2.contourArea(hull)
    solidity = area / hull_area                      # Compactness
    
    # Circle / ellipse
    (cx, cy), radius = cv2.minEnclosingCircle(cnt)
    ellipse = cv2.fitEllipse(cnt)
    
    # Moments (centroid, orientation)
    M = cv2.moments(cnt)
    cx = int(M['m10'] / M['m00'])
    cy = int(M['m01'] / M['m00'])
```

---

## Hough Transforms

```python
# Hough Lines — standard
lines = cv2.HoughLines(edges, rho=1, theta=np.pi/180, threshold=100)

# Hough Lines — probabilistic (faster, recommended)
lines = cv2.HoughLinesP(
    edges, rho=1, theta=np.pi/180, threshold=50,
    minLineLength=30, maxLineGap=10
)

# Hough Circles
circles = cv2.HoughCircles(
    gauss, cv2.HOUGH_GRADIENT,
    dp=1.2, minDist=20,
    param1=100, param2=30,
    minRadius=10, maxRadius=100
)
```

---

## Histograms

```python
# Calculate histogram (1D)
hist = cv2.calcHist([gray], [0], None, [256], [0, 256])

# Color histogram
channels = cv2.split(img)
hist_colors = [cv2.calcHist([ch], [0], None, [256], [0, 256]) for ch in channels]

# Equalize (enhance contrast)
equalized = cv2.equalizeHist(gray)

# CLAHE (adaptive equalization — better, no noise amplification)
clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
clahe_result = clahe.apply(gray)

# Back projection (color-based object detection)
roi_hist = cv2.calcHist([hsv_roi], [0, 1], None, [50, 60], [0, 180, 0, 256])
roi_hist = cv2.normalize(roi_hist, roi_hist, 0, 255, cv2.NORM_MINMAX)
mask = cv2.calcBackProject([hsv_frame], [0, 1], roi_hist, [0, 180, 0, 256], 1)

# Compare histograms (similarity)
similarity = cv2.compareHist(hist1, hist2, cv2.HISTCMP_CORREL)
# Methods: CORREL, CHISQR, INTERSECT, BHATTACHARYYA, HELLINGER, CHISQR_ALT, KL_DIV
```

---

## Connected Components

```python
# OpenCV 4.x+ — CC analysis
num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(
    binary, connectivity=8, ltype=cv2.CV_32S
)
# stats: [x, y, width, height, area] for each component
# labels[0] = background, labels[1..] = objects

# Filter by area
MIN_AREA = 100
for i in range(1, num_labels):
    if stats[i, cv2.CC_STAT_AREA] >= MIN_AREA:
        x, y, w, h = stats[i, cv2.CC_STAT_LEFT], stats[i, cv2.CC_STAT_TOP], \
                     stats[i, cv2.CC_STAT_WIDTH], stats[i, cv2.CC_STAT_HEIGHT]
        cv2.rectangle(img, (x, y), (x+w, y+h), (0, 255, 0), 2)
```

---

## Segmentation

### GrabCut — Interactive Foreground Extraction

```python
mask = np.zeros(img.shape[:2], np.uint8)
bgd_model = np.zeros((1, 65), np.float64)
fgd_model = np.zeros((1, 65), np.float64)

# If rectangle mode
rect = (50, 50, 300, 300)  # x, y, w, h — contains the object
cv2.grabCut(img, mask, rect, bgd_model, fgd_model, 5, cv2.GC_INIT_WITH_RECT)

# Extract foreground: 0=BG, 1=FG, 2=prob_BG, 3=prob_FG
fg_mask = np.where((mask == 2) | (mask == 0), 0, 1).astype('uint8')
result = img * fg_mask[:, :, np.newaxis]
```

### Watershed — Marker-based Segmentation

```python
# 1. Find sure foreground
_, fg = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

# 2. Find sure background via dilation
kernel = np.ones((3,3), np.uint8)
bg = cv2.dilate(fg, kernel, iterations=3)

# 3. Unknown region
unknown = cv2.subtract(bg, fg)

# 4. Connected components as markers
_, markers = cv2.connectedComponents(fg)
markers = markers + 1
markers[unknown == 255] = 0

# 5. Apply watershed
markers = cv2.watershed(img, markers)
img[markers == -1] = [0, 0, 255]  # Boundaries in red
```

### Distance Transform

```python
# Distance from each foreground pixel to nearest background
dist = cv2.distanceTransform(binary, cv2.DIST_L2, 5)
cv2.normalize(dist, dist, 0, 1.0, cv2.NORM_MINMAX)

# Threshold to get sure foreground seeds
_, sure_fg = cv2.threshold(dist, 0.5 * dist.max(), 255, 0)
```

---

## Image Inpainting

```python
# Fill in masked regions
restored = cv2.inpaint(
    img, mask, inpaintRadius=3, flags=cv2.INPAINT_TELEA
)  # or INPAINT_NS (Navier-Stokes)
```

---

## Quick One-Liners

```bash
# Convert to grayscale + Gaussian blur + Canny edge
python3 -c "import cv2; cv2.imwrite('edges.jpg', cv2.Canny(cv2.GaussianBlur(cv2.imread('in.jpg',0),(5,5),1.5),100,200))"

# Adaptive threshold + find + draw contours
python3 -c "
import cv2, numpy as np
i=cv2.imread('in.jpg'); g=cv2.cvtColor(i,cv2.COLOR_BGR2GRAY)
t=cv2.adaptiveThreshold(g,255,cv2.ADAPTIVE_THRESH_GAUSSIAN_C,cv2.THRESH_BINARY,11,2)
c,_=cv2.findContours(t,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_SIMPLE)
cv2.drawContours(i,c,-1,(0,255,0),2); cv2.imwrite('out.jpg',i)
"

# CLAHE enhancement
python3 -c "import cv2; c=cv2.createCLAHE(2.0,(8,8)); cv2.imwrite('out.jpg',c.apply(cv2.imread('in.jpg',0)))"
```
