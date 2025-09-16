import express from 'express';
import { list, create, get, update, deleteMerchant, datatable, uploadLogo } from '../controllers/merchants.controller.js';

const router = express.Router();

// CRUD endpoints
router.get('/list', list);
router.get('/datatable', datatable);
router.post('/', create);
router.get('/:id', get);
router.put('/:id', update);
router.delete('/:id', deleteMerchant);
router.get('/', list);

// Logo upload endpoint (S3 logic to be added)
router.post('/upload-logo', uploadLogo.single('logo'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No image file uploaded' });
        }
        res.json({
            success: true,
            message: 'Logo uploaded successfully',
            logoUrl: req.file.location
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to upload logo' });
    }
});

export default router;
