export const aiDebug = (...args) => {
  if (process.env.AI_DEBUG === "true") {
    console.log("[AI]", ...args);
  }
};
