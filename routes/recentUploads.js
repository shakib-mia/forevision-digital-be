const express = require("express");
const router = express.Router();
const { getCollections } = require("../constants");
const verifyJWT = require("../verifyJWT");
const jwt = require("jsonwebtoken");

router.get("/", verifyJWT, async (req, res) => {
  const { recentUploadsCollection, newSongs } = await getCollections();
  const { email } = jwt.decode(req.headers.token);
  // const recentUploads = await recentUploadsCollection
  //   .find({ userEmail: email })
  //   .toArray();
  const recentUploads = await recentUploadsCollection
    .find({ userEmail: email })
    .sort({ status: { $eq: "streaming" } ? -1 : 1 }) // Sort by "streaming" status first
    .toArray();

  res.send(recentUploads);
});

router.get("/admin", async (req, res) => {
  const { recentUploadsCollection } = await getCollections();
  const recentUploads = await recentUploadsCollection.find({}).toArray();

  // console.log(recentUploads.length);
  res.send(recentUploads);
});

router.get("/admin/album", async (req, res) => {
  const { recentUploadsCollection } = await getCollections();
  const recentUploads = await recentUploadsCollection
    .find({ price: 99900 })
    .toArray();

  // console.log(recentUploads.length);
  res.send(recentUploads);
});

router.post("/", verifyJWT, async (req, res) => {
  const { recentUploadsCollection } = await getCollections();
  const recentUploads = await recentUploadsCollection.insertOne(req.body);
  // console.log(req.body);

  res.send(recentUploads);
});

router.put("/:_id", async (req, res) => {});

module.exports = router;
