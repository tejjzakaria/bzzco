import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { getAllProducts, addProduct, getProductById, updateProductStatus, deleteProduct } from '../controllers/products.controller.js';

const router = express.Router();

// Configure multer for image upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = './assets/img/products';
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        // Generate unique filename with timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'product-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter for images only
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Products page routes
router.get('/view-products', (req, res) => {
    res.render('view-products', { currentPage: 'view-products' });
});

router.get('/add-product', (req, res) => {
    res.render('add-product', { currentPage: 'add-product' });
});

// Image upload endpoint
router.post('/api/products/upload', upload.array('images', 10), (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }

        const imageUrls = req.files.map(file => `/assets/img/products/${file.filename}`);
        
        res.json({
            success: true,
            message: 'Images uploaded successfully',
            images: imageUrls
        });
    } catch (error) {
        console.log("ERROR UPLOADING IMAGES", error);
        res.status(500).json({ error: "Failed to upload images" });
    }
});

// Generic upload route for dropzone (compatibility with existing form)
router.post('/upload', (req, res) => {
    console.log('=== UPLOAD ENDPOINT HIT ===');
    console.log('Request method:', req.method);
    console.log('Request URL:', req.url);
    console.log('Content-Type:', req.get('Content-Type'));
    console.log('Request headers:', req.headers);
    
    upload.array('file', 10)(req, res, (err) => {
        if (err) {
            console.log('Multer error:', err.message);
            return res.status(400).json({ error: err.message });
        }
        
        console.log('Files received:', req.files ? req.files.length : 0);
        console.log('Body:', req.body);
        
        try {
            if (!req.files || req.files.length === 0) {
                console.log('No files uploaded');
                return res.status(400).json({ error: 'No files uploaded' });
            }

            console.log('Files details:', req.files.map(f => ({ 
                originalname: f.originalname, 
                filename: f.filename, 
                size: f.size,
                path: f.path 
            })));

            const imageUrls = req.files.map(file => `/assets/img/products/${file.filename}`);
            
            console.log('Generated image URLs:', imageUrls);
            
            const response = {
                success: true,
                message: 'Images uploaded successfully',
                images: imageUrls
            };
            
            console.log('Sending response:', JSON.stringify(response));
            res.setHeader('Content-Type', 'application/json');
            res.json(response);
        } catch (error) {
            console.log("ERROR UPLOADING FILES", error);
            res.status(500).json({ error: "Failed to upload files" });
        }
    });
});

// Enhanced add product with image handling
router.post('/api/products', upload.array('images', 10), async (req, res) => {
    try {
        const productData = req.body;
        
        // Handle uploaded images - check both multipart files and JSON string
        if (req.files && req.files.length > 0) {
            // Images uploaded via multipart form (direct file upload)
            const imageUrls = req.files.map(file => `/assets/img/products/${file.filename}`);
            productData.images = imageUrls;
            console.log('Images from multipart upload:', imageUrls);
        } else if (productData.images && typeof productData.images === 'string') {
            // Images uploaded via dropzone (already uploaded, sent as JSON string)
            try {
                productData.images = JSON.parse(productData.images);
                console.log('Images from dropzone (parsed JSON):', productData.images);
            } catch (e) {
                console.log('Error parsing images JSON:', e);
                productData.images = [];
            }
        } else {
            productData.images = [];
            console.log('No images found');
        }

        // Parse JSON fields if they come as strings from form data - with error handling
        try {
            if (typeof productData.variants === 'string' && productData.variants.trim()) {
                productData.variants = JSON.parse(productData.variants);
            } else {
                productData.variants = [];
            }
        } catch (e) {
            console.log('Error parsing variants:', e);
            productData.variants = [];
        }

        try {
            if (typeof productData.selectedCountries === 'string' && productData.selectedCountries.trim()) {
                productData.selectedCountries = JSON.parse(productData.selectedCountries);
            } else {
                productData.selectedCountries = [];
            }
        } catch (e) {
            console.log('Error parsing selectedCountries:', e);
            productData.selectedCountries = [];
        }

        try {
            if (typeof productData.attributes === 'string' && productData.attributes.trim()) {
                productData.attributes = JSON.parse(productData.attributes);
            } else {
                productData.attributes = {};
            }
        } catch (e) {
            console.log('Error parsing attributes:', e);
            productData.attributes = {};
        }

        try {
            if (typeof productData.tags === 'string' && productData.tags.trim()) {
                // Handle both JSON array and comma-separated string
                if (productData.tags.startsWith('[')) {
                    const tagifyData = JSON.parse(productData.tags);
                    productData.tags = tagifyData.map(tag => tag.value || tag);
                } else {
                    // Split comma-separated tags
                    productData.tags = productData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
                }
            } else {
                productData.tags = [];
            }
        } catch (e) {
            console.log('Error parsing tags:', e);
            productData.tags = [];
        }

        // Log the processed data for debugging
        console.log('Processed product data:', JSON.stringify(productData, null, 2));

        // Clean up enum fields - remove empty strings for enum fields
        if (productData.productIdType === '') {
            delete productData.productIdType;
        }

        // Use the existing addProduct function from controller
        req.body = productData;
        await addProduct(req, res);

    } catch (error) {
        console.log("ERROR CREATING PRODUCT WITH IMAGES", error);
        
        // Clean up uploaded files if product creation fails
        if (req.files && req.files.length > 0) {
            req.files.forEach(file => {
                fs.unlink(file.path, (err) => {
                    if (err) console.log('Error deleting file:', err);
                });
            });
        }
        
        res.status(500).json({ error: "Failed to create product" });
    }
});

// Products API routes
router.get('/api/products', getAllProducts);
router.get('/api/products/:id', getProductById);
router.patch('/api/products/:id/status', updateProductStatus);
router.delete('/api/products/:id', deleteProduct);

export default router;
