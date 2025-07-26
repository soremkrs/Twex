// Import Cloudinary SDK and Multer storage adapter
import { v2 as cloudinary } from "cloudinary"; // Cloudinary's v2 API for media storage
import { CloudinaryStorage } from "multer-storage-cloudinary"; // Multer adapter for Cloudinary
import multer from "multer"; // Middleware for handling multipart/form-data (file uploads)
import env from "dotenv";
env.config(); // Load environment variables from .env

// Configure Cloudinary using environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, // Your Cloudinary cloud name
  api_key: process.env.CLOUDINARY_API_KEY,       // API key for authentication
  api_secret: process.env.CLOUDINARY_API_SECRET, // API secret for authentication
});

// Set up Cloudinary storage configuration for Multer
const storage = new CloudinaryStorage({
  cloudinary, // Pass the configured Cloudinary instance
  params: {
    folder: "twex", // Folder name in your Cloudinary account to store uploads
    transformation: [
      { width: 1080, height: 1080, crop: "limit" }, // Limit image size to 1080x1080 without cropping
      { quality: "auto", fetch_format: "auto" },    // Automatically optimize quality and format
    ],
  },
});

// Optional file filter: allow only images to be uploaded
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) cb(null, true); // Accept image files
  else cb(new Error("Only images allowed!"), false);      // Reject non-image files
};

// Export Multer middleware configured with Cloudinary storage and filter
export const upload = multer({ storage, fileFilter });

// Export the configured Cloudinary instance (useful for deleting or manipulating images later)
export { cloudinary };
