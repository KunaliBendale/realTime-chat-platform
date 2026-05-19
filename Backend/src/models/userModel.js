import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    mobile: {
        type: String,
        minlength: 10,
        maxlength: 10,
        required: function () {
            return !this.providers?.length;
        },
        unique: true,
        sparse: true,
    },
    email: {
        type: String,
        unique: true,
        required: true,
        match: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    },
    password: {
        type: String,
        required: function () {
            return !this.providers?.length;
        },
        minlength: 8,
        maxlength: 100,
        select: false,
    },
    profilePic: { type: String },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    providers: [
        {
            provider: {
                type: String,
            },

            providerId: {
                type: String,
            },
        },
    ],

},
    { timestamps: true }
);

export default mongoose.model("User", userSchema);
