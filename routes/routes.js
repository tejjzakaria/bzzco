import express from 'express';
import customersRoutes from './customers.routes.js';
import sellersRoutes from './sellers.routes.js';
import productsRoutes from './products.routes.js';
import categoriesRoutes from './categories.routes.js';
import ordersRoutes from './orders.routes.js';
import merchantsRoutes from './merchants.routes.js';
import teamRoutes from './team.routes.js';
import contactRoutes from './contact.routes.js';
import authRoutes from './auth.routes.js';
import pagesRoutes from './pages.routes.js';
import sellerApplicationsRoutes from './seller-applications.routes.js';
import notificationsRoutes from './notifications.routes.js';
import { optionalVerifyToken } from '../middleware/jwt.middleware.js';

const router = express.Router();
// Home route
router.get('/login', (req, res) => {
    res.render('login');
});

router.get('/sign-up', (req, res) => {
    res.render('register');
});


// Dashboard route (protected) - default fallback
router.get('/dashboard', optionalVerifyToken, (req, res) => {
    // If user is authenticated, pass user info to template
    const user = req.user || null;
    res.render('admin/dashboard', { currentPage: 'dashboard', user });
});

// Role-specific dashboard routes
router.get('/admin/dashboard', optionalVerifyToken, (req, res) => {
    const user = req.user || null;
    res.render('admin/dashboard', { currentPage: 'dashboard', user });
});

router.get('/seller/dashboard', optionalVerifyToken, (req, res) => {
    const user = req.user || null;
    res.render('seller/dashboard', { currentPage: 'dashboard', user });
});

router.get('/customer/dashboard', optionalVerifyToken, (req, res) => {
    const user = req.user || null;
    res.render('customer/dashboard', { currentPage: 'dashboard', user });
});

// Use separated route files
router.use('/', customersRoutes);
router.use('/', sellersRoutes);
router.use('/', productsRoutes);
router.use('/', categoriesRoutes);
router.use('/', ordersRoutes);
router.use('/api/auth', authRoutes);
router.use('/api/merchants', merchantsRoutes);
router.use('/api/team', teamRoutes);
router.use('/api/contact', contactRoutes);
router.use('/admin/pages', pagesRoutes);
router.use('/', sellerApplicationsRoutes);
router.use('/', notificationsRoutes);

// Dynamic public page route (must be near the end to avoid conflicts)
router.get('/:slug', async (req, res, next) => {
    try {
        const Page = (await import('../models/pages.model.js')).default;
        const page = await Page.findOne({
            slug: req.params.slug,
            status: 'published'
        });

        if (!page) {
            return next(); // Pass to next route handler (404)
        }

        res.render('page', {
            page: page,
            title: page.title
        });
    } catch (error) {
        next(error);
    }
});

router.get('/view-customers', (req, res) => {
    res.render('admin/view-customers', { currentPage: 'view-customers' });
});


router.get('/view-sellers', (req, res) => {
    res.render('admin/view-sellers', { currentPage: 'view-sellers' });
});

router.get('/view-users', (req, res) => {
    res.render('admin/view-users', { currentPage: 'view-users' });
});
router.get('/view-merchants', (req, res) => {
    res.render('admin/view-merchants', { currentPage: 'view-merchants' });
});

router.get('/view-categories', (req, res) => {
    res.render('admin/view-categories', { currentPage: 'view-categories' });
});

router.get('/view-pages', (req, res) => {
    res.render('admin/view-pages', { currentPage: 'view-pages' });
});



// Dynamic Data routes
router.get('/view-team', (req, res) => {
    res.render('admin/view-team', { currentPage: 'view-team' });
});

router.get('/view-slider', (req, res) => {
    res.render('admin/view-slider', { currentPage: 'view-slider' });
});


router.get('/view-cities', (req, res) => {
    res.render('admin/view-cities', { currentPage: 'view-cities' });
});

router.get('/view-countries', (req, res) => {
    res.render('admin/view-countries', { currentPage: 'view-countries' });
});

// Other routes
router.get('/documentation', (req, res) => {
    res.render('admin/documentation', { currentPage: 'documentation' });
});

router.get('/view-contact', (req, res) => {
    res.render('admin/view-contact', { currentPage: 'view-contact' });
});

router.get('/view-newsletter', (req, res) => {
    res.render('admin/view-newsletter', { currentPage: 'view-newsletter' });
});

router.get('/view-job-applications', (req, res) => {
    res.render('admin/view-job-applications', { currentPage: 'view-job-applications' });
});

router.get('/view-docs', (req, res) => {
    res.render('admin/view-docs', { currentPage: 'view-docs' });
});

export default router;
