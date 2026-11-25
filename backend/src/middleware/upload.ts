import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { Request } from 'express';
const cloudinary = require('cloudinary').v2;
// @ts-ignore: No types available
import CloudinaryStorage from 'multer-storage-cloudinary';

/**
 * Menu photo storage.
 * - Cloudinary when CLOUDINARY_* env vars are set (recommended for production).
 * - Local disk (backend/uploads, served at /uploads) otherwise, so uploads work out of the box.
 */
export const useCloudinary = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET
);

const UPLOAD_DIR = path.join(__dirname, '../../uploads');

let storage: multer.StorageEngine;

if (useCloudinary) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  storage = new CloudinaryStorage({
    cloudinary: { v2: cloudinary },
    params: (_req: Request, file: Express.Multer.File, cb: any) => {
      cb(null, {
        folder: 'smart-restaurant',
        format: 'png',
        public_id: `${Date.now()}-${path.parse(file.originalname).name}`,
      });
    },
  });
  console.log('🖼️  Photo storage: Cloudinary');
} else {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    filename: (_req, file, cb) => {
      const safeName = path.parse(file.originalname).name.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40);
      cb(null, `${Date.now()}-${safeName}${path.extname(file.originalname).toLowerCase()}`);
    },
  });
  console.log('🖼️  Photo storage: local disk (set CLOUDINARY_* to use Cloudinary)');
}

/** Public URL for an uploaded file, regardless of storage backend */
export const getUploadedFileUrl = (file: Express.Multer.File): string =>
  useCloudinary ? ((file as any).secure_url || file.path) : `/uploads/${file.filename}`;

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Max 5MB
  fileFilter: (_req: Request, file: Express.Multer.File, cb) => {
    if (/jpeg|jpg|png|webp/.test(file.mimetype)) return cb(null, true);
    cb(new Error('Only image files (jpg, png, webp) are supported.'));
  },
});
