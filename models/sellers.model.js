import mongoose from "mongoose";

const sellerSchema = mongoose.Schema({
    full_name: {
        type: String,
        required: true,
    },
    email:{
        type: String,
        required: true,
    },
    phone_number:{
        type: String,
        required: true,
    },
    company: {
        type: String,
        required: false,
    },
    country: {
        type: String,
        required: true,
    },
    plan: {
        type: String,
        required: true,
    },
},
{
    timestamps: true
}
);

const Seller = mongoose.model("Sellers", sellerSchema);
export default Seller;