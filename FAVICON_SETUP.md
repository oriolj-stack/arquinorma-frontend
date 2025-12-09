# Favicon Setup for Bookmarks/Quick Access Bar

## Issue
The favicon appears correctly in browser tabs but shows the Vite icon in bookmarks/quick access bar.

## Solution
Some browsers prefer a traditional `favicon.ico` file for bookmarks. We need to create one from the SVG.

## Steps to Create favicon.ico

### Option 1: Online Converter (Easiest)
1. Go to https://convertio.co/svg-ico/ or https://www.icoconverter.com/
2. Upload `public/favicon.svg`
3. Download the generated `favicon.ico`
4. Place it in `public/favicon.ico`
5. Commit and push

### Option 2: Using ImageMagick (Command Line)
```bash
# Install ImageMagick first, then:
magick convert public/favicon.svg -resize 32x32 public/favicon.ico
```

### Option 3: Using Node.js Package
```bash
npm install --save-dev to-ico
# Then create a script to convert
```

## Current Status
- ✅ SVG favicon is set up correctly
- ✅ HTML has proper favicon links
- ✅ Web manifest is configured
- ⏳ Need to add `favicon.ico` file for bookmark compatibility

## After Adding favicon.ico
1. The HTML already references `/favicon.ico?v=4`
2. Just add the file to `public/favicon.ico`
3. Commit and push
4. Clear browser cache or use incognito mode to test

