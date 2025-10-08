import express from 'express';
import Customer from '../models/customers.model.js';
import Product from '../models/products.model.js';
import Order from '../models/orders.model.js';
import {getAllOrders,
    addOrder,
    updateOrder,
    deleteOrder,
    getOrderById,
    bulkDeleteOrders} from '../controllers/orders.controller.js';

const router = express.Router();

// View routes
router.get('/add-order', async (req, res) => {
    try {
        // Fetch all customers for the dropdown
        const customers = await Customer.find({})
            .select('full_name email phone_number _id')
            .sort({ full_name: 1 });

        const products = await Product.find({})
            .select('productTitle productPrice _id')
            .sort({ productTitle: 1 });

        res.render('admin/add-order', { 
            title: 'Add New Order',
            currentPage: 'add-order',
            customers: customers,
            products: products
        });
    } catch (error) {
        console.error('Error loading add order page:', error);
        res.render('admin/add-order', { 
            title: 'Add New Order',
            currentPage: 'add-order',
            customers: [], // Empty array as fallback
            products: []
        });
    }
});

router.get('/view-orders', async (req, res) => {
    try {
        // Calculate order statistics
        const totalOrders = await Order.countDocuments();
        const pendingOrders = await Order.countDocuments({ status: 'Pending' });
        const completedOrders = await Order.countDocuments({ status: 'Delivered' });
        const cancelledOrders = await Order.countDocuments({ status: 'Cancelled' });
        const refundedOrders = await Order.countDocuments({ payment_status: 'Refunded' });
        
        const stats = {
            total: totalOrders,
            pending: pendingOrders,
            completed: completedOrders,
            cancelled: cancelledOrders,
            refunded: refundedOrders
        };

        res.render('admin/view-orders', { 
            title: 'View Orders',
            currentPage: 'view-orders',
            stats: stats
        });
    } catch (error) {
        console.error('Error loading orders statistics:', error);
        res.render('admin/view-orders', { 
            title: 'View Orders',
            currentPage: 'view-orders',
            stats: {
                total: 0,
                pending: 0,
                completed: 0,
                cancelled: 0,
                refunded: 0
            }
        });
    }
});

// Edit order route
router.get('/edit-order/:orderId', async (req, res) => {
    try {
        const orderId = req.params.orderId;

        // Fetch the order with populated fields
        const order = await Order.findById(orderId)
            .populate('customer_id', 'full_name email phone_number')
            .populate({
                path: 'products.product_id',
                select: 'productTitle productPrice _id'
            });

        if (!order) {
            return res.status(404).render('error', { 
                title: 'Order Not Found',
                message: 'The requested order could not be found.'
            });
        }

        // Fetch all products for the add product functionality
        const products = await Product.find({})
            .select('productTitle productPrice _id')
            .sort({ productTitle: 1 });

        res.render('admin/edit-order', { 
            title: 'Edit Order',
            currentPage: 'edit-order',
            order: order,
            products: products
        });
    } catch (error) {
        console.error('Error loading edit order page:', error);
        res.status(500).render('admin/error', { 
            title: 'Server Error',
            message: 'Failed to load the edit order page. Please try again.'
        });
    }
});

// API routes
router.get('/api/orders', getAllOrders);
router.post('/api/orders', addOrder);
router.post('/api/orders/bulk-delete', bulkDeleteOrders);
router.get('/api/orders/:orderId', getOrderById);
router.put('/api/orders/:orderId', updateOrder);
router.delete('/api/orders/:orderId', deleteOrder);

export default router;



