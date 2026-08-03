import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    assistantName: {
      type: String,
    },
    assistantImage: {
      type: String,
    },
    history: [{ type: String }],
  },
  { timestamps: true },
);

const UserModel = mongoose.model("User", userSchema);
const memoryUsers = [];

const isDatabaseConnected = () => mongoose.connection.readyState === 1;

const findOne = async (query = {}) => {
  if (!isDatabaseConnected()) {
    return (
      memoryUsers.find((user) =>
        Object.entries(query).every(([key, value]) => user[key] === value),
      ) || null
    );
  }

  return UserModel.findOne(query);
};

const create = async (data) => {
  if (!isDatabaseConnected()) {
    const user = {
      ...data,
      _id: new mongoose.Types.ObjectId().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memoryUsers.push(user);
    return user;
  }

  return UserModel.create(data);
};

const User = {
  findOne,
  create,
};

export default User;