---
name: "image-gen-gemini"
description: "Generate images using Gemini CLI (gemini-cli). Use when the user wants to create images via the command line using Google's Gemini AI. Triggers on requests like: 'generate image with gemini', 'create image using Gemini CLI', 'gemini image generation', 'AI image gen', 'text to image with Gemini'"
---

# Image Generation using Gemini CLI

Generate images using the Gemini CLI tool from Google.

## Prerequisites

1. **Install Gemini CLI**:
   ```bash
   npm install -g @google/gemini-cli
   ```

2. **Authenticate**:
   ```bash
   gemini auth
   ```

3. **Verify installation**:
   ```bash
   gemini --version
   ```

## Image Generation Command

### Basic Usage

```bash
gemini generate-image "YOUR PROMPT HERE"
```

### With Options

```bash
# Specify output file
gemini generate-image "a beautiful sunset over mountains" -o output.png

# Specify model (default is gemini-2.0-flash-exp)
gemini generate-image "YOUR PROMPT" --model gemini-2.0-pro

# Specify size/aspect ratio
gemini generate-image "YOUR PROMPT" --size 1024x1024

# Number of images to generate
gemini generate-image "YOUR PROMPT" --count 4
```

## Common Workflows

### Single Image Generation

```bash
# Generate and save to specific path
gemini generate-image "a futuristic city with flying cars and neon lights" -o ~/Downloads/city.png

# Generate square image
gemini generate-image "a serene japanese garden with cherry blossoms" --size 1024x1024 -o garden.png

# Generate wide image (16:9)
gemini generate-image "landscape photography of northern lights" --size 1792x1024 -o aurora.png
```

### Batch Generation

```bash
# Generate multiple variations
gemini generate-image "a cozy coffee shop interior" --count 4 -o coffee_

# This creates: coffee_1.png, coffee_2.png, coffee_3.png, coffee_4.png
```

### Using with File Input

```bash
# Generate from a prompt file
cat prompt.txt | xargs -I {} gemini generate-image "{}" -o output.png
```

## Output

- Images are saved to the specified path with `-o` flag
- If no output specified, images are saved to current directory with generated filename
- Supported formats: PNG, JPEG, WebP

## Tips

1. **Be specific with prompts**: More detail = better results
   - Good: "a golden retriever puppy playing in autumn leaves, soft lighting, photorealistic"
   - Bad: "a dog"

2. **Use style modifiers**: "photorealistic", "oil painting", "anime style", "3D render"

3. **Check available models**: `gemini models list` to see available options

4. **Monitor usage**: Gemini CLI has rate limits; use `--count` sparingly

## Troubleshooting

- **Auth error**: Run `gemini auth` again
- **Rate limit**: Wait and retry, or use `--count 1`
- **Invalid prompt**: Ensure quotes around complex prompts
- **Output path issues**: Ensure directory exists and has write permissions
