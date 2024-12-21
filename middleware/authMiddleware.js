const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  const userToken = req.headers["authorization"].split(" ")[1];
  console.log(`token middle->>>> ${userToken}`);
  try {
    const user = jwt.verify(userToken, process.env.JWT_KEY);

    req.user = user;

    next();
  } catch (err) {
    console.log("jwt error->" + err);
    res.status(400).json({ response: `Error: ${err}` });
  }
};

module.exports = { authMiddleware };
