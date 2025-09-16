import mongoose from 'mongoose';

const JobApplicationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  cvUrl: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const JobApplication = mongoose.models.JobApplication || mongoose.model('JobApplication', JobApplicationSchema);
export default JobApplication;
