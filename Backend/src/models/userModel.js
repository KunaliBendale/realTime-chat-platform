import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        mobile: true,
        unique: true,
        email: true,
        password: true,
        profilePic: true,
        status: {
            type: String,
            enum: ['active', 'inactive'],
            default: 'active'
        }
    },
},
    { timestamps: true }
);

export default mongoose.model("User", userSchema);
