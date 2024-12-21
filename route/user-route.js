const express = require("express");
const { authMiddleware } = require("../middleware/authMiddleware");
const { getAllUsers, getUser } = require("../controller/user-controller");

const userRouter = express.Router();

userRouter.route("/users").get(authMiddleware, getAllUsers);
userRouter.route("/login/:user").get(authMiddleware, getUser);
// userRouter.route("/user").get(authMiddleware, user);

module.exports = { userRouter };
