# Build Assets Guide

This directory should contain icon files for building the Electron app.

## Required Icon Files

### macOS
- `icon.icns` - macOS icon (512x512 or larger)
  - Required for `.dmg` installer
  - Format: Apple Icon Image format

### Windows
- `icon.ico` - Windows icon (256x256 or larger)
  - Required for `.exe` installer
  - Format: ICO format

### Linux
- `icon.png` - Linux icon (512x512 or larger)
  - Format: PNG format

## Creating Icon Files

### Option 1: Using Online Tools
1. Go to [favicon-generator.org](https://www.favicon-generator.org/) or [convertio.co](https://convertio.co/)
2. Upload a high-quality image (1024x1024 or larger)
3. Generate icons for each platform
4. Rename and place them in this directory

### Option 2: Using CLI Tools

#### On macOS with Homebrew:
```bash
# Install iconutil
brew install imagemagick

# Convert PNG to ICNS
sips -s format icns icon.png -o icon.icns

# Or use a Python script
python3 icon_converter.py
```

#### Windows with ImageMagick:
```bash
# Install ImageMagick
choco install imagemagick

# Convert PNG to ICO
convert icon.png -define icon:auto-resize=256,128,96,64,48,32,16 icon.ico
```

### Option 3: Using Online Icon Converter
1. Create a high-quality PNG image (512x512 or 1024x1024)
2. Use [icoconvert.com](https://icoconvert.com/)
3. Download the `.ico` file
4. Place it in this directory

## Icon Specifications

### macOS (icon.icns)
- Minimum: 512x512 pixels
- Recommended: 1024x1024 pixels
- Format: ICNS (Apple Icon Image)
- Colors: RGB or RGBA

### Windows (icon.ico)
- Minimum: 256x256 pixels
- Recommended: 256x256 pixels
- Format: ICO (Windows Icon)
- Colors: RGB or RGBA

### Linux (icon.png)
- Minimum: 512x512 pixels
- Recommended: 512x512 pixels
- Format: PNG
- Colors: RGBA (with transparency)

## Quick Setup

If you don't have custom icons, you can use placeholder icons:

Generate a simple icon:
```bash
# Using ImageMagick (assuming you have it installed)
convert -size 512x512 xc:blue -fill white -gravity center -pointsize 60 \
  -annotate +0+0 "Bachat Bazaar" icon.png
```

Then convert to other formats as needed.

## Notes

- Ensure icons are square and non-transparent backgrounds for consistency
- High-quality icons (1024x1024+) will downscale better than low-quality upscaling
- Test icons in the built application to ensure proper rendering
