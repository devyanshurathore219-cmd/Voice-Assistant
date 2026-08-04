import User from "../models/user.models.js";

export const getCurrentUser = async (req, res) => {
  try {
    const userId = req.userId;

    const user = await User.findOne({ _id: userId });

    if (!user) {
      return res.status(400).json({
        message: "user not found",
      });
    }

    const { password, ...userData } = user;

    return res.status(200).json(userData);
  } catch (error) {
    console.log(error);

    return res.status(400).json({
      message: "get current user error",
    });
  }
};
