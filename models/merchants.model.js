import mongoose from 'mongoose';

const merchantSchema = new mongoose.Schema({
    name: { type: String, required: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    logo: { type: String, default: '' },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
}, { timestamps: true });

const Merchant = mongoose.model('Merchant', merchantSchema);
export default Merchant;
