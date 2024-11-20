const express = require("express");
const multer = require("multer");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const cors = require("cors");
const dotenv = require("dotenv");
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB


dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Validate environment variables
const requiredEnvVars = [
  "AWS_REGION",
  "AWS_ACCESS_KEY_ID",
  "AWS_SECRET_ACCESS_KEY",
  "AWS_BUCKET_NAME",
  "PORT",
];

requiredEnvVars.forEach((varName) => {
  if (!process.env[varName]) {
    console.error(`Error: Missing environment variable ${varName}`);
    process.exit(1);
  }
});

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE}, 
});

async function uploadFileToS3(file) {
  // Validate file size 
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds ${MAX_FILE_SIZE} MB. Please upload a smaller file.`);
  }

  // Validate file type (only PDF)
  if (file.mimetype !== "application/pdf") {
    throw new Error("Invalid file type. Please upload a PDF file.");
  }

  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: `${Date.now()}-${file.originalname}`,
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  const command = new PutObjectCommand(params);
  await s3Client.send(command);

  return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${params.Key}`;
}

app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send({ message: "No file uploaded." });
    }

    const fileUrl = await uploadFileToS3(req.file);
    res
      .status(200)
      .send({ message: "File uploaded successfully.", url: fileUrl });
  } catch (error) {
    console.error("Error uploading file:", error.message);
    res
      .status(500)
      .send({ message: "Failed to upload file.", error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
