import Merchant from '../models/merchants.model.js';
import multer from 'multer';
import AWS from 'aws-sdk';
import multerS3 from 'multer-s3';
import 'dotenv/config';

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

const uploadLogo = multer({
    storage: multerS3({
        s3: s3,
        bucket: process.env.S3_BUCKET_NAME,
        key: function (req, file, cb) {
            const ext = file.originalname.split('.').pop();
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, `merchant-logos/logo-${uniqueSuffix}.${ext}`);
        }
    }),
    fileFilter: pngOrSvgFileFilter,
    limits: { fileSize: 2 * 1024 * 1024 } // 2MB limit
});

export const list = async (req, res) => {
    try {
        const merchants = await Merchant.find().populate('category', 'name');
        res.json({ success: true, merchants });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

export const create = async (req, res) => {
    try {
        const merchant = new Merchant(req.body);
        await merchant.save();
        res.json({ success: true, merchant });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

export const get = async (req, res) => {
    try {
        const merchant = await Merchant.findById(req.params.id).populate('category', 'name');
        if (!merchant) return res.status(404).json({ success: false, error: 'Not found' });
        res.json({ success: true, merchant });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

export const update = async (req, res) => {
    try {
        const merchant = await Merchant.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!merchant) return res.status(404).json({ success: false, error: 'Not found' });
        res.json({ success: true, merchant });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

export const deleteMerchant = async (req, res) => {
    try {
        const merchant = await Merchant.findByIdAndDelete(req.params.id);
        if (!merchant) return res.status(404).json({ success: false, error: 'Not found' });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

export const datatable = async (req, res) => {
    try {
        const merchants = await Merchant.find().populate('category', 'name');
        res.json({ data: merchants });
    } catch (err) {
        res.status(500).json({ data: [], error: err.message });
    }
};

// Export the upload middleware for use in routes
export { uploadLogo };
