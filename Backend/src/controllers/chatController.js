import Chat from "../models/chatModel.js";


export const accessChat = async (req, res) => {
  try {
    const { userId } = req.body;

    console.log(req.user);
    let chat = await Chat.findOne({
      isGroupChat: false,
      users: {
        $all: [req.user._id, userId],
      },
    });

    if (chat) {
      return res.status(200).json(chat);
    }

    const createdChat = await Chat.create({
      chatName: "personal",
      isGroupChat: false,
      users: [req.user._id, userId],
    });

    res.status(201).json(createdChat);

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};