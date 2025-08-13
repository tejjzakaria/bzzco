import Order from "../models/orders.model.js";
import Product from "../models/products.model.js";
import Customer from "../models/customers.model.js";


const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find()
            .populate('customer_id', 'full_name email')
            .populate({
                path: 'products.product_id',
                select: 'productTitle productPrice'
            })
            .sort({ createdAt: -1 });
        res.status(200).json(orders);
    } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

const addOrder = async (req, res) => {
    const { 
        order_number, 
        customer_id, 
        customer_type,
        guest_name,
        guest_email,
        guest_phone,
        products, 
        total_price, 
        status,
        shipping_address, 
        billing_address, 
        payment_method,
        payment_status
    } = req.body;

    // Validate required fields
    if (!order_number || !products || !products.length || !total_price || !shipping_address || !billing_address) {
        return res.status(400).json({ message: "All fields are required" });
    }

    // Validate customer information
    if (customer_type === 'guest') {
        if (!guest_name || !guest_email) {
            return res.status(400).json({ message: "Guest name and email are required for guest customers" });
        }
    } else if (customer_type === 'registered') {
        if (!customer_id) {
            return res.status(400).json({ message: "Customer ID is required for registered customers" });
        }
    } else {
        return res.status(400).json({ message: "Customer type must be either 'guest' or 'registered'" });
    }

    try {
        // Create order data
        const orderData = {
            order_number,
            products,
            total_price,
            status: status || 'Pending',
            shipping_address,
            billing_address,
            payment_method,
            payment_status: payment_status || 'Unpaid'
        };

        // Add customer information based on type
        if (customer_type === 'guest') {
            orderData.customer_type = 'guest';
            orderData.guest_name = guest_name;
            orderData.guest_email = guest_email;
            orderData.guest_phone = guest_phone;
        } else {
            orderData.customer_type = 'registered';
            orderData.customer_id = customer_id;
        }

        const newOrder = new Order(orderData);
        await newOrder.save();
        
        res.status(201).json({ message: "Order created successfully", order: newOrder });
    } catch (error) {
        console.error("Error adding order:", error);
        if (error.code === 11000) {
            res.status(400).json({ message: "Order number already exists" });
        } else {
            res.status(500).json({ message: "Internal server error" });
        }
    }
}

const updateOrder = async (req, res) => {
    const { orderId } = req.params;
    const { 
        status, 
        payment_status, 
        payment_method,
        products,
        total_price,
        shipping_address,
        billing_address
    } = req.body;

    try {
        // Validate required fields
        if (!products || !products.length || !total_price || !shipping_address || !billing_address) {
            return res.status(400).json({ 
                message: "Products, total price, and addresses are required",
                success: false 
            });
        }

        // Validate products array
        for (let i = 0; i < products.length; i++) {
            const product = products[i];
            if (!product.product_id || !product.quantity || !product.unit_price) {
                return res.status(400).json({ 
                    message: `Product at index ${i} is missing required fields`,
                    success: false 
                });
            }
            
            // Convert to numbers
            product.quantity = parseInt(product.quantity);
            product.unit_price = parseFloat(product.unit_price);
            
            if (product.quantity <= 0 || product.unit_price <= 0) {
                return res.status(400).json({ 
                    message: `Product at index ${i} has invalid quantity or price`,
                    success: false 
                });
            }
        }

        // Validate that the order exists
        const existingOrder = await Order.findById(orderId);
        if (!existingOrder) {
            return res.status(404).json({ 
                message: "Order not found",
                success: false 
            });
        }

        // Update the order
        const updatedOrder = await Order.findByIdAndUpdate(
            orderId,
            { 
                status, 
                payment_status,
                payment_method,
                products,
                total_price: parseFloat(total_price),
                shipping_address,
                billing_address,
                updatedAt: new Date()
            },
            { new: true, runValidators: true }
        ).populate('customer_id', 'full_name email phone_number')
         .populate({
             path: 'products.product_id',
             select: 'productTitle productPrice productSku'
         });

        console.log(`Order ${orderId} updated successfully`);
        
        res.status(200).json({ 
            message: "Order updated successfully",
            order: updatedOrder,
            success: true 
        });
    } catch (error) {
        console.error("Error updating order:", error);
        res.status(500).json({ 
            message: "Internal server error",
            success: false 
        });
    }
}

const deleteOrder = async (req, res) => {
    const { orderId } = req.params;

    try {
        const deletedOrder = await Order.findByIdAndDelete(orderId);
        if (!deletedOrder) {
            return res.status(404).json({ message: "Order not found" });
        }
        res.status(200).json({ message: "Order deleted successfully" });
    } catch (error) {
        console.error("Error deleting order:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

const getOrderById = async (req, res) => {
    const { orderId } = req.params;

    try {
        const order = await Order.findById(orderId)
            .populate('customer_id', 'full_name email phone_number')
            .populate({
                path: 'products.product_id',
                select: 'productTitle productPrice productSku category'
            });
        
        if (!order) {
            return res.status(404).json({ message: "Order not found", success: false });
        }
        
        res.status(200).json({ order: order, success: true });
    } catch (error) {
        console.error("Error fetching order:", error);
        res.status(500).json({ message: "Internal server error", success: false });
    }
}

const bulkDeleteOrders = async (req, res) => {
    const { orderIds } = req.body;

    try {
        // Validate input
        if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
            return res.status(400).json({ 
                message: "Order IDs array is required and cannot be empty",
                success: false 
            });
        }

        // Validate each order ID format (basic MongoDB ObjectId validation)
        const invalidIds = orderIds.filter(id => !id || typeof id !== 'string' || id.length !== 24);
        if (invalidIds.length > 0) {
            return res.status(400).json({ 
                message: "Invalid order ID format detected",
                success: false 
            });
        }

        console.log(`Attempting to delete ${orderIds.length} orders: ${orderIds.join(', ')}`);

        // Delete multiple orders
        const deleteResult = await Order.deleteMany({
            _id: { $in: orderIds }
        });

        console.log(`Bulk delete result: ${deleteResult.deletedCount} orders deleted`);

        if (deleteResult.deletedCount === 0) {
            return res.status(404).json({ 
                message: "No orders found to delete",
                success: false 
            });
        }

        res.status(200).json({ 
            message: `Successfully deleted ${deleteResult.deletedCount} order(s)`,
            deletedCount: deleteResult.deletedCount,
            success: true 
        });
    } catch (error) {
        console.error("Error in bulk delete orders:", error);
        res.status(500).json({ 
            message: "Internal server error",
            success: false 
        });
    }
}

export {
    getAllOrders,
    addOrder,
    updateOrder,
    deleteOrder,
    getOrderById,
    bulkDeleteOrders
};

