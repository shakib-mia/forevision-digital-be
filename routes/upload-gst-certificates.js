const express = require("express");
const router = express.Router();
const verifyJWT = require("../verifyJWT"); // Make sure to provide the correct path
const multer = require("multer");
const fs = require("fs");
const jwt = require("jsonwebtoken");

// Ensure the directory exists before setting up the multer storage
const uploadDir = "uploads/gst-certificates/";
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Now that the directory is guaranteed to exist, we can set it as the destination
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // console.log(req.headers);
    const { authorization } = req.headers;

    const { email } = jwt.decode(authorization);
    // console.log();

    cb(
      null,
      file.originalname.split(".")[0] +
        "-" +
        email.split("@")[0] +
        "-" +
        Date.now() +
        "." +
        file.originalname.split(".")[1]
    );
  },
});

const upload = multer({ storage: storage });

router.use(
  "/uploads/gst-certificates",
  express.static("uploads/gst-certificates")
);

router.post("/", upload.single("file"), async (req, res) => {
  res.send({ url: `${req.protocol}://${req.get("host")}/${req.file?.path}` });
});

module.exports = router;