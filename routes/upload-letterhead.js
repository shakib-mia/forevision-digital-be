const express = require("express");
const router = express.Router();
const verifyJWT = require("../verifyJWT"); // Ensure correct path
const multer = require("multer");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const path = require("path");

// Ensure the upload directory exists
const uploadDir = path.join(__dirname, "../uploads/letterheads/");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Set the upload destination directory
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const { token } = req.headers;

    // Decode the JWT to get the user's email
    const { email } = jwt.decode(token);

    // Sanitize and format the filename
    const sanitizedFilename = file.originalname
      .split(".")[0]
      .replace(/[^a-zA-Z0-9-_]/g, "-"); // Replace any non-alphanumeric characters with dashes

    const extension = path.extname(file.originalname);
    const timestamp = Date.now();
    const emailPrefix = email.split("@")[0];

    const newFilename = `${sanitizedFilename}-${emailPrefix}-${timestamp}${extension}`;

    cb(null, newFilename);
  },
});

const upload = multer({ storage: storage });

router.use("/uploads/letterheads", express.static(uploadDir));

router.post("/", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).send({ error: "No file uploaded" });
  }

  const filePath = path.join("/uploads/letterheads", req.file.filename);

  //   console.log(req.file);
  res.send({
    url: `${req.protocol}://${req.get("host")}${filePath}`,
  });
});

module.exports = router;
