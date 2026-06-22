---
name: opencv-dnn
version: "1.0.0"
description: "OpenCV Deep Neural Network module (dnn) — deploy and run pre-trained deep learning models for inference. Supports ONNX, TensorFlow, PyTorch, Caffe, DarkNet, TFLite, OpenVINO, and TorchScript formats. Includes: model loading (readNet, readNetFromONNX, readNetFromTensorFlow), inference (forward), blob creation (blobFromImage), class label mapping, single-shot detectors (SSD, YOLO, EfficientDet, RetinaNet), face detection, pose estimation, human segmentation, super-resolution, background removal, model optimization (CUDA, OpenVINO), and model benchmarking. Use when the user asks to: run a neural network with OpenCV, load an ONNX model for inference, do object detection with YOLO/SSD, run face detection with DNN, extract keypoints/pose estimation, perform image classification, run semantic segmentation, convert or optimize models for OpenCV, use GPU acceleration for DNN inference."
argument-hint: 'opencv-dnn run YOLO model | opencv-dnn load ONNX model | opencv-dnn detect objects | opencv-dnn face detection DNN | opencv-dnn classify image'
allowed-tools: Bash, Read, Write, WebFetch, Grep
user-invocable: true
metadata:
  openclaw:
    emoji: "🧠"
    tags: [opencv, dnn, deep-learning, onnx, yolo, tensorflow, pytorch, caffe, inference, object-detection, image-classification, segmentation, face-detection, pose-estimation, cuda, openvino]
    docs: https://docs.opencv.org/4.x/d6/d0f/group__dnn.html
    license: Apache-2.0
---

# 🧠 OpenCV DNN — Deep Neural Network Module

Deploy pre-trained models for inference. **No training** — this is a **deployment runtime**.

---

## Quick Start — Image Classification

```python
import cv2
import numpy as np

# Load model
net = cv2.dnn.readNetFromONNX('model.onnx')  # ONNX format (preferred)

# Create blob from image
blob = cv2.dnn.blobFromImage(
    image=img, scalefactor=1.0/255.0,       # Normalize pixels to [0,1]
    size=(224, 224),                        # Model input size
    mean=(0.485, 0.456, 0.406),             # ImageNet mean (if used)
    swapRB=True,                            # BGR→RGB
    crop=False                              # Center crop
)
# blob shape: (1, 3, 224, 224)  — batch, channels, height, width

# Inference
net.setInput(blob)
outputs = net.forward()

# Get class (for ImageNet models)
class_id = np.argmax(outputs[0])
confidence = outputs[0][class_id]
```

---

## Supported Formats & Loading

| Framework | Function | File Extensions |
|-----------|----------|-----------------|
| **ONNX** (preferred) | `readNetFromONNX()` | `.onnx` |
| **TensorFlow** | `readNetFromTensorFlow()` | `.pb` + `.pbtxt` |
| **PyTorch** | `readNetFromONNX()` | Convert to ONNX first |
| **Caffe** | `readNetFromCaffe()` | `.prototxt` + `.caffemodel` |
| **DarkNet** | `readNetFromDarknet()` | `.cfg` + `.weights` |
| **TFLite** | `readNetFromTFLite()` | `.tflite` |
| **TorchScript** | `readNetFromTorch()` | `.pt` |
| **OpenVINO** | `readNetFromModelOptimizer()` | `.xml` + `.bin` |

```python
# Generic loader (auto-detects format)
net = cv2.dnn.readNet(model_path, config_path)

# Examples:
net = cv2.dnn.readNetFromONNX('yolov8n.onnx')
net = cv2.dnn.readNetFromCaffe('deploy.prototxt', 'resnet.caffemodel')
net = cv2.dnn.readNetFromDarknet('yolov4.cfg', 'yolov4.weights')
net = cv2.dnn.readNetFromTensorFlow('frozen_inference_graph.pb')
```

---

## Object Detection — YOLO

```python
# Load YOLOv8 ONNX model
net = cv2.dnn.readNetFromONNX('yolov8n.onnx')
net.setPreferableBackend(cv2.dnn.DNN_BACKEND_OPENCV)

# Create blob
blob = cv2.dnn.blobFromImage(img, 1/255.0, (640, 640), swapRB=True, crop=False)
net.setInput(blob)
outputs = net.forward()  # Shape: (1, 84, 8400) for YOLOv8

# Parse outputs
rows = outputs.shape[1] if outputs.shape[0] == 1 else outputs.shape[0]
for i in range(rows):
    row = outputs[0][i] if outputs.shape[0] == 1 else outputs[i]
    scores = row[4:]
    class_id = np.argmax(scores)
    confidence = scores[class_id]
    
    if confidence > 0.5:
        cx, cy, w, h = row[:4] * 640  # Scale to input size
        x1, y1 = int(cx - w/2), int(cy - h/2)
        x2, y2 = int(cx + w/2), int(cy + h/2)
        cv2.rectangle(img, (x1, y1), (x2, y2), (0, 255, 0), 2)
```

---

## Object Detection — SSD (Single Shot Detector)

```python
# MobileNet-SSD (fast, good for mobile/edge)
net = cv2.dnn.readNetFromCaffe('MobileNetSSD_deploy.prototxt', 'MobileNetSSD_deploy.caffemodel')

blob = cv2.dnn.blobFromImage(img, 0.007843, (300, 300), 127.5)
net.setInput(blob)
detections = net.forward()  # Shape: (1, 1, N, 7)

for i in range(detections.shape[2]):
    confidence = detections[0, 0, i, 2]
    if confidence > 0.5:
        class_id = int(detections[0, 0, i, 1])
        x1 = int(detections[0, 0, i, 3] * w)
        y1 = int(detections[0, 0, i, 4] * h)
        x2 = int(detections[0, 0, i, 5] * w)
        y2 = int(detections[0, 0, i, 6] * h)
        cv2.rectangle(img, (x1, y1), (x2, y2), (0, 255, 0), 2)
```

---

## Face Detection — DNN (OpenCV Face Detector)

```python
# OpenCV's DNN-based face detector (more accurate than Haar cascades)
net = cv2.dnn.readNetFromCaffe(
    'deploy.prototxt',
    'opencv_face_detector.caffemodel'
)

blob = cv2.dnn.blobFromImage(img, 1.0, (300, 300), (104, 177, 123))
net.setInput(blob)
detections = net.forward()

for i in range(detections.shape[2]):
    confidence = detections[0, 0, i, 2]
    if confidence > 0.7:
        box = detections[0, 0, i, 3:7] * np.array([w, h, w, h])
        x1, y1, x2, y2 = box.astype(int)
        cv2.rectangle(img, (x1, y1), (x2, y2), (0, 255, 0), 2)
```

---

## Human Pose Estimation

```python
# COCO keypoint mapping: 0=nose, 1=l_eye, 2=r_eye, 3=l_ear, 4=r_ear,
# 5=l_shoulder, 6=r_shoulder, 7=l_elbow, 8=r_elbow, 9=l_wrist, 10=r_wrist,
# 11=l_hip, 12=r_hip, 13=l_knee, 14=r_knee, 15=l_ankle, 16=r_ankle

net = cv2.dnn.readNetFromTensorFlow('pose_model.pb')
blob = cv2.dnn.blobFromImage(img, 1.0, (368, 368), (127.5, 127.5, 127.5), swapRB=True, crop=False)
net.setInput(blob)
output = net.forward()  # Shape: (1, 57, 46, 46) — 19 keypoints x 3 (heatmap, offsets)

# Parse each keypoint's heatmap
n_points = 19
H, W = img.shape[:2]
keypoints = []

for i in range(n_points):
    heatmap = output[0, i, :, :]
    _, conf, _, point = cv2.minMaxLoc(heatmap)
    if conf > 0.1:
        x = int(point[0] * W / heatmap.shape[1])
        y = int(point[1] * H / heatmap.shape[0])
        keypoints.append((x, y, conf))
        cv2.circle(img, (x, y), 4, (0, 0, 255), -1)
```

---

## Semantic Segmentation

```python
net = cv2.dnn.readNetFromONNX('deeplabv3.onnx')
blob = cv2.dnn.blobFromImage(img, 1/127.5, (513, 513), (127.5, 127.5, 127.5), swapRB=True)
net.setInput(blob)
output = net.forward()[0]  # Shape: (21, 513, 513) for PASCAL classes

# Get class per pixel
class_map = np.argmax(output, axis=0).astype(np.uint8)

# Overlay mask
mask_colored = np.zeros((513, 513, 3), dtype=np.uint8)
for class_id, color in class_colors.items():
    mask_colored[class_map == class_id] = color

# Resize to original size
mask_colored = cv2.resize(mask_colored, (w, h), interpolation=cv2.INTER_NEAREST)
overlay = cv2.addWeighted(img, 0.6, mask_colored, 0.4, 0)
```

---

## Model Optimization

### Backend Selection

```python
# CPU (default)
net.setPreferableBackend(cv2.dnn.DNN_BACKEND_OPENCV)

# Intel OpenVINO (great for Intel CPUs/VPUs)
net.setPreferableBackend(cv2.dnn.DNN_BACKEND_INFERENCE_ENGINE)

# NVIDIA CUDA (requires cuDNN)
net.setPreferableBackend(cv2.dnn.DNN_BACKEND_CUDA)
net.setPreferableTarget(cv2.dnn.DNN_TARGET_CUDA)
# or DNN_TARGET_CUDA_FP16 for Tensor Core speedup

# ARM Compute Library
net.setPreferableBackend(cv2.dnn.DNN_BACKEND_OPENCV)
net.setPreferableTarget(cv2.dnn.DNN_TARGET_CPU)

# Target options:
# DNN_TARGET_CPU, DNN_TARGET_OPENCL, DNN_TARGET_OPENCL_FP16,
# DNN_TARGET_MYRIAD, DNN_TARGET_VULKAN, DNN_TARGET_FPGA
```

### Half-Precision (FP16) — ~2x throughput

```bash
# Enable if supported: requires CUDA + Tensor Cores
python3 -c "
import cv2; net = cv2.dnn.readNetFromONNX('model.onnx')
net.setPreferableBackend(cv2.dnn.DNN_BACKEND_CUDA)
net.setPreferableTarget(cv2.dnn.DNN_TARGET_CUDA_FP16)
print('FP16 enabled')
"
```

---

## Model Conversion to ONNX

```python
# PyTorch → ONNX
import torch
model = torch.load('model.pth', map_location='cpu')
model.eval()
dummy = torch.randn(1, 3, 224, 224)
torch.onnx.export(model, dummy, 'model.onnx',
                  input_names=['input'], output_names=['output'],
                  dynamic_axes={'input': {0: 'batch'}, 'output': {0: 'batch'}})

# TensorFlow → ONNX (using tf2onnx)
# pip install tf2onnx
# python -m tf2onnx.convert --saved-model ./saved_model --output model.onnx
```

---

## Benchmarking

```python
# Measure FPS
net = cv2.dnn.readNetFromONNX('model.onnx')
if cv2.cuda.getCudaEnabledDeviceCount():
    net.setPreferableBackend(cv2.dnn.DNN_BACKEND_CUDA)
    net.setPreferableTarget(cv2.dnn.DNN_TARGET_CUDA)

# Warmup
for _ in range(10):
    net.setInput(blob)
    net.forward()

# Benchmark
start = cv2.getTickCount()
FPS = 0
for i in range(100):
    net.setInput(blob)
    net.forward()

total_time = (cv2.getTickCount() - start) / cv2.getTickFrequency()
fps = 100 / total_time
print(f"FPS: {fps:.1f}, Latency: {total_time/100*1000:.1f} ms")
```

---

## Quick One-Liners

```bash
# Classify with ONNX model
python3 -c "
import cv2, numpy as np
net=cv2.dnn.readNetFromONNX('model.onnx')
blob=cv2.dnn.blobFromImage(cv2.imread('image.jpg'),1/255.0,(224,224),swapRB=True)
net.setInput(blob); out=net.forward()
print(f'Class: {np.argmax(out[0])}, Conf: {out[0][np.argmax(out[0])]:.3f}')
"
```
