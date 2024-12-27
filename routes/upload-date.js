const express = require("express");
const nodemailer = require("nodemailer");
const { getCollections, client } = require("../constants");
const { ObjectId } = require("mongodb");
const router = express.Router();

router.get("/", async (req, res) => {
  const { uploadDate } = await getCollections();
  const latestDate = await uploadDate.findOne({});
  console.log(latestDate);

  res.send(latestDate);
});

router.put("/", async (req, res) => {
  const { uploadDate } = await getCollections();
  const latestDate = await uploadDate.findOne({});
  //   console.log(latestDate);
  const { _id } = latestDate;
  const updateCursor = await uploadDate.updateOne(
    { _id },
    { $set: req.body },
    { upsert: false }
  );

  res.send(updateCursor);
});

module.exports = router;
