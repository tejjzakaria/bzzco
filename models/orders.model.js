import mongoose from "mongoose";


const orderSchema = mongoose.Schema({
    order_number: {
        type: String,
        required: true,
        unique: true,
    },
    customer_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customers',
        required: true,
    },
    product_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Products',
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
    },
    total_price: {
        type: Number,
        required: true,
        min: 0,
    },
    status: {
        type: String,
        default: 'Pending',
    },
    shipping_address: {
        type: String,
        required: true,
    },
    billing_address: {
        type: String,
        required: true,
    },
    payment_method: {
        type: String,
        required: false,
    },
    payment_status: {
        type: String,
        default: 'Unpaid',
    },
},
{
    timestamps: true,
}
);

const Order = mongoose.model("Orders", orderSchema);
export default Order;