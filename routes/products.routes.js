import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { getAllProducts, addProduct, getProductById, updateProduct, updateProductStatus, deleteProduct, getProductStats } from '../controllers/products.controller.js';
import Seller from '../models/sellers.model.js';
import Merchant from '../models/merchants.model.js';
import Category from '../models/categories.model.js'; // Import Category model
import AWS from 'aws-sdk';
import multerS3 from 'multer-s3';
import 'dotenv/config'; // Ensure env variables are loaded
import mongoose from 'mongoose';

const router = express.Router();

// Configure AWS S3
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

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
    storage: multerS3({
        s3: s3,
        bucket: process.env.S3_BUCKET_NAME, // <-- updated to match .env
        key: function (req, file, cb) {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, 'products/product-' + uniqueSuffix + path.extname(file.originalname));
        }
    }),
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Debug route to check sellers in database
router.get('/debug/sellers', async (req, res) => {
    try {
        const sellers = await Seller.find({});
        res.json({
            count: sellers.length,
            sellers: sellers
        });
    } catch (error) {
        res.json({
            error: error.message,
            sellers: []
        });
    }
});

// API route for sellers dropdown (for dynamic loading)
router.get('/api/sellers-dropdown', async (req, res) => {
    try {
        const sellers = await Seller.find({}, 'full_name company email').sort({ full_name: 1 });
        res.json({
            success: true,
            sellers: sellers
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: "Failed to fetch sellers",
            sellers: []
        });
    }
});

// Products page routes
router.get('/view-products', (req, res) => {
    res.render('admin/view-products', { currentPage: 'view-products' });
});

router.get('/add-product', async (req, res) => {
    let merchants = [];
    let categories = [];
    try {
        // Fetch merchants for the vendor dropdown
        merchants = await Merchant.find({}, 'name logo status').sort({ name: 1 });

        // Fetch categories for the category dropdown
        categories = await Category.find({}, 'name').sort({ name: 1 });
    } catch (error) {
        merchants = [];
        categories = [];
    }

    // Always render with merchants and categories variables defined
    res.render('admin/add-product', { 
        currentPage: 'add-product',
        merchants: merchants || [],
        categories: categories || []
    });
});

// Edit product page route
router.get('/edit-product/:id', async (req, res) => {
    let sellers = [];
    try {
        // Fetch sellers for the vendor dropdown
        sellers = await Seller.find({}, 'full_name company email').sort({ full_name: 1 });
    } catch (error) {
        sellers = []; // Ensure sellers is always an array
    }
    
    // Always render with sellers variable defined
    res.render('admin/edit-product', { 
        currentPage: 'edit-product',
        sellers: sellers || [] // Double ensure it's always an array
    });
});

// Image upload endpoint
router.post('/api/products/upload', upload.array('images', 10), (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }
        // Use S3 URLs
        const imageUrls = req.files.map(file => file.location);
        res.json({
            success: true,
            message: 'Images uploaded successfully',
            images: imageUrls
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to upload images" });
    }
});

// Generic upload route for dropzone (compatibility with existing form)
router.post('/upload', (req, res) => {
    upload.array('file', 10)(req, res, (err) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }

        try {
            if (!req.files || req.files.length === 0) {
                return res.status(400).json({ error: 'No files uploaded' });
            }

            const imageUrls = req.files.map(file => `/assets/img/products/${file.filename}`);

            const response = {
                success: true,
                message: 'Images uploaded successfully',
                images: imageUrls
            };

            res.setHeader('Content-Type', 'application/json');
            res.json(response);
        } catch (error) {
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
            const imageUrls = req.files.map(file => file.location); // S3 URLs
            productData.images = imageUrls;
        } else if (productData.images && typeof productData.images === 'string') {
            // Images uploaded via dropzone (already uploaded, sent as JSON string)
            try {
                productData.images = JSON.parse(productData.images);
            } catch (e) {
                productData.images = [];
            }
        } else {
            productData.images = [];
        }

        // Parse JSON fields if they come as strings from form data - with error handling
        try {
            if (typeof productData.variants === 'string' && productData.variants.trim()) {
                productData.variants = JSON.parse(productData.variants);
            } else if (!productData.variants || !Array.isArray(productData.variants)) {
                productData.variants = [];
            }
        } catch (e) {
            productData.variants = [];
        }

        try {
            if (req.body.selectedCountries) {
                const parsedCountries = JSON.parse(req.body.selectedCountries);
                productData.selectedCountries = Array.isArray(parsedCountries) ? parsedCountries : [];
            } else {
                productData.selectedCountries = [];
            }
        } catch (e) {
            productData.selectedCountries = [];
        }

        try {
            if (typeof productData.attributes === 'string' && productData.attributes.trim()) {
                productData.attributes = JSON.parse(productData.attributes);
            } else {
                productData.attributes = {};
            }
        } catch (e) {
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
            productData.tags = [];
        }

        // Clean up enum fields - remove empty strings for enum fields
        if (productData.productIdType === '') {
            delete productData.productIdType;
        }

        // Handle checkbox enum fields specifically
        if (productData.inStock !== undefined) {
            productData.inStock = (productData.inStock === 'true' || productData.inStock === true || productData.inStock === 'yes') ? 'yes' : 'no';
        }
        if (productData.chargeTax !== undefined) {
            productData.chargeTax = (productData.chargeTax === 'true' || productData.chargeTax === true || productData.chargeTax === 'yes') ? 'yes' : 'no';
        }

        // Use the existing addProduct function from controller
        req.body = productData;
        await addProduct(req, res);

    } catch (error) {
        res.status(500).json({ error: "Failed to create product" });
    }
});

// Products API routes
router.get('/api/products/stats', getProductStats);
router.get('/api/products', getAllProducts);
router.get('/api/products/:id', getProductById);
router.put('/api/products/:id', upload.array('newImages', 10), async (req, res) => {
    try {
        const productData = req.body;

        // Handle uploaded images
        if (req.files && req.files.length > 0) {
            const imageUrls = req.files.map(file => file.location); // S3 URLs
            // Note: existing images are handled in the controller
        }

        // Parse JSON fields if they come as strings from form data - with error handling
        try {
            if (typeof productData.variants === 'string' && productData.variants.trim()) {
                productData.variants = JSON.parse(productData.variants);
            } else if (!productData.variants || !Array.isArray(productData.variants)) {
                productData.variants = [];
            }
        } catch (e) {
            productData.variants = [];
        }

        try {
            if (req.body.selectedCountries) {
                const parsedCountries = JSON.parse(req.body.selectedCountries);
                productData.selectedCountries = Array.isArray(parsedCountries) ? parsedCountries : [];
            } else {
                productData.selectedCountries = [];
            }
        } catch (e) {
            productData.selectedCountries = [];
        }

        try{
            if (typeof productData.attributes === 'string' && productData.attributes.trim()) {
                productData.attributes = JSON.parse(productData.attributes);
            } else {
                productData.attributes = {};
            }
        } catch (e) {
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
            productData.tags = [];
        }

        // Clean up enum fields - remove empty strings for enum fields
        if (productData.productIdType === '') {
            delete productData.productIdType;
        }

        // Handle checkbox enum fields specifically
        if (productData.inStock !== undefined) {
            productData.inStock = (productData.inStock === 'true' || productData.inStock === true || productData.inStock === 'yes') ? 'yes' : 'no';
        }
        if (productData.chargeTax !== undefined) {
            productData.chargeTax = (productData.chargeTax === 'true' || productData.chargeTax === true || productData.chargeTax === 'yes') ? 'yes' : 'no';
        }

        // Use the existing updateProduct function from controller
        req.body = productData;
        await updateProduct(req, res);

    } catch (error) {
        res.status(500).json({ error: "Failed to update product" });
    }
});
router.patch('/api/products/:id/status', updateProductStatus);
router.delete('/api/products/:id', deleteProduct);

export default router;
