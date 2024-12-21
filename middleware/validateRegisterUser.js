const { registerUserSchema } = require("./zod");

const validateRegisterUser = async (req, res, next) => {
  try {
    // console.log("here")
    const userData = req.body;
    req.body = await registerUserSchema.parseAsync(userData);
    console.log(userData);
    next();
  } catch (err) {
    res.status(400).json({
      response: err.issues[0].message,
    });
  }
};

module.exports = { validateRegisterUser };
