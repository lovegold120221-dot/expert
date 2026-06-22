---
name: opencv-ml
version: "1.0.0"
description: "OpenCV Machine Learning module (ml) — classic ML algorithms for computer vision: SVM (support vector machines), K-Nearest Neighbors (KNN), Decision Trees, Random Forests, Boost (AdaBoost), Logistic Regression, Neural Networks (ANN_MLP), Expectation-Maximization (EM), Normal Bayes Classifier, and K-Means clustering. Use when the user asks to: train an SVM classifier for image recognition, use KNN for digit recognition, train a random forest for object classification, cluster image features with K-Means, train a neural network for computer vision with OpenCV's ML module, do data normalization/standardization for vision features, use PCA for dimensionality reduction on image data, train a boosted classifier, evaluate ML models with cross-validation."
argument-hint: 'opencv-ml train SVM classifier | opencv-ml KNN digit recognition | opencv-ml K-Means clustering | opencv-ml random forest | opencv-ml PCA dimensionality reduction'
allowed-tools: Bash, Read, Write, WebFetch, Grep
user-invocable: true
metadata:
  openclaw:
    emoji: "🤖"
    tags: [opencv, machine-learning, ml, svm, knn, random-forest, decision-tree, boosting, ann, kmeans, pca, logistic-regression, classification, clustering]
    docs: https://docs.opencv.org/4.x/dd/ded/group__ml.html
    license: Apache-2.0
---

# 🤖 OpenCV ML — Classic Machine Learning

The `ml` module provides **classic ML algorithms** optimized for vision tasks.

---

## Data Preparation

OpenCV ML requires data as `cv2.Mat` — float32, samples in rows, features in columns.

```python
import cv2
import numpy as np

# Training data: N samples x M features
samples = np.array([
    [0.5, 0.2, 0.1],   # Sample 1 — 3 features
    [0.8, 0.3, 0.4],   # Sample 2
    [0.1, 0.9, 0.7],   # Sample 3
], dtype=np.float32)

# Labels: N x 1 (int32)
labels = np.array([[0], [0], [1]], dtype=np.int32)

# Normalize data (critical for SVM, KNN, etc.)
mean, std = cv2.meanStdDev(samples)
samples_norm = (samples - mean.reshape(1, -1)) / (std.reshape(1, -1) + 1e-10)
```

### From Images to Feature Vectors

```python
def extract_hog_features(images):
    """Convert images to HOG feature vectors for ML training"""
    hog = cv2.HOGDescriptor((64, 128), (16, 16), (8, 8), (8, 8), 9)
    features = []
    for img in images:
        resized = cv2.resize(img, (64, 128))
        feat = hog.compute(resized).flatten()
        features.append(feat)
    return np.array(features, dtype=np.float32)

def flatten_images(images):
    """Simple pixel flattening (for small images like MNIST)"""
    return np.array([img.flatten() for img in images], dtype=np.float32)
```

---

## SVM — Support Vector Machine

Best for binary/small multi-class classification with HOG features.

### Training

```python
# Create SVM
svm = cv2.ml.SVM_create()
svm.setType(cv2.ml.SVM_C_SVC)
svm.setKernel(cv2.ml.SVM_RBF)         # RBF kernel (best general purpose)
svm.setGamma(0.5)                      # RBF kernel parameter
svm.setC(1.0)                          # Regularization
svm.setTermCriteria((cv2.TERM_CRITERIA_MAX_ITER + cv2.TERM_CRITERIA_EPS, 1000, 1e-6))

# Train
svm.train(samples_norm, cv2.ml.ROW_SAMPLE, labels)

# Save / Load
svm.save('svm_model.xml')
svm = cv2.ml.SVM_load('svm_model.xml')

# Predict
_, results = svm.predict(test_samples)
_, results_raw = svm.predict(test_samples, flags=cv2.ml.STAT_MODEL_RAW_OUTPUT)

# Auto-train (grid search for best params)
svm = cv2.ml.SVM_create()
svm.trainAuto(samples_norm, cv2.ml.ROW_SAMPLE, labels)
# Automatically finds best C, gamma, kernel
```

### SVM for Digit Recognition (Flattened pixels)

```python
# Train on HOG features for better accuracy
hog = cv2.HOGDescriptor()
train_features = []
for img in train_images:
    train_features.append(hog.compute(cv2.resize(img, (64, 64))).flatten())

train_features = np.array(train_features, dtype=np.float32)
svm = cv2.ml.SVM_create()
svm.setKernel(cv2.ml.SVM_RBF)
svm.trainAuto(train_features, cv2.ml.ROW_SAMPLE, train_labels)
svm.save('digit_svm.xml')
```

---

## KNN — K-Nearest Neighbors

```python
# Create and train
knn = cv2.ml.KNearest_create()
knn.train(samples, cv2.ml.ROW_SAMPLE, labels)

# Predict
ret, results, neighbours, dist = knn.findNearest(test_sample, k=3)
# results = predicted label
# neighbours = k nearest labels
# dist = distances to neighbours

# Set default K
knn.setDefaultK(5)
knn.setIsClassifier(True)  # True=classification, False=regression
```

### KNN for Handwriting Recognition

```python
# MNIST-style digits
knn = cv2.ml.KNearest_create()
knn.train(train_data, cv2.ml.ROW_SAMPLE, train_labels)

# Predict a single digit
test_digit = cv2.resize(test_img, (28, 28)).reshape(1, 784).astype(np.float32)
ret, result, neighbours, dist = knn.findNearest(test_digit, k=5)
print(f"Predicted: {int(result[0,0])}")
```

---

## Random Forest (RTrees)

```python
rf = cv2.ml.RTrees_create()
rf.setMaxDepth(10)                     # Tree depth
rf.setMinSampleCount(10)               # Min samples per leaf
rf.setRegressionAccuracy(0)            # 0 = classification
rf.setActiveVarCount(0)                # 0 = sqrt(n_features)
rf.setTermCriteria((cv2.TERM_CRITERIA_MAX_ITER, 100, 1e-6))

rf.train(samples, cv2.ml.ROW_SAMPLE, labels)
rf.save('random_forest.xml')

_, predictions = rf.predict(test_samples)

# Feature importance
importance = rf.getVarImportance()
```

---

## Decision Tree (DTrees)

```python
dtree = cv2.ml.DTrees_create()
dtree.setMaxDepth(10)
dtree.setMinSampleCount(10)
dtree.setCVFolds(1)                    # 0 = no pruning, >0 = cross-validation pruning
dtree.setUseSurrogates(False)
dtree.setTruncatePrunedTree(True)

dtree.train(samples, cv2.ml.ROW_SAMPLE, labels)
```

---

## Boost (AdaBoost)

```python
boost = cv2.ml.Boost_create()
boost.setBoostType(cv2.ml.Boost_DISCRETE)  # DISCRETE, REAL, LOGIT, GENTLE
boost.setWeakCount(100)                    # Number of weak classifiers
boost.setWeightTrimRate(0.95)
boost.setMaxDepth(1)                       # Stumps (depth=1)

# Use with HOG features for pedestrian detection-style classifiers
boost.train(samples, cv2.ml.ROW_SAMPLE, labels)
```

---

## ANN_MLP — Artificial Neural Network

```python
# Create network
ann = cv2.ml.ANN_MLP_create()
ann.setLayerSizes(np.array([784, 128, 64, 10], dtype=np.int32))
ann.setActivationFunction(cv2.ml.ANN_MLP_SIGMOID_SYM, 0.1, 0.0)
# Activation options: SIGMOID_SYM (tanh), RELU, GAUSSIAN, IDENTITY

# Training params
ann.setTermCriteria((cv2.TERM_CRITERIA_MAX_ITER + cv2.TERM_CRITERIA_EPS, 1000, 1e-6))
ann.setTrainMethod(cv2.ml.ANN_MLP_BACKPROP)  # or RPROP (faster, recommended)
ann.setBackpropWeightScale(0.001)
ann.setBackpropMomentumScale(0.9)

# Train (requires one-hot encoded labels)
train_labels_onehot = np.zeros((len(labels), 10), dtype=np.float32)
for i, label in enumerate(labels):
    train_labels_onehot[i, label] = 1.0

ann.train(samples, cv2.ml.ROW_SAMPLE, train_labels_onehot)
ann.save('ann_model.xml')

# Predict
_, output = ann.predict(test_samples)
predictions = np.argmax(output, axis=1)
```

---

## EM — Expectation-Maximization

```python
em = cv2.ml.EM_create()
em.setClustersNumber(3)
em.setCovarianceMatrixType(cv2.ml.EM_COV_MAT_DIAGONAL)

# Train (unsupervised — no labels needed)
em.trainEM(samples)

# Predict cluster membership
_, log_likelihoods, _, probs = em.predict2(test_samples)
cluster = np.argmax(probs, axis=1)

# Get model parameters
means = em.getMeans()
covs = em.getCovs()  # List of covariance matrices
weights = em.getWeights()
```

---

## K-Means Clustering

```python
# Data: N x M
criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 100, 0.1)
compactness, labels, centers = cv2.kmeans(
    data=data, K=3, bestLabels=None,
    criteria=criteria, attempts=10,
    flags=cv2.KMEANS_PP_CENTERS  # or KMEANS_RANDOM_CENTERS
)

# Color quantization (compress image palette)
def quantize_colors(img, k=16):
    data = img.reshape(-1, 3).astype(np.float32)
    _, labels, centers = cv2.kmeans(data, k, None,
        (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 10, 1.0),
        10, cv2.KMEANS_PP_CENTERS)
    centers = np.uint8(centers)
    return centers[labels.flatten()].reshape(img.shape)
```

---

## PCA — Principal Component Analysis

```python
# Reduce dimensionality while preserving variance
mean = np.mean(data, axis=0)
data_centered = data - mean

# Compute PCA
pca = cv2.PCACompute2(data_centered, mean, maxComponents=50)
eigenvectors, eigenvalues = pca[0], pca[1]

# Project
reduced = cv2.PCAProject(data_centered, mean, eigenvectors)

# Reconstruct (approximate)
reconstructed = cv2.PCABackProject(reduced, mean, eigenvectors)

# Explained variance ratio
explained_ratio = eigenvalues / eigenvalues.sum()
cumulative = np.cumsum(explained_ratio)
n_components = np.argmax(cumulative >= 0.95) + 1  # 95% variance
```

---

## Model Evaluation

```python
def evaluate_model(model, test_samples, test_labels):
    _, predictions = model.predict(test_samples)
    predictions = predictions.ravel().astype(np.int32)
    test_labels = test_labels.ravel()
    
    accuracy = np.mean(predictions == test_labels) * 100
    
    # Confusion matrix
    n_classes = len(np.unique(test_labels))
    conf_matrix = np.zeros((n_classes, n_classes), dtype=np.int32)
    for t, p in zip(test_labels, predictions):
        conf_matrix[t, p] += 1
    
    return accuracy, conf_matrix

# Cross-validation helper
from sklearn.model_selection import StratifiedKFold

skf = StratifiedKFold(n_splits=5, shuffle=True)
accuracies = []
for train_idx, test_idx in skf.split(samples, labels):
    model = cv2.ml.SVM_create()
    model.train(samples[train_idx], cv2.ml.ROW_SAMPLE, labels[train_idx])
    acc, _ = evaluate_model(model, samples[test_idx], labels[test_idx])
    accuracies.append(acc)

print(f"CV Accuracy: {np.mean(accuracies):.1f}% ± {np.std(accuracies):.1f}%")
```
