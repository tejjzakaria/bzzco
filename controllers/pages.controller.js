import Page from '../models/pages.model.js';

// Get all pages (API for DataTables)
export const getAllPages = async (req, res) => {
    try {
        const pages = await Page.find({})
            .sort({ order: 1, createdAt: -1 })
            .select('title slug status pageType isInMenu order createdAt updatedAt');

        res.json({
            success: true,
            pages: pages
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch pages",
            error: error.message
        });
    }
};

// Get single page by ID
export const getPageById = async (req, res) => {
    try {
        const page = await Page.findById(req.params.id);

        if (!page) {
            return res.status(404).json({
                success: false,
                message: "Page not found"
            });
        }

        res.json({
            success: true,
            page: page
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch page",
            error: error.message
        });
    }
};

// Get page by slug (for public view)
export const getPageBySlug = async (req, res) => {
    try {
        const page = await Page.findOne({
            slug: req.params.slug,
            status: 'published'
        });

        if (!page) {
            return res.status(404).render('404', {
                message: 'Page not found'
            });
        }

        res.render('page', {
            page: page,
            title: page.title
        });
    } catch (error) {
        res.status(500).render('error', {
            message: "Failed to load page"
        });
    }
};

// Create new page
export const createPage = async (req, res) => {
    try {
        const pageData = {
            title: req.body.title,
            slug: req.body.slug,
            content: req.body.content,
            metaDescription: req.body.metaDescription || '',
            metaKeywords: req.body.metaKeywords ?
                (Array.isArray(req.body.metaKeywords) ? req.body.metaKeywords : req.body.metaKeywords.split(',').map(k => k.trim())) : [],
            status: req.body.status || 'draft',
            pageType: req.body.pageType || 'general',
            order: req.body.order || 0,
            isInMenu: req.body.isInMenu === 'true' || req.body.isInMenu === true,
            template: req.body.template || 'default'
        };

        const newPage = new Page(pageData);
        await newPage.save();

        res.json({
            success: true,
            message: "Page created successfully",
            page: newPage
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: "A page with this slug already exists"
            });
        }

        res.status(500).json({
            success: false,
            message: "Failed to create page",
            error: error.message
        });
    }
};

// Update page
export const updatePage = async (req, res) => {
    try {
        const pageData = {
            title: req.body.title,
            slug: req.body.slug,
            content: req.body.content,
            metaDescription: req.body.metaDescription || '',
            metaKeywords: req.body.metaKeywords ?
                (Array.isArray(req.body.metaKeywords) ? req.body.metaKeywords : req.body.metaKeywords.split(',').map(k => k.trim())) : [],
            status: req.body.status || 'draft',
            pageType: req.body.pageType || 'general',
            order: req.body.order || 0,
            isInMenu: req.body.isInMenu === 'true' || req.body.isInMenu === true,
            template: req.body.template || 'default'
        };

        const updatedPage = await Page.findByIdAndUpdate(
            req.params.id,
            pageData,
            { new: true, runValidators: true }
        );

        if (!updatedPage) {
            return res.status(404).json({
                success: false,
                message: "Page not found"
            });
        }

        res.json({
            success: true,
            message: "Page updated successfully",
            page: updatedPage
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: "A page with this slug already exists"
            });
        }

        res.status(500).json({
            success: false,
            message: "Failed to update page",
            error: error.message
        });
    }
};

// Delete page
export const deletePage = async (req, res) => {
    try {
        const deletedPage = await Page.findByIdAndDelete(req.params.id);

        if (!deletedPage) {
            return res.status(404).json({
                success: false,
                message: "Page not found"
            });
        }

        res.json({
            success: true,
            message: "Page deleted successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to delete page",
            error: error.message
        });
    }
};

// Bulk delete pages
export const bulkDeletePages = async (req, res) => {
    try {
        const { ids } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No page IDs provided"
            });
        }

        const result = await Page.deleteMany({ _id: { $in: ids } });

        res.json({
            success: true,
            message: `${result.deletedCount} page(s) deleted successfully`,
            deletedCount: result.deletedCount
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to delete pages",
            error: error.message
        });
    }
};

// Get page statistics
export const getPageStats = async (req, res) => {
    try {
        const total = await Page.countDocuments();
        const published = await Page.countDocuments({ status: 'published' });
        const draft = await Page.countDocuments({ status: 'draft' });
        const archived = await Page.countDocuments({ status: 'archived' });
        const inMenu = await Page.countDocuments({ isInMenu: true });

        res.json({
            success: true,
            stats: {
                total,
                published,
                draft,
                archived,
                inMenu
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch statistics",
            error: error.message
        });
    }
};
