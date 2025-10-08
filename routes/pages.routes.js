import express from 'express';
import Page from '../models/pages.model.js';

const router = express.Router();

// GET privacy policy page for admin edit
router.get('/privacy-policy', async (req, res) => {
    let page = await Page.findOne({ slug: 'privacy-policy' });
    if (!page) {
        page = new Page({ title: 'Privacy Policy', slug: 'privacy-policy', content: '', status: 'draft' });
        await page.save();
    }
    res.render('admin/view-privacy-policy', { page, currentPage: 'view-privacy-policy' });
});

// POST update privacy policy
router.post('/privacy-policy', async (req, res) => {
    const { title, content, status } = req.body;
    await Page.findOneAndUpdate(
        { slug: 'privacy-policy' },
        { title, content, status, updatedAt: new Date() },
        { new: true, upsert: true }
    );
    // After saving, fetch updated page and render
    const page = await Page.findOne({ slug: 'privacy-policy' });
    res.render('admin/view-privacy-policy', { page, currentPage: 'view-privacy-policy' });
});

// POST delete privacy policy
router.post('/privacy-policy/delete', async (req, res) => {
    await Page.findOneAndDelete({ slug: 'privacy-policy' });
    res.render('admin/view-privacy-policy', { page: { title: '', content: '', status: 'draft' }, currentPage: 'view-privacy-policy' });
});

export default router;