import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    mobile: {
        type: String,
        min: 10, max: 10,
        required: true,
        unique: true,
    },
    email: {
        type: String,
        unique: true,
        required: true,
        match: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    },
    password: {
        type: String,
        required: true,
        min: 8,
        max: 20
    },
    profilePic: { type: String },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    }

},
    { timestamps: true }
);

export default mongoose.model("User", userSchema);
