const express = require("express");
const multer = require("multer");
const { authMiddleware } = require("../middleware/authMiddleware");
const { getAllUsers, getUser } = require("../controller/user-controller");
const { uploadProfileImage } = require("../controller/auth-controller");

const userRouter = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ dest: "uploads/" });
userRouter.route("/users").get(authMiddleware, getAllUsers);
userRouter.route("/login/:user").get(authMiddleware, getUser);

userRouter.route("/upload-profile-image").put(uploadProfileImage);
module.exports = { userRouter };
