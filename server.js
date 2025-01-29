const express = require('express');
const multer = require('multer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const sharp = require('sharp');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const { v4: uuidv4 } = require('uuid');


// mutler storage
const storage = multer.diskStorage({
	destination: './uploads/',
	filename: (req, file, cb) => {
		cb(null, Date.now() + path.extname(file.originalname));
	}
})

const upload = multer({ storage })

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
		    await sharp(filePath).resize(width).toFile(outputPath);
		    thumbnails[size] = `http://localhost:${PORT}/uploads/thumb_${size}_${req.file.filename}`;
		}
	
		res.json({ original: `http://localhost:${PORT}/uploads/${req.file.filename}`, thumbnails });
	    } catch (err) {
		res.status(500).json({ error: "Error processing image" });
	    }


});

// Video Upload
app.post("/upload/video", upload.single("video"), async (req, res) => {
	if(!req.file) return res.status(400).send('Please upload a file');

	const videoPath = './uploads/' + req.file.filename;
	const outputPath = `./uploads/thumb_${req.file.filename}.png`;

	try {
		ffmpeg(videoPath)
			.screenshots({
				timestamps: ["00:00:05"],
				filename: `thumb_${req.file.filename}.jpg`,
				folder: "./uploads",
				size: "320x240"
			})
			.on("end", () => {
				res.json({ 
					video: `http://localhost:${PORT}/uploads/${req.file.filename}`,
					thumbnail: `http://localhost:${PORT}/uploads/thumb_${req.file.filename}.jpg` 
				});
			});
	} catch (err) {
		res.status(500).json({ error: "Error processing video" });
	}
});

app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));

