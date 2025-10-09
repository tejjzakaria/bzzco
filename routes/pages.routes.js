import express from 'express';
import {
    getAllPages,
    getPageById,
    createPage,
    updatePage,
    deletePage,
    bulkDeletePages,
    getPageStats
} from '../controllers/pages.controller.js';

const router = express.Router();

// View routes (Admin UI)
router.get('/view-pages', (req, res) => {
    res.render('admin/view-pages', {
        currentPage: 'view-pages',
        title: 'Manage Pages'
    });
});

router.get('/add-page', (req, res) => {
    res.render('admin/add-page', {
        currentPage: 'add-page',
        title: 'Add New Page',
        tinymceApiKey: process.env.TINYMCE_API_KEY
    });
});

router.get('/edit-page/:id', (req, res) => {
    res.render('admin/edit-page', {
        currentPage: 'edit-page',
        title: 'Edit Page',
        pageId: req.params.id,
        tinymceApiKey: process.env.TINYMCE_API_KEY
    });
});

// API routes
router.get('/api/pages', getAllPages);
router.get('/api/pages/stats', getPageStats);
router.get('/api/pages/:id', getPageById);
router.post('/api/pages', createPage);
router.put('/api/pages/:id', updatePage);
router.delete('/api/pages/:id', deletePage);
router.post('/api/pages/bulk-delete', bulkDeletePages);

export default router;