const express = require("express");
const { getCollections } = require("../constants");
const verifyJWT = require("../verifyJWT");
const router = express.Router();
const jwt = require("jsonwebtoken");

router.post("/", async (req, res) => {
  const { cutPercentages } = await getCollections();

  //   const insertCursor = await cutPercentages.insertOne(req.body);
  //   res.send(insertCursor);
  const found = await cutPercentages.findOne({ isrc: req.body.isrc });

  //   let cursor = {};

  //   if (found !== null) {
  const { _id } = found;

  //   console.log(_id, req.body);
  const cursor = await cutPercentages.updateOne(
    { _id },
    { $set: req.body },
    { upsert: true }
  );

  res.send(cursor);
  //   }

  // //   console.log(found);
});

router.get("/:isrc", async (req, res) => {
  const { cutPercentages } = await getCollections();
  const { isrc } = req.params;

  const cuts = await cutPercentages.findOne({ isrc });

  res.send(cuts);
});

module.exports = router;
