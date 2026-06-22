---
name: opencv-vision
version: "1.0.0"
description: "OpenCV Computer Vision — feature detection & description (SIFT, SURF, ORB, AKAZE, BRISK, KAZE), feature matching (BFMatcher, FLANN), camera calibration (findChessboardCorners, calibrateCamera, undistort, stereo calibration), object detection (Haar cascades, HOG + SVM, QR/barcode detection, ArUco markers), object tracking (KLT optical flow, MeanShift, CamShift, MIL, KCF, CSRT, Boosting), face detection & recognition (LBPH, EigenFaces, FisherFaces), and image stitching. Use when the user asks to: detect features in an image, match features between images, calibrate a camera, undistort images, detect faces with Haar cascades, detect QR codes, track objects in video, do optical flow, find homography, stitch images into a panorama, detect ArUco markers, do face recognition."
argument-hint: 'opencv-vision detect features | opencv-vision calibrate camera | opencv-vision track object | opencv-vision detect faces | opencv-vision stitch panorama'
allowed-tools: Bash, Read, Write, WebFetch, Grep
user-invocable: true
metadata:
  openclaw:
    emoji: "👁️"
    tags: [opencv, computer-vision, feature-detection, sift, orb, camera-calibration, object-detection, haar-cascade, tracking, optical-flow, face-detection, qr-code, aruco, panorama-stitching, homography]
    docs: https://docs.opencv.org/4.x/
    license: Apache-2.0
---

# 👁️ OpenCV Computer Vision

Features, calibration, object detection, and tracking.

---

## Feature Detection & Description

### SIFT — Scale-Invariant (Best Quality)

```python
# Note: Enable OPENCV_ENABLE_NONFREE=ON at build, or use opencv-contrib-python
sift = cv2.SIFT_create(nfeatures=0, nOctaveLayers=3, contrastThreshold=0.04,
                       edgeThreshold=10, sigma=1.6)
keypoints, descriptors = sift.detectAndCompute(gray, None)

# Draw keypoints
cv2.drawKeypoints(img, keypoints, img, flags=cv2.DRAW_MATCHES_FLAGS_DRAW_RICH_KEYPOINTS)
```

### ORB — Real-time (Best Speed)

```python
orb = cv2.ORB_create(nfeatures=500, scaleFactor=1.2, nlevels=8,
                     edgeThreshold=31, firstLevel=0, WTA_K=2,
                     scoreType=cv2.ORB_FAST_SCORE, patchSize=31)
keypoints, descriptors = orb.detectAndCompute(gray, None)
```

### Available Detectors

| Detector | Rotation Inv. | Scale Inv. | Speed | Best For |
|----------|:---:|:---:|:---:|---------|
| **SIFT** | ✅ | ✅ | Slow | Highest quality matching |
| **SURF** | ✅ | ✅ | Medium | Good quality (non-free) |
| **ORB** | ✅ | ✅ | **Fast** | Real-time, mobile |
| **AKAZE** | ✅ | ✅ | Medium | Non-linear diffusion |
| **BRISK** | ✅ | ✅ | Fast | Binary descriptor matching |
| **KAZE** | ✅ | ✅ | Slow | Non-linear (best edges) |
| **FAST** | ❌ | ❌ | **Fastest** | Corner detection only |

---

## Feature Matching

### Brute-Force Matcher

```python
# SIFT/SURF (float descriptors)
bf = cv2.BFMatcher(cv2.NORM_L2, crossCheck=True)
matches = bf.match(desc1, desc2)
matches = sorted(matches, key=lambda x: x.distance)

# ORB/BRISK (binary descriptors)
bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
matches = bf.match(desc1, desc2)

# Ratio test (Lowe's) — filters bad matches
bf = cv2.BFMatcher(cv2.NORM_L2)
knn_matches = bf.knnMatch(desc1, desc2, k=2)
good = []
for m, n in knn_matches:
    if m.distance < 0.75 * n.distance:  # Lowe's ratio
        good.append(m)
```

### FLANN — Fast Approximate (large datasets)

```python
# For SIFT
FLANN_INDEX_KDTREE = 1
index_params = dict(algorithm=FLANN_INDEX_KDTREE, trees=5)
search_params = dict(checks=50)

# For ORB
FLANN_INDEX_LSH = 6
index_params = dict(
    algorithm=FLANN_INDEX_LSH,
    table_number=12, key_size=20, multi_probe_level=2
)

flann = cv2.FlannBasedMatcher(index_params, search_params)
matches = flann.knnMatch(desc1, desc2, k=2)
```

### Homography — Find Transformation Between Images

```python
# Find homography from good matches
if len(good) >= 4:
    src_pts = np.float32([kp1[m.queryIdx].pt for m in good]).reshape(-1, 1, 2)
    dst_pts = np.float32([kp2[m.trainIdx].pt for m in good]).reshape(-1, 1, 2)
    
    H, mask = cv2.findHomography(src_pts, dst_pts, cv2.RANSAC, 5.0)
    inliers = mask.sum()
    
    # Warp one image onto another
    h, w = img2.shape[:2]
    warped = cv2.warpPerspective(img1, H, (w * 2, h))
    warped[0:h, 0:w] = img2  # Overlay
```

---

## Camera Calibration

### Chessboard Calibration

```python
# Prepare object points
pattern_size = (9, 6)  # Interior corners
objp = np.zeros((np.prod(pattern_size), 3), np.float32)
objp[:, :2] = np.mgrid[0:pattern_size[0], 0:pattern_size[1]].T.reshape(-1, 2)

obj_points = []  # 3D points in real world
img_points = []  # 2D points in image plane

for fname in calibration_images:
    img = cv2.imread(fname)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    ret, corners = cv2.findChessboardCorners(gray, pattern_size, None)
    if ret:
        obj_points.append(objp)
        corners_sub = cv2.cornerSubPix(
            gray, corners, (11, 11), (-1, -1),
            (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 30, 0.001)
        )
        img_points.append(corners_sub)
        cv2.drawChessboardCorners(img, pattern_size, corners_sub, ret)

# Calibrate
ret, camera_matrix, dist_coeffs, rvecs, tvecs = cv2.calibrateCamera(
    obj_points, img_points, gray.shape[::-1], None, None
)
```

### Undistort Images

```python
# Method 1: Direct
undistorted = cv2.undistort(img, camera_matrix, dist_coeffs)

# Method 2: Pre-compute maps (faster for video)
map1, map2 = cv2.initUndistortRectifyMap(
    camera_matrix, dist_coeffs, None, None, (w, h), cv2.CV_32FC1
)
undistorted = cv2.remap(img, map1, map2, cv2.INTER_LINEAR)
```

### Stereo Calibration

```python
# After calibrating both cameras individually:
stereo = cv2.stereoCalibrate(
    obj_points, img_points_left, img_points_right,
    camera_matrix_L, dist_coeffs_L,
    camera_matrix_R, dist_coeffs_R,
    gray.shape[::-1],
    criteria=(cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 100, 1e-5),
    flags=cv2.CALIB_FIX_INTRINSIC
)
ret, K1, d1, K2, d2, R, T, E, F = stereo

# Rectify
R1, R2, P1, P2, Q = cv2.stereoRectify(K1, d1, K2, d2, (w, h), R, T)
map1L, map2L = cv2.initUndistortRectifyMap(K1, d1, R1, P1, (w, h), cv2.CV_32FC1)
map1R, map2R = cv2.initUndistortRectifyMap(K2, d2, R2, P2, (w, h), cv2.CV_32FC1)
```

---

## Object Detection

### Haar Cascade — Face / Eye / Smile Detection

```python
# Load cascade (built-in or custom trained)
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
eye_cascade  = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_eye.xml')

faces = face_cascade.detectMultiScale(
    gray, scaleFactor=1.1, minNeighbors=5,
    minSize=(30, 30), flags=cv2.CASCADE_SCALE_IMAGE
)

for (x, y, w, h) in faces:
    cv2.rectangle(img, (x, y), (x+w, y+h), (255, 0, 0), 2)
    roi_gray = gray[y:y+h, x:x+w]
    eyes = eye_cascade.detectMultiScale(roi_gray)
    for (ex, ey, ew, eh) in eyes:
        cv2.rectangle(img, (x+ex, y+ey), (x+ex+ew, y+ey+eh), (0, 255, 0), 2)

# Available cascades:
# haarcascade_frontalface_{default,alt,alt2,alt_tree}.xml
# haarcascade_eye{,_tree_eyeglasses}.xml
# haarcascade_smile.xml
# haarcascade_{upper,lower}_body.xml
# haarcascade_fullbody.xml
# haarcascade_profileface.xml
# haarcascade_russian_plate_number.xml
# haarcascade_license_plate.xml
# haarcascade_stop_sign.xml
```

### HOG + SVM — Pedestrian Detection

```python
hog = cv2.HOGDescriptor()
hog.setSVMDetector(cv2.HOGDescriptor_getDefaultPeopleDetector())

boxes, weights = hog.detectMultiScale(
    gray, winStride=(4, 4), padding=(8, 8), scale=1.05
)

for (x, y, w, h) in boxes:
    cv2.rectangle(img, (x, y), (x+w, y+h), (0, 255, 0), 2)
```

### QR Code Detection

```python
detector = cv2.QRCodeDetector()
data, points, straight_qrcode = detector.detectAndDecode(img)

if data:
    print(f"QR Data: {data}")
    points = points.astype(int)
    cv2.polylines(img, [points], True, (0, 255, 0), 2)

# With correction (handles damaged QR codes)
data = detector.detectAndDecodeCurved(img)
```

### ArUco Markers

```python
dictionary = cv2.aruco.getPredefinedDictionary(cv2.aruco.DICT_6X6_250)
parameters = cv2.aruco.DetectorParameters()
detector = cv2.aruco.ArucoDetector(dictionary, parameters)

marker_corners, marker_ids, rejected = detector.detectMarkers(gray)

if marker_ids is not None:
    cv2.aruco.drawDetectedMarkers(img, marker_corners, marker_ids)
    
    # Estimate pose (requires calibrated camera)
    rvecs, tvecs, _ = cv2.aruco.estimatePoseSingleMarkers(
        marker_corners, 0.05, camera_matrix, dist_coeffs
    )
    for i in range(len(marker_ids)):
        cv2.drawFrameAxes(img, camera_matrix, dist_coeffs, rvecs[i], tvecs[i], 0.03)
```

---

## Object Tracking

### Optical Flow — Sparse (KLT)

```python
# Parameters
lk_params = dict(winSize=(15, 15), maxLevel=2,
                 criteria=(cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_MAX_ITER, 10, 0.03))

# Detect initial features
p0 = cv2.goodFeaturesToTrack(gray_prev, maxCorners=100,
                             qualityLevel=0.3, minDistance=7)

# Track
p1, st, err = cv2.calcOpticalFlowPyrLK(gray_prev, gray_next, p0, None, **lk_params)

# Filter good points
good_new = p1[st == 1]
good_old = p0[st == 1]

# Draw tracks
for new, old in zip(good_new, good_old):
    a, b = new.ravel()
    c, d = old.ravel()
    cv2.line(img, (int(a), int(b)), (int(c), int(d)), (0, 255, 0), 2)
```

### Optical Flow — Dense (Farneback)

```python
flow = cv2.calcOpticalFlowFarneback(
    gray_prev, gray_next, None, 0.5, 3, 15, 3, 5, 1.2, 0
)
mag, ang = cv2.cartToPolar(flow[..., 0], flow[..., 1])

# Visualize as HSV
hsv = np.zeros((h, w, 3), dtype=np.uint8)
hsv[..., 0] = ang * 180 / np.pi / 2
hsv[..., 1] = 255
hsv[..., 2] = cv2.normalize(mag, None, 0, 255, cv2.NORM_MINMAX)
flow_rgb = cv2.cvtColor(hsv, cv2.COLOR_HSV2BGR)
```

### MeanShift / CamShift

```python
# Setup ROI histogram (from selection)
x, y, w, h = cv2.selectROI("Select Object", img, False)
roi = hsv[y:y+h, x:x+w]
roi_hist = cv2.calcHist([roi], [0], None, [180], [0, 180])
cv2.normalize(roi_hist, roi_hist, 0, 255, cv2.NORM_MINMAX)
term_crit = (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 10, 1)

while True:
    back_proj = cv2.calcBackProject([hsv_frame], [0], roi_hist, [0, 180], 1)
    ret, track_window = cv2.CamShift(back_proj, track_window, term_crit)
    pts = cv2.boxPoints(ret)
    pts = np.int0(pts)
    cv2.polylines(frame, [pts], True, (0, 255, 0), 2)
```

### Modern Trackers (contrib)

```python
# Available trackers: CSRT (best), KCF (fast), MIL, BOOSTING, MEDIANFLOW, MOSSE, TLD
tracker = cv2.TrackerCSRT_create()       # Best accuracy
# tracker = cv2.TrackerKCF_create()      # Best speed/accuracy balance
# tracker = cv2.TrackerMIL_create()      # Good with partial occlusion

# Initialize
bbox = cv2.selectROI("Select", frame, False)
tracker.init(frame, bbox)

# Update each frame
success, bbox = tracker.update(frame)
if success:
    (x, y, w, h) = [int(v) for v in bbox]
    cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 0), 2)
```

---

## Face Recognition (face module)

```python
# Create recognizer
recognizer = cv2.face.LBPHFaceRecognizer_create()
# Also: EigenFaceRecognizer, FisherFaceRecognizer (require contrib)

# Train
recognizer.train(faces, labels)

# Predict
label, confidence = recognizer.predict(face_region)
# Lower confidence = better match (LBPH: <50 = good, <80 = acceptable)
```

---

## Image Stitching

```python
# Automatic panorama stitching
stitcher = cv2.Stitcher.create(cv2.Stitcher_PANORAMA)  # or SCANS for docs
status, panorama = stitcher.stitch([img1, img2, img3])

if status == cv2.Stitcher_OK:
    cv2.imwrite('panorama.jpg', panorama)
else:
    print(f"Stitching failed with code {status}")
    # Error codes: ERR_NEED_MORE_IMGS, ERR_HOMOGRAPHY_EST_FAIL,
    #              ERR_CAMERA_PARAMS_ADJUST_FAIL
```

---

## Quick One-Liners

```bash
# Face detection with Haar cascade
python3 -c "
import cv2; i=cv2.imread('in.jpg'); g=cv2.cvtColor(i,cv2.COLOR_BGR2GRAY)
f=cv2.CascadeClassifier(cv2.data.haarcascades+'haarcascade_frontalface_default.xml').detectMultiScale(g,1.1,5)
for (x,y,w,h) in f: cv2.rectangle(i,(x,y),(x+w,y+h),(255,0,0),2)
cv2.imwrite('out.jpg',i)
"

# SIFT feature match between two images
python3 -c "
import cv2, numpy as np
i1=cv2.imread('a.jpg',0); i2=cv2.imread('b.jpg',0)
s=cv2.SIFT_create(); k1,d1=s.detectAndCompute(i1,None); k2,d2=s.detectAndCompute(i2,None)
m=cv2.BFMatcher().knnMatch(d1,d2,k=2)
g=[x[0] for x in m if len(x)==2 and x[0].distance<0.75*x[1].distance]
cv2.imwrite('matches.jpg',cv2.drawMatches(i1,k1,i2,k2,g,None,flags=cv2.DrawMatchesFlags_NOT_DRAW_SINGLE_POINTS))
"

# QR decode
python3 -c "import cv2; print(cv2.QRCodeDetector().detectAndDecode(cv2.imread('qrcode.png'))[0])"
```
