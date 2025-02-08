const express = require("express");
const router = express.Router();
const path = require("path");

router.get("/:filename", async (req, res) => {
  const { filename } = req.params;
  // //   console.log(
  //     __dirname
  //       .split("/")
  //       .slice(0, __dirname.split("/").length - 1)
  //       .join("/")
  //   );

  const directoryPath = path.join(
    __dirname
      .split("/")
      .slice(0, __dirname.split("/").length - 1)
      .join("/"),
    "/uploads/gst-certificates"
  );

  const filePath = path.join(directoryPath, filename);

  // Optional: Insert any logic here, e.g., authentication or database checks

  res.sendFile(filePath, (err) => {
    if (err) {
      // Handle errors, e.g., file not found
      // console.log(err);
      res.status(404).send("File not found.");
    }
  });
});

module.exports = router;
