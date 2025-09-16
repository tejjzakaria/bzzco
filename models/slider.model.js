import mongoose from 'mongoose';

const sliderSchema = new mongoose.Schema({
  title: { type: String, required: true },
  subtitle: { type: String },
  offer: { type: String },
  image: { type: String, required: true },
  accent: { type: String },
  blue: { type: String },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  order: { type: Number, default: 0 },
  link: { type: String }
}, { timestamps: true });

const Slider = mongoose.model('Slider', sliderSchema);
export default Slider;
