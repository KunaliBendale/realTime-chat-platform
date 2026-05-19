import mongoose from "mongoose";

const contactSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    mobile: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 10,
    },
    contactUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true },
);

contactSchema.index({ owner: 1, mobile: 1 }, { unique: true });

export default mongoose.model("Contact", contactSchema);
