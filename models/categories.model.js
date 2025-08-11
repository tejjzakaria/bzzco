import mongoose from "mongoose";

const categorySchema = mongoose.Schema({
    name:{
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: false,
    },
    status: {
        type: String,
        required: true,
        enum: ["active", "inactive"],
        default: "active"
    },
},
{
    timestamps: true
}
);

const Category = mongoose.model("Categories", categorySchema);
export default Category;