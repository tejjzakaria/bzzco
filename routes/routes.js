import express from 'express';
import customersRoutes from './customers.routes.js';
import sellersRoutes from './sellers.routes.js';
import productsRoutes from './products.routes.js';
import categoriesRoutes from './categories.routes.js';
import ordersRoutes from './orders.routes.js';
import authRoutes from './auth.routes.js';
import { optionalVerifyToken } from '../middleware/jwt.middleware.js';

const router = express.Router();
// Home route
router.get('/login', (req, res) => {
    res.render('login');
});

router.get('/sign-up', (req, res) => {
    res.render('register');
});


// Dashboard route (protected)
router.get('/dashboard', optionalVerifyToken, (req, res) => {
    // If user is authenticated, pass user info to template
    const user = req.user || null;
    res.render('dashboard', { currentPage: 'dashboard', user });
});

// Use separated route files
router.use('/', customersRoutes);
router.use('/', sellersRoutes);
router.use('/', productsRoutes);
router.use('/', categoriesRoutes);
router.use('/', ordersRoutes);
router.use('/api/auth', authRoutes);

router.get('/view-customers', (req, res) => {
    res.render('view-customers', { currentPage: 'view-customers' });
});

router.get('/view-sellers', (req, res) => {
    res.render('view-sellers', { currentPage: 'view-sellers' });
});




// Finances routes
router.get('/view-payments', (req, res) => {
    res.render('view-payments', { currentPage: 'view-payments' });
});

router.get('/view-invoices', (req, res) => {
    res.render('view-invoices', { currentPage: 'view-invoices' });
});

// Dynamic Data routes
router.get('/view-team', (req, res) => {
    res.render('view-team', { currentPage: 'view-team' });
});


router.get('/view-cities', (req, res) => {
    res.render('view-cities', { currentPage: 'view-cities' });
});

router.get('/view-countries', (req, res) => {
    res.render('view-countries', { currentPage: 'view-countries' });
});

// Other routes
router.get('/documentation', (req, res) => {
    res.render('documentation', { currentPage: 'documentation' });
});

export default router;
