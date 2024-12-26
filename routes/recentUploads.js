const express = require("express");
const router = express.Router();
const { getCollections } = require("../constants");
const verifyJWT = require("../verifyJWT");
const jwt = require("jsonwebtoken");
const { ObjectId } = require("mongodb");

router.get("/", verifyJWT, async (req, res) => {
  const { recentUploadsCollection } = await getCollections();
  const { email } = jwt.decode(req.headers.token);

  try {
    // Fetch documents where "songs" match either emailId or userEmail
    const singleSongs = await recentUploadsCollection
      .find({
        $or: [{ emailId: email }, { userEmail: email }],
      })
      // .sort({ status: { $eq: "streaming" } ? -1 : 1 }) // Sort by "streaming" status
      .toArray();

    res.send(singleSongs);
  } catch (error) {
    console.error("Error fetching songs:", error);
    res.status(500).send("Internal Server Error");
  }
});

router.get("/album", verifyJWT, async (req, res) => {
  const { recentUploadsCollection } = await getCollections();
  // const album =await recentUploadsCollection.find({price: 99900, })
  const { email } = jwt.decode(req.headers.token);

  // console.log(email);
  const album = await recentUploadsCollection
    .find({
      price: 99900,
      userEmail: email,
    })
    .toArray();
  res.send(album);
});

router.get("/album/:_id", verifyJWT, async (req, res) => {
  const { recentUploadsCollection } = await getCollections();
  // const album =await recentUploadsCollection.find({price: 99900, })
  const { email } = jwt.decode(req.headers.token);

  // console.log(email);
  const album = await recentUploadsCollection.findOne({
    price: 99900,
    userEmail: email,
    _id: new ObjectId(req.params._id),
  });
  res.send(album);
});

router.get("/admin/album/live", verifyJWT, async (req, res) => {
  const { recentUploadsCollection } = await getCollections();
  const { email } = jwt.decode(req.headers.token);

  // Fetch the album where all songs have the "streaming" status
  const album = await recentUploadsCollection
    .find({
      price: 99900,
      songs: {
        $not: { $elemMatch: { status: { $ne: "streaming" } } }, // No song with a non-"streaming" status
      },
    })
    .toArray();
  console.log("finding live...");
  console.log(album);
  res.send(album);
});

router.get("/admin", async (req, res) => {
  const { recentUploadsCollection } = await getCollections();
  const recentUploads = await recentUploadsCollection.find({}).toArray();

  // console.log(recentUploads.length);
  res.send(recentUploads);
});

router.get("/admin/album", async (req, res) => {
  const { recentUploadsCollection } = await getCollections();
  // const { email } = jwt.decode(req.headers.token);

  // Fetch all albums based on price and user email
  const albums = await recentUploadsCollection
    .find({
      price: 99900,
      // userEmail: email,
    })
    .toArray();

  // Filter out albums where all songs have the status "streaming"
  const filteredAlbums = albums.filter(
    (album) => !album.songs?.every((song) => song.status === "streaming")
  );

  res.send(filteredAlbums);
});

router.post("/", verifyJWT, async (req, res) => {
  const { recentUploadsCollection } = await getCollections();
  const { email } = jwt.decode(req.headers.token);

  req.body.emailId = email;

  const recentUploads = await recentUploadsCollection.insertOne(req.body);
  // console.log(req.body);

  res.send(recentUploads);
});

router.put("/:_id", async (req, res) => {
  const { body } = req;
  const { recentUploadsCollection } = await getCollections();

  delete body._id;

  const updateCursor = await recentUploadsCollection.updateOne(
    { _id: new ObjectId(req.params._id) },
    { $set: body },
    { upsert: false }
  );

  res.send(updateCursor);
  // console.log(body);
});

module.exports = router;
