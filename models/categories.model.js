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
    icon: {
        type: String, // S3 URL to SVG icon
        required: false
    }
},
{
    timestamps: true
}
);

const Category = mongoose.model("Category", categorySchema);
export default Category;