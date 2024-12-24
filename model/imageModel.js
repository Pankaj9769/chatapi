const mongoose = require("mongoose");

// Define schema for file storage
const fileSchema = new mongoose.Schema({
  email: {
    type: String,
  },
  fileName: String,
  fileType: String,
  fileData: Buffer,
});

const File = mongoose.model("File", fileSchema);

// Upload route
