import mongoose from "mongoose";

const productSchema = mongoose.Schema({
    // Basic Product Information
    productTitle: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: false,
    },
    productSku: {
        type: String,
        required: true,
        unique: true,
    },
    productBarcode: {
        type: String,
        required: false,
    },
    
    // Images/Media
    images: [{
        type: String, // URLs to uploaded images
    }],
    
    // Variants - Updated to support flexible variant system
    variants: [{
        type: {
            type: String, // variant type like "Size", "Color", "Material", etc.
        },
        values: [{
            type: String // array of values like ["Small", "Medium", "Large"]
        }],
        // Backwards compatibility with old format
        option: {
            type: String, // old format
        },
        value: {
            type: String, // old format
        }
    }],
    
    // Inventory
    quantity: {
        type: Number,
        default: 0,
    },
    inStock: {
        type: Boolean,
        default: true,
    },
    
    // Shipping
    shippingType: {
        type: String,
        enum: ['seller', 'company'],
        default: 'company',
    },
    
    // Global Delivery
    globalDelivery: {
        type: String,
        enum: ['worldwide', 'selected-countries', 'local'],
        default: 'local',
    },
    selectedCountries: [{
        type: String,
    }],
    
    // Attributes
    attributes: {
        fragile: {
            type: Boolean,
            default: false,
        },
        biodegradable: {
            type: Boolean,
            default: false,
        },
        frozen: {
            type: Boolean,
            default: false,
        },
        maxTemperature: {
            type: Number, // in Celsius
        },
        hasExpiryDate: {
            type: Boolean,
            default: false,
        },
        expiryDate: {
            type: Date,
        }
    },
    
    // Advanced
    productIdType: {
        type: String,
        enum: ['ISBN', 'UPC', 'EAN', 'JAN'],
    },
    productId: {
        type: String,
    },
    
    // Pricing
    productPrice: {
        type: Number,
        required: true,
    },
    productDiscountedPrice: {
        type: Number,
    },
    chargeTax: {
        type: Boolean,
        default: true,
    },
    
    // Organization
    vendor: {
        type: String,
    },
    category: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['Published', 'Scheduled', 'Inactive'],
        default: 'Published',
    },
    tags: [{
        type: String,
    }],
}, {
    timestamps: true, // adds createdAt and updatedAt fields
});

const Product = mongoose.model("Product", productSchema);

export default Product;