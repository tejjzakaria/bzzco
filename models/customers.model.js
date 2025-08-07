import mongoose from "mongoose";

const customerSchema = mongoose.Schema({
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

const Customer = mongoose.model("Customers", customerSchema);
export default Customer;