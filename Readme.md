# Thumbnail Generator API

A Node.js API for generating image and video thumbnails using Sharp and FFmpeg. Handles file uploads, processes media files, and generates optimized thumbnails with automatic cleanup.

## Features

- **Image Thumbnails**  
  Generate small (150px), medium (300px), and large (600px) JPEG thumbnails with:
  - Smart cropping based on attention area
  - Image quality optimization (MozJPEG)
  - Color enhancements (saturation + brightness)

- **Video Thumbnails**  
  Extract frames from videos (MP4/MKV/AVI) and:
  - Generate 320x180 processed thumbnails
  - Apply sharpening and color corrections
  - Automatic temporary file cleanup

- **Core Technologies**  
  - 🖼️ Sharp for image processing
  - 🎥 FFmpeg for video frame extraction
  - 📁 Multer for file upload handling
  - ♻️ Retry-based file cleanup system

## Installation

1. **Clone Repository**
```bash
git clone https://github.com/5Asim/ThumbnailGenerator
cd ThumbnailGenerator
```

2. **Install Dependencies**
```bash
npm install express multer sharp fluent-ffmpeg uuid
```

3. **Install FFmpeg**  
   [Download FFmpeg](https://ffmpeg.org/download.html) and either:
   - Add to system PATH, **OR**
   - Update path in code (see `ffmpegPath` in `server.js`)

## Usage

1. **Start Server**
```bash
node server.js
```

2. **Upload Image**  
```bash
curl -X POST -F "image=@your-image.jpg" http://localhost:3000/upload/image
```

**Response:**
```json
{
  "original": "http://localhost:3000/uploads/123456789.jpg",
  "thumbnails": {
    "small": "http://localhost:3000/uploads/thumb_small_123456789.jpg",
    "medium": "http://localhost:3000/uploads/thumb_medium_123456789.jpg",
    "large": "http://localhost:3000/uploads/thumb_large_123456789.jpg"
  }
}
```

3. **Upload Video**  
```bash
curl -X POST -F "video=@your-video.mp4" http://localhost:3000/upload/video
```

**Response:**
```json
{
  "video": "http://localhost:3000/uploads/123456789.mp4",
  "thumbnail": "http://localhost:3000/uploads/processed_thumb_550e8400.jpg"
}
```

## Configuration

| Setting | Location | Description |
|---------|----------|-------------|
| Upload Directory | `storage.destination` | Change via Multer config |
| Allowed Video Types | `allowedTypes` array | Modify in fileFilter |
| Thumbnail Sizes | `sizes` object | Adjust width values |
| FFmpeg Path | `ffmpegPath` variable | Set to your FFmpeg binary location |

## Troubleshooting

**FFmpeg Errors**  
```bash
# Verify FFmpeg installation
ffmpeg -version
```

**File Permission Issues**  
```bash
# On Linux/Mac
chmod -R 755 uploads
```

**Common Fixes**  
1. Ensure `uploads` directory exists and is writable
2. Check FFmpeg path matches your system setup
3. Verify uploaded files < 25MB (Multer default)
4. Review console logs for processing errors

**Optimized for**  
✅ Content management systems  
✅ Media-heavy applications  
✅ Automated thumbnail pipelines  
