const express = require('express');
const multer = require('multer');
const path = require('path');
const sharp = require('sharp');
const fs = require('fs').promises;
const { access } = require('fs').promises;
const ffmpeg = require('fluent-ffmpeg');
const { v4: uuidv4 } = require('uuid');

// Updated FFmpeg configuration
const ffmpegPath = path.join('C:', 'ffmpeg', 'bin', 'ffmpeg.exe'); // Using path.join for proper path formatting
ffmpeg.setFfmpegPath(ffmpegPath);

const app = express();
const PORT = process.env.PORT || 3000;

async function deleteFile(filePath, maxRetries = 3, delayMs = 100) {
	for (let i = 0; i < maxRetries; i++) {
	    try {
		await fs.unlink(filePath);
		return;
	    } catch (err) {
		if (i === maxRetries - 1) throw err;
		await new Promise(resolve => setTimeout(resolve, delayMs));
	    }
	}
}

// mutler storage
const storage = multer.diskStorage({
	destination: './uploads/',
	filename: (req, file, cb) => {
	    cb(null, Date.now() + path.extname(file.originalname));
	}
});


const upload = multer({
	storage,
	fileFilter: (req, file, cb) => {
	    const allowedTypes = ["video/mp4", "video/mkv", "video/avi"];
	    if (!allowedTypes.includes(file.mimetype)) {
		return cb(new Error("Invalid file type. Only MP4, MKV, AVI allowed."));
	    }
	    cb(null, true);
	}
});

app.use("/uploads", express.static("uploads"))

// Image Upload
app.post('/upload/image',upload.single('image'), async (req, res) => {
	if(!req.file) return res.status(400).send('Please upload a file');

	const sizes = { small:150, medium:300, large:600 }
	const filePath = './uploads/' + req.file.filename;
	let thumbnails =  {};

	try {
		for (const [size, width] of Object.entries(sizes)) {
		    const outputPath = `./uploads/thumb_${size}_${req.file.filename}`;

		    await sharp(filePath)
		    	.resize(width, null, {
				fit: sharp.fit.cover, //crop to cover area
				position: sharp.strategy.attention  // Focus on important areas
			})
			.modulate({
				saturation: 1.2,  //Increase Saturation
				brightness: 1.1  //Slight brightness boost
			})
			.normalise() //Increase Saturation
			.sharpen() //Sharpen the image
			.withMetadata() //Preserve metadata
			.toFormat('jpeg', {
				quality: 80,  //Set quality to 80
				mozjpeg: true  //Use mozjpeg
			}) //Convert to jpeg
			.toFile(outputPath);
		    thumbnails[size] = `http://localhost:${PORT}/uploads/thumb_${size}_${req.file.filename}`;
		}
	
		res.json({ original: `http://localhost:${PORT}/uploads/${req.file.filename}`, thumbnails });
	    } catch (err) {
		res.status(500).json({ error: "Error processing image" });
	    }


});

// Update video upload endpoint
app.post("/upload/video", upload.single("video"), async (req, res) => {
	const filesToCleanup = [];
	
	try {
	    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
	    
	    const videoPath = path.join(__dirname, 'uploads', req.file.filename);
	    const rawThumbnailFilename = `raw_thumb_${uuidv4()}.jpg`;
	    const processedThumbnailFilename = `processed_thumb_${uuidv4()}.jpg`;
	    const baseUrl = `${req.protocol}://${req.get('host')}/uploads`;
	    
	    // Track temporary files for cleanup
	    const rawThumbPath = path.join(__dirname, 'uploads', rawThumbnailFilename);
	    filesToCleanup.push(rawThumbPath);
	    
	    // Verify FFmpeg is accessible
	    try {
		await new Promise((resolve, reject) => {
		    ffmpeg.getAvailableFormats((err, formats) => {
			if (err) reject(new Error('FFmpeg not properly configured'));
			resolve();
		    });
		});
	    } catch (err) {
		throw new Error(`FFmpeg configuration error: ${err.message}`);
	    }
    
	    await access(videoPath, fs.constants.F_OK);
	    
	    // Generate raw thumbnail
	    await new Promise((resolve, reject) => {
		ffmpeg(videoPath)
		    .on('start', (commandLine) => {
			console.log('FFmpeg processing started:', commandLine);
		    })
		    .screenshots({
			timestamps: ['00:00:02'],
			filename: rawThumbnailFilename,
			folder: path.join(__dirname, 'uploads'),
			size: '640x360'
		    })
		    .on('end', resolve)
		    .on('error', (err) => {
			reject(new Error(`Failed to capture video frame: ${err.message}`));
		    });
	    });
	    
	    // Process with Sharp
	    const processedThumbPath = path.join(__dirname, 'uploads', processedThumbnailFilename);
	    await sharp(rawThumbPath)
		.resize(320, 180, { fit: 'cover', position: 'centre' })
		.modulate({ saturation: 1.3, brightness: 1.05 })
		.normalise()
		.sharpen()
		.withMetadata()
		.toFormat('jpeg', { quality: 85, mozjpeg: true })
		.toFile(processedThumbPath);
	    
	    // Add a small delay before cleanup
	    await new Promise(resolve => setTimeout(resolve, 100));
	    
	    // Attempt to clean up with retries
	    try {
		await deleteFile(rawThumbPath);
		console.log('Successfully cleaned up raw thumbnail');
	    } catch (cleanupErr) {
		console.warn('Failed to clean up raw thumbnail:', cleanupErr);
		// Continue execution even if cleanup fails
	    }
	    
	    res.json({
		video: `${baseUrl}/${req.file.filename}`,
		thumbnail: `${baseUrl}/${processedThumbnailFilename}`
	    });
	    
	} catch (err) {
	    console.error('Video Processing Error:', err);
	    
	    // Attempt to clean up any temporary files if main processing failed
	    for (const file of filesToCleanup) {
		try {
		    await deleteFile(file);
		} catch (cleanupErr) {
		    console.warn(`Failed to clean up file ${file}:`, cleanupErr);
		}
	    }
	    
	    res.status(500).json({ 
		error: "Video processing failed",
		details: err.message
	    });
	}
    });
    
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));