const express = require("express");
const { getCollections } = require("../constants");
const verifyJWT = require("../verifyJWT");
const { ObjectId } = require("mongodb");
const router = express.Router();

router.post("/", verifyJWT, async (req, res) => {
  const { takedownRequestsCollection } = await getCollections();

  const body = req.body;

  const insertCursor = await takedownRequestsCollection.insertOne(body);

  res.send(insertCursor);

  // //   console.log(body);
});

router.get("/", async (req, res) => {
  const { takedownRequestsCollection } = await getCollections();
  const requests = await takedownRequestsCollection.find({}).toArray();

  res.send(requests);
});

router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { recentUploadsCollection, takedownRequestsCollection } =
    await getCollections();
  // console.log(_id, req.body.isrc);

  const foundSong = await recentUploadsCollection.findOne({
    ISRC: req.body.isrc,
  });

  foundSong.status = "taken-down";

  const { _id, ...updatedData } = foundSong;

  const request = await takedownRequestsCollection.findOne({
    _id: new ObjectId(id),
  });
  // console.log(request, updatedData);

  // console.log(updatedData);
  const deleteCursor = await takedownRequestsCollection.deleteOne({
    _id: new ObjectId(id),
  });

  updatedData.platformsToDelete = request.platformsToDelete;

  const updateCursor = await recentUploadsCollection.updateOne(
    { _id: new ObjectId(foundSong._id) },
    { $set: { ...updatedData } },
    { upsert: false }
  );

  res.send({ deleteCursor, updateCursor });
});

module.exports = router;
