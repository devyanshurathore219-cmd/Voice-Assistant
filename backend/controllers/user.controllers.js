import User, { UserModel } from "../models/user.models.js";
import uploadOnCloudinary from "../config/cloudinary.js";
import geminiResponse from "../gemini.js";
import moment from "moment";

// =====================================
// Get Current User
// =====================================

export const getCurrentUser = async (req, res) => {
  try {
    const userId = req.userId;

    let user;

    if (User && typeof User.findById === "function") {
      user = await User.findById(userId).select("-password");
    } else if (UserModel && typeof UserModel.findById === "function") {
      user = await UserModel.findById(userId).select("-password");
    } else {
      throw new Error("No User Model Found");
    }

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

// =====================================
// Update Assistant
// =====================================

export const updateAssistant = async (req, res) => {
  try {

    const { assistantName, imageUrl } = req.body;

    let assistantImage = imageUrl;

    if (req.file) {
      assistantImage = await uploadOnCloudinary(req.file.path);
    }

    let user;

    if (User && typeof User.findByIdAndUpdate === "function") {

      user = await User.findByIdAndUpdate(
        req.userId,
        {
          assistantName,
          assistantImage,
        },
        {
          new: true,
        }
      );

    } else if (
      UserModel &&
      typeof UserModel.findByIdAndUpdate === "function"
    ) {

      user = await UserModel.findByIdAndUpdate(
        req.userId,
        {
          assistantName,
          assistantImage,
        },
        {
          new: true,
        }
      );

    } else {

      throw new Error("No User Model Found");

    }

    if (!user) {
      return res.status(400).json({
        message: "User not found",
      });
    }

    return res.status(200).json(user);

  } catch (error) {

    console.log(error);

    return res.status(400).json({
      message: "updateAssistantError",
    });

  }
};

// =====================================
// Ask To Assistant
// =====================================

export const askToAssistant = async (req, res) => {

  try {

    const { command } = req.body;

    let user;

    if (User && typeof User.findById === "function") {
      user = await User.findById(req.userId);
    } else if (
      UserModel &&
      typeof UserModel.findById === "function"
    ) {
      user = await UserModel.findById(req.userId);
    } else {
      throw new Error("No User Model Found");
    }

    if (!user) {
      return res.status(400).json({
        response: "User not found",
      });
    }

    const userName = user.name;
    const assistantName = user.assistantName;

    const result = await geminiResponse(
      command,
      userName,
      assistantName
    );

    const jsonMatch = result.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      return res.status(400).json({
        response: "Sorry, I can't understand.",
      });
    }

    const gemResult = JSON.parse(jsonMatch[0]);

    const type = gemResult.type;

    switch (type) {

      // ==========================
      // Date
      // ==========================

      case "get-date":
        return res.json({
          type,
          userInput: gemResult.userInput,
          response: `Current date is ${moment().format("YYYY-MM-DD")}`,
        });

      // ==========================
      // Time
      // ==========================

      case "get-time":
        return res.json({
          type,
          userInput: gemResult.userInput,
          response: `Current time is ${moment().format("hh:mm A")}`,
        });

      // ==========================
      // Day
      // ==========================

      case "get-day":
        return res.json({
          type,
          userInput: gemResult.userInput,
          response: `Today is ${moment().format("dddd")}`,
        });

      // ==========================
      // Month
      // ==========================

      case "get-month":
        return res.json({
          type,
          userInput: gemResult.userInput,
          response: `Current month is ${moment().format("MMMM")}`,
        });

      // ==========================
      // General Commands
      // ==========================

      case "google_search":
      case "youtube_search":
      case "youtube_play":
      case "general":
      case "calculator_open":
      case "instagram_open":
      case "facebook_open":
      case "weather-show":

        return res.json({
          type,
          userInput: gemResult.userInput,
          response: gemResult.response,
        });

      default:

        return res.status(400).json({
          response: "I didn't understand that command.",
        });

    }

  } catch (error) {

    console.log(error);

    return res.status(500).json({
      response: "Ask assistant error",
    });

  }
};