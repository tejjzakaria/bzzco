import Order from "../models/orders.model.js";


const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find().populate('customer_id', 'full_name email').populate('product_id', 'name price');
        res.status(200).json(orders);
    } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

const addOrder = async (req, res) => {
    const { order_number, customer_id, product_id, quantity, total_price, shipping_address, billing_address, payment_method } = req.body;

    if (!order_number || !customer_id || !product_id || !quantity || !total_price || !shipping_address || !billing_address) {
        return res.status(400).json({ message: "All fields are required" });
    }

    try {
        const newOrder = new Order({
            order_number,
            customer_id,
            product_id,
            quantity,
            total_price,
            shipping_address,
            billing_address,
            payment_method
        });

        await newOrder.save();
        res.status(201).json(newOrder);
    } catch (error) {
        console.error("Error adding order:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

const updateOrder = async (req, res) => {
    const { orderId } = req.params;
    const { status, payment_status } = req.body;

    try {
        const updatedOrder = await Order.findByIdAndUpdate(
            orderId,
            { status, payment_status },
            { new: true }
        );
        if (!updatedOrder) {
            return res.status(404).json({ message: "Order not found" });
        }
        res.status(200).json(updatedOrder);
    } catch (error) {
        console.error("Error updating order:", error);
        res.status(500).json({ message: "Internal server error" });
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
        const order = await Order.findById(orderId).populate('customer_id', 'full_name email').populate('product_id', 'name price');
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }
        res.status(200).json(order);
    } catch (error) {
        console.error("Error fetching order:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export {
    getAllOrders,
    addOrder,
    updateOrder,
    deleteOrder,
    getOrderById
};

