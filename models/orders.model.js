import mongoose from "mongoose";


const orderSchema = mongoose.Schema({
    order_number: {
        type: String,
        required: true,
        unique: true,
    },
    // Customer information - supports both registered and guest customers
    customer_type: {
        type: String,
        enum: ['registered', 'guest'],
        required: true,
    },
    customer_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customers',
        required: function() {
            return this.customer_type === 'registered';
        },
    },
    // Guest customer fields
    guest_name: {
        type: String,
        required: function() {
            return this.customer_type === 'guest';
        },
    },
    guest_email: {
        type: String,
        required: function() {
            return this.customer_type === 'guest';
        },
    },
    guest_phone: {
        type: String,
        required: false,
    },
    products: [{ // Array of products
        product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Products', required: true },
        quantity: { type: Number, required: true, min: 1 },
        unit_price: { type: Number, required: true, min: 0 },
        total_price: { type: Number, required: true, min: 0 }
    }],
    total_price: {
        type: Number,
        required: true,
        min: 0,
    },
    status: {
        type: String,
        default: 'Pending',
    },
    // Shipping address with separate fields
    shipping_address: {
        street: { type: String, required: true },
        city: { type: String, required: true },
        postal_code: { type: String, required: true },
        country: { type: String, required: true }
    },
    // Billing address with separate fields
    billing_address: {
        street: { type: String, required: true },
        city: { type: String, required: true },
        postal_code: { type: String, required: true },
        country: { type: String, required: true }
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