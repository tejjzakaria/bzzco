import express from 'express';
import Category from '../models/categories.model.js';
import { 
    getAllCategories, 
    addCategory, 
    updateCategory, 
    deleteCategory, 
    deleteBulkCategories,
    getCategoriesForDataTable,
    getCategoryById
} from '../controllers/categories.controller.js';
import multer from 'multer';
import AWS from 'aws-sdk';
import multerS3 from 'multer-s3';
import 'dotenv/config';

const router = express.Router();

// Configure AWS S3
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

// File filter for SVG and PNG
const pngOrSvgFileFilter = (req, file, cb) => {
    if (
        file.mimetype === 'image/svg+xml' ||
        file.mimetype === 'image/png' ||
        file.originalname.endsWith('.svg') ||
        file.originalname.endsWith('.png')
    ) {
        cb(null, true);
    } else {
        cb(new Error('Only SVG and PNG files are allowed!'), false);
    }
};

const uploadImage = multer({
    storage: multerS3({
        s3: s3,
        bucket: process.env.S3_BUCKET_NAME,
        key: function (req, file, cb) {
            const ext = file.originalname.split('.').pop();
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, `category-icons/icon-${uniqueSuffix}.${ext}`);
        }
    }),
    fileFilter: pngOrSvgFileFilter,
    limits: { fileSize: 2 * 1024 * 1024 } // 2MB limit
});

// View route for categories page
router.get('/view-categories', getAllCategories);

// API routes for categories CRUD operations
router.get('/api/categories/list', async (req, res) => {
    try {
        const categories = await Category.find({});
        res.json({ success: true, categories });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch categories' });
    }
});
router.get('/api/categories/datatable', getCategoriesForDataTable);
router.get('/api/categories/:id', getCategoryById);
router.post('/api/categories', addCategory);
router.put('/api/categories/:id', updateCategory);
router.delete('/api/categories/bulk/delete', deleteBulkCategories); // Bulk delete must come before single delete
router.delete('/api/categories/:id', deleteCategory);

// SVG/PNG icon upload endpoint
router.post('/api/categories/upload-icon', uploadImage.single('icon'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image file uploaded' });
        }
        res.json({
            success: true,
            message: 'Icon uploaded successfully',
            iconUrl: req.file.location
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to upload icon' });
    }
});

export default router;
