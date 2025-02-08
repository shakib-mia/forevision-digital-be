const express = require("express");
const router = express.Router();
const { getCollections } = require("../constants");
const verifyJWT = require("../verifyJWT");
const jwt = require("jsonwebtoken");

router.get("/", async (req, res) => {
  const { isrcCollection } = await getCollections();
  const isrcCursor = await isrcCollection.find({}).toArray();
  res.send(isrcCursor);
});

router.put("/", async (req, res) => {
  const { isrc, count } = req.body;
  const { isrcCollection } = await getCollections();
  // //   console.log(isrc, count);

  //   res.send({ isrc });

  const options = {
    upsert: true,
  };

  const filter = {
    isrc,
  };

  const updatedDoc = {
    $set: {
      revenue: count,
    },
  };

  const updateCursor = await isrcCollection.updateOne(
    filter,
    updatedDoc,
    options
  );

  res.send(updateCursor);
});

module.exports = router;
