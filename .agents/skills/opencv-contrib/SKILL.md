---
name: opencv-contrib
version: "1.0.0"
description: "OpenCV Contrib (extra modules) — additional functionality beyond main modules. Covers: ximgproc (edge-aware filters, structured forests, superpixels, fast line detector), xphoto (white balance, denoising, inpainting improvements), tracking (CSRT, KCF, MIL, MOSSE trackers), face (face recognition: LBPH, EigenFaces, FisherFaces), text (scene text detection & recognition), aruco (ArUco markers, AprilTags, ChArUco boards), bgsegm (advanced background subtraction), optflow (additional optical flow algorithms), dnn_superres (super-resolution with neural networks), rgbd (RGB-depth processing), sfm (structure from motion), bioinspired (retina, saliency), phase_unwrapping, xfeatures2d (SIFT, SURF, LATCH, LUCID — non-free/patented), xobjdetect (Waldboost, latent SVM), surface_matching (3D object recognition), wechat_qrcode (WeChat QR detector), rapid (silhouette-based 3D tracking), intensity_transform (adaptive tone mapping), cannops (Ascend NPU acceleration), and other contrib modules. Use when the user asks to: install opencv-contrib-python, use extra OpenCV modules, do superpixel segmentation, use structured forests for edge detection, do automatic white balance, use super-resolution DNN models, process RGB-D/depth data, do structure from motion, use retina filters, use scene text detection, detect AprilTags, use enhanced background subtraction algorithms."
argument-hint: 'opencv-contrib install contrib opencv | opencv-contrib superpixels | opencv-contrib face recognition | opencv-contrib text detection | opencv-contrib super resolution'
allowed-tools: Bash, Read, Write, WebFetch, Grep
user-invocable: true
metadata:
  openclaw:
    emoji: "🔌"
    tags: [opencv, contrib, extra-modules, ximgproc, xphoto, face-recognition, text-detection, aruco, super-resolution, rgbd, sfm, tracking, bioinspired, wechat-qrcode]
    repo: https://github.com/opencv/opencv_contrib
    docs: https://docs.opencv.org/4.x/
    license: Apache-2.0
---

# 🔌 OpenCV Contrib — Extra Modules

Contrib modules add specialized vision capabilities. Install with:

```bash
pip install opencv-contrib-python
# All main + contrib modules in one package
```

Or build from source:

```bash
cmake -D OPENCV_EXTRA_MODULES_PATH=/path/to/opencv_contrib/modules ..
```

---

## Installation Check

```python
import cv2

# Check which contrib modules are available
def list_contrib_modules():
    modules = []
    # Try common contrib modules
    checks = {
        'ximgproc': hasattr(cv2, 'ximgproc'),
        'xphoto': hasattr(cv2, 'xphoto'),
        'face': hasattr(cv2, 'face'),
        'text': hasattr(cv2, 'text'),
        'aruco': hasattr(cv2, 'aruco'),
        'bgsegm': hasattr(cv2, 'bgsegm'),
        'optflow': hasattr(cv2, 'optflow'),
        'phase_unwrapping': hasattr(cv2, 'phase_unwrapping'),
        'plot': hasattr(cv2, 'plot'),
        'quality': hasattr(cv2, 'quality'),
        'rapid': hasattr(cv2, 'rapid'),
        'rgbd': hasattr(cv2, 'rgbd'),
        'saliency': hasattr(cv2, 'saliency'),
        'sfm': hasattr(cv2, 'sfm'),
        'surface_matching': hasattr(cv2, 'surface_matching'),
        'xfeatures2d': hasattr(cv2, 'xfeatures2d'),
        'wechat_qrcode': hasattr(cv2, 'wechat_qrcode'),
    }
    for mod, available in checks.items():
        status = '✅' if available else '❌'
        print(f"  {status} {mod}")
```

---

## ximgproc — Extended Image Processing

### Edge-Aware Filters (bilateral-like but faster)

```python
# Domain Transform Filter — edge-preserving, real-time
filtered = cv2.ximgproc.dtFilter(img, img, sigmaSpatial=20, sigmaColor=30, mode=cv2.ximgproc.DTF_NC)

# Guided Filter
guided = cv2.ximgproc.guidedFilter(guide=img, src=img, radius=10, eps=100)

# AMA Filter — Adaptive Manifold
ama_filter = cv2.ximgproc.createAMAFilter(sigma=10, lambda_=0.1)
filtered = ama_filter.filter(img, img)
```

### Superpixels

```python
# SLIC Superpixels — fast, compact
slic = cv2.ximgproc.createSuperpixelSLIC(img, algorithm=cv2.ximgproc.SLICO, region_size=30, ruler=20.0)
slic.iterate(10)
mask_slic = slic.getLabelContourMask()
labels_slic = slic.getLabels()

# SEEDS Superpixels
seeds = cv2.ximgproc.createSuperpixelSEEDS(img.shape[1], img.shape[0], img.shape[2], num_superpixels=200, num_levels=4)
seeds.iterate(img, 10)
mask_seeds = seeds.getLabelContourMask()
```

### Edge Detection — Structured Forests

```python
# Much better edges than Canny — but has a model
model_path = 'model.yml.gz'  # Download from opencv_contrib
edge_detector = cv2.ximgproc.createStructuredEdgeDetection(model_path)
edges = edge_detector.detectEdges(img_float)
```

### Fast Line Detector

```python
fld = cv2.ximgproc.createFastLineDetector(length_threshold=50, distance_threshold=1.414,
                                          canny_th1=50, canny_th2=50, canny_aperture=3,
                                          do_merge=False)
lines = fld.detect(gray)
if lines is not None:
    fld.drawSegments(img, lines)
```

---

## xphoto — Extended Photo Processing

### White Balance

```python
# Gray-world white balance
wb = cv2.xphoto.createGrayworldWB()
wb.setSaturationThreshold(0.95)
balanced = wb.balanceWhite(img)

# Learning-based white balance
wb_learn = cv2.xphoto.createLearningBasedWB('model_path')
balanced_learn = wb_learn.balanceWhite(img)

# Simple white balance
balanced_simple = cv2.xphoto.balanceWhite(img, cv2.xphoto.WB_GRAYWORLD)
```

### Denoising

```python
# BM3D denoising (state-of-the-art)
denoised = cv2.xphoto.bm3dDenoising(img_noisy, sigma=10)

# With luminance preservation
denoised = cv2.xphoto.bm3dDenoising(img_noisy, sigma=10, h=8, templateWindowSize=8, searchWindowSize=16)
```

### Inpainting

```python
# Improved inpainting vs main module
restored = cv2.xphoto.inpaint(img_with_holes, mask, cv2.xphoto.INPAINT_SHIFTMAP)
```

---

## Face — Face Recognition

Requires `opencv-contrib-python`:

```python
# LBPH — Local Binary Patterns Histograms
recognizer = cv2.face.LBPHFaceRecognizer_create(radius=1, neighbors=8, grid_x=8, grid_y=8)

# Train
recognizer.train(face_images, labels)

# Save/Load
recognizer.save('face_model.yml')
recognizer.read('face_model.yml')

# Predict
label, confidence = recognizer.predict(face_region)
print(f"Person {label}, confidence {confidence:.1f}")
# LBPH: <50 = great match, 50-80 = good, >80 = poor

# EigenFaces / FisherFaces
eigen = cv2.face.EigenFaceRecognizer_create()
fisher = cv2.face.FisherFaceRecognizer_create()

# Facemark detection (landmarks)
facemark = cv2.face.createFacemarkLBF()
facemark.loadModel('lbfmodel.yaml')
ok, landmarks = facemark.fit(img, faces)
```

---

## Text — Scene Text Detection & Recognition

```python
# Text detection (EAST-like)
# Using ERFilters (Efficient Region filtering):
er_filter1 = cv2.text.createERFilterNM1(
    cv2.text.loadClassifierNM1('trained_classifierNM1.xml'), 16, 0.00015, 0.13, 0.2, True, 0.1
)
er_filter2 = cv2.text.createERFilterNM2(
    cv2.text.loadClassifierNM2('trained_classifierNM2.xml'), 0.5
)

# Detect
channels = cv2.text.computeNMChannels(gray)
for channel in channels:
    er1 = er_filter1.run(channel)
    er2 = er_filter2.run(channel)
    # Group regions into text lines
    text_regions = cv2.text.erGrouping(img, channels, [er1, er2])

# OCR (using Tesseract via OpenCV)
# Requires: apt install tesseract-ocr
# text_spotter = cv2.text.TextDetectorCNN_create('textbox.prototxt', 'TextBoxes_icdar13.caffemodel')
```

---

## Tracking — Modern Object Trackers

```python
# Available tracker types:
# CSRT — Best accuracy (discriminative correlation filter + channel/spatial reliability)
# KCF — Best speed/accuracy balance (kernelized correlation filter)
# MIL — Good with partial occlusion
# MOSSE — Fastest, tracks on minimal training (one frame)
# MedianFlow — Good for predictable motion
# Boosting — Online AdaBoost
# TLD — Tracking-learning-detection

tracker = cv2.TrackerCSRT_create()
# tracker = cv2.TrackerKCF_create()
# tracker = cv2.TrackerMIL_create()
# tracker = cv2.TrackerMOSSE_create()

# Initialize
bbox = (x, y, w, h)
tracker.init(frame, bbox)

# Update each frame
success, bbox = tracker.update(frame)
if success:
    x, y, w, h = [int(v) for v in bbox]
    cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 0), 2)
```

---

## Optflow — Additional Optical Flow

```python
# DeepFlow — Deep learning optical flow (best quality)
deepflow = cv2.optflow.createOptFlow_DeepFlow()
flow = deepflow.calc(prev_gray, gray, None)

# PCAFlow — Principal Component Analysis flow
pcaflow = cv2.optflow.createOptFlow_PCAFlow()
flow = pcaflow.calc(prev_gray, gray, None)

# DIS Flow — Dense Inverse Search (fast)
dis = cv2.optflow.createOptFlow_DIS(cv2.optflow.DISOPTICAL_FLOW_PRESET_MEDIUM)
flow = dis.calc(prev_gray, gray, None)
```

---

## RGBD — RGB-Depth Processing

```python
# Register depth to RGB
depth_registered = cv2.rgbd.registerDepth(rgb, depth, camera_matrix,
                                           depth_camera_matrix, R, T)

# Normal computation from depth
normals = cv2.rgbd.RgbdNormals_create(h, w, cv2.CV_32F, camera_matrix)
normals_computed = normals.apply(depth_as_float)

# Odometry from RGB-D
odometry = cv2.rgbd.RgbdOdometry_create(camera_matrix)
success, Rt = odometry.compute(rgb_src, depth_src, rgb_dst, depth_dst)
```

---

## DNN Super-Resolution

```python
sr = cv2.dnn_superres.DnnSuperResImpl_create()
sr.readModel('ESPCN_x2.pb')  # Download from opencv_contrib
sr.setModel('espcn', 2)       # 2x upscaling
# Models: 'edsr', 'espcn', 'fsrcnn', 'lapsrn'

upscaled = sr.upsample(img)
```

---

## WeChat QR Code

```python
detector = cv2.wechat_qrcode.WeChatQRCode(
    'detect.prototxt', 'detect.caffemodel',
    'sr.prototxt', 'sr.caffemodel'
)
# Better than main module QR detector — handles damaged/bent codes

results, points = detector.detectAndDecode(img)
for text, pts in zip(results, points):
    print(f"QR: {text}")
    cv2.polylines(img, [pts.astype(int)], True, (0, 255, 0), 2)
```

---

## Quick One-Liners

```bash
# Check contrib availability
python3 -c "import cv2; [print(f'{\"✅\" if hasattr(cv2,x) else \"❌\"} {x}') for x in ['ximgproc','xphoto','face','aruco','wechat_qrcode']]"

# SLIC superpixels
python3 -c "
import cv2; i=cv2.imread('in.jpg')
s=cv2.ximgproc.createSuperpixelSLIC(i,cv2.ximgproc.SLICO,30)
s.iterate(10); m=s.getLabelContourMask()
i[m>0]=(0,255,0); cv2.imwrite('out.jpg',i)
"

# Fast line detector
python3 -c "
import cv2; i=cv2.imread('in.jpg'); g=cv2.cvtColor(i,cv2.COLOR_BGR2GRAY)
f=cv2.ximgproc.createFastLineDetector(); l=f.detect(g)
print(f'Detected {len(l) if l is not None else 0} lines')
"
```
