import mongoose from 'mongoose';

const pageSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    content: {
        type: String,
        required: true
    },
    metaDescription: {
        type: String,
        trim: true,
        maxlength: 160
    },
    metaKeywords: {
        type: [String],
        default: []
    },
    status: {
        type: String,
        enum: ['published', 'draft', 'archived'],
        default: 'draft'
    },
    pageType: {
        type: String,
        enum: ['legal', 'help', 'general'],
        default: 'general'
    },
    order: {
        type: Number,
        default: 0
    },
    isInMenu: {
        type: Boolean,
        default: false
    },
    template: {
        type: String,
        enum: ['default', 'sidebar', 'full-width'],
        default: 'default'
    }
}, {
    timestamps: true
});

// Create index for faster slug lookups
pageSchema.index({ slug: 1 });
pageSchema.index({ status: 1 });

const Page = mongoose.model('Page', pageSchema);
export default Page;
