const bcrypt = require("bcryptjs");
const { userModel } = require("../model/userModel");

const register = async (req, res) => {
  const userInfo = req.body;

  if (!userInfo.name || !userInfo.email || !userInfo.password) {
    return res.status(400).json({ response: "All fields are required!" });
  }

  try {
    const { email, password, name } = userInfo;
    // const appWriteUser = await account.create(
    //   "unique()",
    //   email,
    //   password,
    //   name
    // );
    const doesExist = await userModel.findOne({ email: userInfo.email });
    if (doesExist) {
      return res.status(400).json({
        response: "Email already registered, Please Login!",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userInfo.password, salt);

    const user = {
      name: userInfo.name,
      email: userInfo.email,
      password: hashedPassword,
      // appWriteId: appWriteUser.$id,
    };

    await userModel.create(user);

    res.status(201).json({ response: "Registered Successfully" });
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).json({
      response: "Internal Server Error. Please try again later.",
    });
  }
};

const login = async (req, res) => {
  console.log("2");
  const userInfo = req.body;
  try {
    const user = await userModel.findOne({ email: userInfo.email });
    if (!user) {
      return res.status(400).json({ response: "Invalid Credential/s" });
    }

    let correctPass = user.validatePassword(userInfo.password);

    if (!correctPass) {
      return res.status(400).json({ response: "Invalid Credential/s" });
    }
    const token = await user.generateToken();

    const newUser = {
      _id: user._id,
      name: user.name,
      email: user.email,
    };

    res.status(200).json({ user: newUser, token });
  } catch (error) {
    res.status(500).json({ response: `Internal Server Error:${error}` });
  }
};

const user = async (req, res) => {
  console.log("3");
  try {
    const user = req.user;

    const findUser = await userModel.findOne({ email: user.email });
    res.status(200).json({ findUser });
  } catch (error) {
    res.status(400).json(`Error: ${error}`);
  }
};

const uploadProfileImage = async (req, res) => {
  // // The uploaded file from form
  // const { email, responseId } = req.body; // The email to associate with the profile image
  // try {
  //   // Upload the file to Appwrite Storage
  //   // const response = await storage.createFile(
  //   //   process.env.AppWriteBuckedId,
  //   //   file.filename,
  //   //   fs.createReadStream(file.path)
  //   // );
  //   // Get the file URL from Appwrite
  //   const fileUrl = `${process.env.APPWRITE_ENDPOINT}/v1/storage/buckets/${process.env.APPWRITE_BUCKET_ID}/files/${responseId}/view`;
  //   // Find user by email and update profile image URL
  //   const user = await userModel.findOne({ email });
  //   if (!user) {
  //     return res.status(404).json({ error: "User not found" });
  //   }
  //   // Update the user's profile image URL
  //   user.profileImage = fileUrl;
  //   await user.save();
  //   // Respond with success and file URL
  //   res.status(200).json({
  //     message: "Profile image uploaded successfully",
  //     fileUrl: fileUrl, // Send back the image URL
  //   });
  // } catch (error) {
  //   console.error("Error uploading file to Appwrite:", error);
  //   res.status(500).json({ error: "Failed to upload image" });
  // }
};

module.exports = {
  register,
  login,
  user,
  uploadProfileImage,
};
