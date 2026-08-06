import User from "../models/user.models.js";
import uploadOnCloudinary from "../config/cloudinary.js";

// ===============================
// Get Current User
// ===============================
export const getCurrentUser = async (req, res) => {
  try {
    const userId = req.userId;

    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(400).json({
        message: "User not found",
      });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.log(error);

    return res.status(400).json({
      message: "Get current user error",
    });
  }
};

// ===============================
// Update Assistant
// ===============================
export const updateAssistant = async (req, res) => {
  try {
    const { assistantName, imageUrl } = req.body;

    let assistantImage;

    // If user uploads a custom image
    if (req.file) {
      assistantImage = await uploadOnCloudinary(req.file.path);
    } else {
      // Otherwise use selected predefined image
      assistantImage = imageUrl;
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      {
        assistantName,
        assistantImage,
      },
      {
        new: true,
      },
    ).select("-password");

    return res.status(200).json(user);
  } catch (error) {
    console.log(error);

    return res.status(400).json({
      message: "updateAssistantError",
    });
  }
};
