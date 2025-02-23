const express = require("express");
const router = express.Router();
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { client2 } = require("../constants");

router.use(cors());
router.use(express.json()); // Add this line to parse JSON bodies

router.get("/:id", async (req, res) => {
  // res.send("From submit forms");
  const { id } = req.params;

  const collection = await client2.db("forevision-digital").collection(id);
  const data = await collection.find({}).toArray();

  res.send(data);
});

router.post("/", async (req, res) => {
  try {
    // console.log(req.body);
    const formData = req.body; // Form data
    // console.log("Received form data:", formData);

    // If you have additional custom handling for certain conditions, add it here
    // Example: Handle 'video-distribution' type fields
    // if (formData.id === "video-distribution") {
    //   console.log(
    //     "Video Distribution Content Type:",
    //     formData.video_distribution_content_type
    //   );
    // }

    const { id, ...dataToInsert } = formData;

    delete formData.id;
    // console.log(id, formData);
    const collection = await client2.db("forevision-digital").collection(id);

    const insertCursor = await collection.insertOne(dataToInsert);

    res.json(insertCursor);
  } catch (error) {
    console.error("Error while handling form submission:", error);
    res.status(500).json({ success: false, message: "Error submitting form" });
  }
});

module.exports = router;
