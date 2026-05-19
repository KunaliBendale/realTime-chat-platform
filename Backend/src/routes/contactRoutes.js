import express from "express";
import { createContact, getMyContacts } from "../controllers/contactController.js";
import { protect } from "../middleware/authMiddleware.js";

const contactRoutes = express.Router();

contactRoutes.get("/", protect, getMyContacts);
contactRoutes.post("/", protect, createContact);

export default contactRoutes;
