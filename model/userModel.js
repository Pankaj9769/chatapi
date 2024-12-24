const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const userSchema = mongoose.Schema(
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
    // appWriteId: {
    //   type: String,
    // },
    // profileImage: {
    //   type: String,
    // },
    password: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.methods.generateToken = function () {
  const token = jwt.sign(
    { _id: this._id, email: this.email, appWriteId: this.appWriteId },
    process.env.JWT_KEY,
    { expiresIn: "1h" }
  );
  return token;
};

userSchema.methods.validatePassword = function (password) {
  const chkPass = bcrypt.compareSync(password, this.password);
  return chkPass;
};

const userModel = mongoose.model("ChatAppUser", userSchema);

module.exports = { userModel };
