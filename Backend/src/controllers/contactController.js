import Contact from "../models/contactModel.js";
import User from "../models/userModel.js";

const normalizeMobile = (mobile = "") => mobile.toString().replace(/\D/g, "").slice(-10);

const contactPopulateOptions = {
  path: "contactUser",
  select: "name email mobile profilePic status",
};

const serializeContact = (contact) => {
  const contactObject = contact.toObject ? contact.toObject() : contact;
  const linkedUser = contactObject.contactUser;

  return {
    _id: contactObject._id,
    id: contactObject._id,
    name: contactObject.displayName,
    displayName: contactObject.displayName,
    mobile: contactObject.mobile,
    userId: linkedUser?._id || null,
    user: linkedUser || null,
    email: linkedUser?.email || "",
    profilePic: linkedUser?.profilePic || "",
    status: linkedUser?.status || "inactive",
    isRegistered: Boolean(linkedUser?._id),
    createdAt: contactObject.createdAt,
    updatedAt: contactObject.updatedAt,
  };
};

export const getMyContacts = async (req, res) => {
  try {
    const contacts = await Contact.find({ owner: req.user._id })
      .sort({ updatedAt: -1 })
      .populate(contactPopulateOptions);

    res.status(200).json(contacts.map(serializeContact));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createContact = async (req, res) => {
  try {
    const displayName = req.body.name || req.body.displayName;
    const mobile = normalizeMobile(req.body.mobile);

    if (!displayName?.trim()) {
      return res.status(400).json({ message: "Contact name is required" });
    }

    if (mobile.length !== 10) {
      return res.status(400).json({ message: "A valid 10 digit mobile number is required" });
    }

    if (req.user.mobile === mobile) {
      return res.status(400).json({ message: "You cannot add yourself as a contact" });
    }

    const linkedUser = await User.findOne({ mobile }).select(
      "name email mobile profilePic status",
    );

    const contact = await Contact.findOneAndUpdate(
      {
        owner: req.user._id,
        mobile,
      },
      {
        owner: req.user._id,
        displayName: displayName.trim(),
        mobile,
        contactUser: linkedUser?._id || null,
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    ).populate(contactPopulateOptions);

    res.status(201).json(serializeContact(contact));
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Contact already exists" });
    }

    res.status(500).json({ message: error.message });
  }
};
