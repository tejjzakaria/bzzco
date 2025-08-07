import express from 'express';
import customersRoutes from './customers.routes.js';
import sellersRoutes from './sellers.routes.js';

const router = express.Router();
// Home route
router.get('/', (req, res) => {
    res.render('index');
});

// Dashboard route
router.get('/dashboard', (req, res) => {
    res.render('dashboard', { currentPage: 'dashboard' });
});

// Use separated route files
router.use('/', customersRoutes);
router.use('/', sellersRoutes);

// Products routes
router.get('/view-products', (req, res) => {
    res.render('view-products', { currentPage: 'view-products' });
});

router.get('/add-product', (req, res) => {
    res.render('add-product', { currentPage: 'add-product' });
});

// Categories routes
router.get('/view-categories', (req, res) => {
    res.render('view-categories', { currentPage: 'view-categories' });
});

router.get('/add-category', (req, res) => {
    res.render('add-category', { currentPage: 'add-category' });
});

// Orders routes
router.get('/view-orders', (req, res) => {
    res.render('view-orders', { currentPage: 'view-orders' });
});

router.get('/add-order', (req, res) => {
    res.render('add-order', { currentPage: 'add-order' });
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
