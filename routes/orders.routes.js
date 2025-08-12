import express from 'express';


import {getAllOrders,
    addOrder,
    updateOrder,
    deleteOrder,
    getOrderById} from '../controllers/orders.controller.js';


const router = express.Router();


router.get('/api/orders', getAllOrders);
router.get('/api/orders/:orderId', getOrderById);

router.post('/api/orders', addOrder);

router.put('/api/orders/:orderId', updateOrder);

router.delete('/api/orders/:orderId', deleteOrder);


export default router;
// Debug: Test if this route file is loaded
console.log("Orders routes file loaded!");



