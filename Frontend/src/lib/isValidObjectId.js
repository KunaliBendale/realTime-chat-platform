/** MongoDB ObjectId: 24 hex characters */
const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

export const isValidObjectId = (value) => {
  if (!value) return false;
  return OBJECT_ID_PATTERN.test(String(value).trim());
};
