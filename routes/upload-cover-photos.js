const express = require("express");
const router = express.Router();
const multer = require("multer");
const fs = require("fs");
const jwt = require("jsonwebtoken");

// Ensure the directory exists before setting up the multer storage
const uploadDir = "uploads/cover-photos/";
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Now that the directory is guaranteed to exist, we can set it as the destination
    cb(null, uploadDir);
  },

  filename: function (req, file, cb) {
    const { authorization } = req.headers;
    const { email } = jwt.decode(authorization);

    cb(
      null,
      file.fieldname +
        "-" +
        email.split("@")[0] +
        "-" +
        Date.now() +
        "-" +
        file.originalname.split(" ").join("-")
    );
  },
});

const upload = multer({ storage: storage });

router.use("/uploads/cover-photos", express.static("uploads/cover-photos"));

router.post("/", upload.single("file"), async (req, res) => {
  // //   console.log(req.file);
  res.send({ url: `${req.protocol}://${req.get("host")}/${req.file?.path}` });
});

module.exports = router;
