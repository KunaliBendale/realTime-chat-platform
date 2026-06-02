const MAX_CHAT_IMAGE_BYTES = 4 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

export const validateChatImageFile = (file) => {
  if (!file) return "Please select an image";

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return "Please select a PNG, JPG, WebP, or GIF image";
  }

  if (file.size > MAX_CHAT_IMAGE_BYTES) {
    return "Image size must be under 4MB";
  }

  return "";
};

export const readImageAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const validationError = validateChatImageFile(file);

    if (validationError) {
      reject(new Error(validationError));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Unable to read image"));
    reader.readAsDataURL(file);
  });
