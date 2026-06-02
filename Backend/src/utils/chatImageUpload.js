import { uploadOnCloudinary } from "../middleware/cloudinaryMiddleware.js";

const MAX_IMAGE_BYTES = Number(process.env.CHAT_IMAGE_MAX_BYTES) || 4 * 1024 * 1024;
const DATA_URL_IMAGE_PATTERN = /^data:(image\/(?:png|jpe?g|webp|gif));base64,([a-z0-9+/=\s]+)$/i;
const CLOUDINARY_URL_PATTERN = /^https:\/\/res\.cloudinary\.com\/.+/i;

export const isCloudinaryImageUrl = (value) =>
  typeof value === "string" && CLOUDINARY_URL_PATTERN.test(value.trim());

export const uploadChatImage = async (imagePayload) => {
  if (!imagePayload) return null;

  if (isCloudinaryImageUrl(imagePayload)) {
    return imagePayload.trim();
  }

  if (typeof imagePayload !== "string") {
    const error = new Error("Invalid image payload");
    error.code = "INVALID_IMAGE";
    throw error;
  }

  const trimmedPayload = imagePayload.trim();
  const match = trimmedPayload.match(DATA_URL_IMAGE_PATTERN);

  if (!match) {
    const error = new Error("Invalid image format");
    error.code = "INVALID_IMAGE";
    throw error;
  }

  const base64Payload = match[2].replace(/\s/g, "");
  const estimatedBytes = Math.ceil((base64Payload.length * 3) / 4);

  if (estimatedBytes > MAX_IMAGE_BYTES) {
    const error = new Error("Image too large");
    error.code = "IMAGE_TOO_LARGE";
    throw error;
  }

  const uploadedImage = await uploadOnCloudinary(trimmedPayload, {
    folder: "realtime-chat/messages",
    resource_type: "image",
  });

  if (!uploadedImage?.secure_url) {
    const error = new Error("Image upload failed");
    error.code = "IMAGE_UPLOAD_FAILED";
    throw error;
  }

  return uploadedImage.secure_url;
};
