import mongoose from 'mongoose';

const teamSchema = new mongoose.Schema({
    name: { type: String, required: true },
    role: { type: String, required: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    email: { type: String, required: true },
    linkedin: { type: String, required: false },
    image: { type: String, required: false } // S3 image URL
}, { timestamps: true });

const Team = mongoose.model('Team', teamSchema);
export default Team;
