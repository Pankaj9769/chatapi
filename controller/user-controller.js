// import { userModel } from "../model/userModel";
const { userModel } = require("../model/userModel");

const getAllUsers = async (req, res) => {
  try {
    const users = await userModel.find().select("name");
    res.json({ users });
  } catch (err) {
    res.status(400).json({ response: err });
  }
};

const getUser = (req, res) => {
  const userId = req.params;
  try {
    const users = userModel.find({}).select("name");
  } catch (err) {
    res.status(400).json({ response: err });
  }
};

// const uploadImage = ;

module.exports = { getAllUsers, getUser };
