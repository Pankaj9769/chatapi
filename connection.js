const mongoose = require("mongoose");

const connect = () => {
  mongoose
    .connect(process.env.URI)
    .then(() => {
      console.log("DB connected");
    })
    .catch((err) => {
      console.log(`Error: ${err}`);
    });
};

module.exports = { connect };
