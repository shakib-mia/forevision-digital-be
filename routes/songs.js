const express = require("express");
const verifyJWT = require("../verifyJWT");
const { getCollections, client } = require("../constants");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { ObjectId } = require("mongodb");

router.post("/", verifyJWT, async (req, res) => {
  const song = req.body;
  const { newSongs, clientsCollection } = await getCollections(); // Assumes getCollections() initializes required collections
  delete song._id;

  try {
    // Check if the client exists
    const user = await clientsCollection.findOne({ emailId: song.userEmail });

    if (!user) {
      // If user doesn't exist, create a new entry
      const userData = {
        emailId: song.userEmail || song.emailId,
        isrc: song.isrc, // Add the first ISRC
      };

      const insertResult = await clientsCollection.insertOne(userData);
      res.send({
        message: "New user created",
        ...insertResult,
      });
    } else {
      // If user exists, update the ISRC field
      let isrcs = user.isrc ? user.isrc.split(",") : [];
      if (!isrcs.includes(song.isrc)) {
        isrcs.push(song.isrc); // Add the new ISRC if not already present
      }

      const updatedUser = { ...user, isrc: isrcs.join(",") };
      delete updatedUser._id;

      const updateCursor = await clientsCollection.updateOne(
        { _id: user._id },
        { $set: updatedUser }
      );

      res.send({
        message: "User updated",
        ...updateCursor,
      });
    }
  } catch (error) {
    console.error("Error handling ISRC logic:", error);
    res.status(500).send({ error: "Internal server error" });
  }
});

router.put("/update-upload-list/:_id", verifyJWT, async (req, res) => {
  const { _id } = req.params;
  const { recentUploadsCollection, newSongs } = await getCollections();
  const updateCursor = await recentUploadsCollection.updateOne(
    { _id: new ObjectId(_id) },
    { $set: req.body },
    { upsert: false }
  );
  console.log(req.body);
  const insertCursor = await newSongs.insertOne(req.body);

  res.send({ updateCursor, insertCursor });
});

router.get("/by-user-id/:user_id", async (req, res) => {
  try {
    const { songs, clientsCollection, newSongs, splitRoyalties } =
      await getCollections();

    // Retrieve the user and their ISRCs in a single step
    const user = await clientsCollection.findOne(
      { "user-id": req.params.user_id },
      { projection: { isrc: 1 } } // Fetch only the `isrc` field
    );

    if (!user?.isrc) {
      return res.status(404).send("No ISRCs have been found");
    }

    const isrcs = user.isrc.split(",");

    // Fetch songs, newSongs, and splitRoyalties in parallel
    const [songsArray, newSongsArray, splitRoyaltiesISRCs] = await Promise.all([
      songs.find({ ISRC: { $in: isrcs } }).toArray(),
      newSongs.find({ ISRC: { $in: isrcs } }).toArray(),
      splitRoyalties
        .find({ isrc: { $in: isrcs } }, { projection: { isrc: 1 } })
        .toArray(),
    ]);

    // Create a Set for fast lookup of splitRoyalties ISRCs
    const splitRoyaltiesSet = new Set(splitRoyaltiesISRCs.map((sr) => sr.isrc));

    // Combine songs and newSongs, adding the `splitAvailable` field
    const allSongs = [...songsArray, ...newSongsArray].map((song) => ({
      ...song,
      splitAvailable: splitRoyaltiesSet.has(song.ISRC),
    }));

    res.send(allSongs);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

router.get("/all", async (req, res) => {
  const { songs, recentUploadsCollection } = await getCollections();

  const songsList = await songs.find({}).toArray();
  const recentSongs = await recentUploadsCollection
    .find({
      isrc: { $exists: true },
    })
    .toArray();

  res.send([...songsList, ...recentSongs]);
});

router.put("/:_id", async (req, res) => {
  const { clientsCollection } = await getCollections();
  const { _id } = req.params;

  // const { recentUploadsCollection } = await getCollections();
  const { recentUploadsCollection } = await getCollections();
  delete req.body._id;
  // for adding paid in song
  // const data = await recentUploadsCollection.findOne({
  //   _id: new ObjectId(_id),
  // });

  // data.status = "paid";

  // const foundIsrc = req.body.songs.find(
  //   (song) => song.status === "copyright-infringed"
  // ).isrc;

  // console.log(req.body);
  const { emailId, userEmail } = req.body;

  const user = await clientsCollection.findOne({
    emailId: emailId || userEmail,
  });
  // console.log(user);
  // ;

  const updatedISRCList = user.isrc
    .split(",")
    .slice(0, user.isrc.split(",").length - 1);

  user.isrc = updatedISRCList.join(",");

  // console.log(user);
  const newUser = { ...user };

  delete newUser._id;

  // const updatedCursor = await
  await clientsCollection.updateOne(
    { _id: new ObjectId(user._id) },
    { $set: newUser },
    { upsert: true }
  );

  // console.log("songs.js 80");

  const updateCursor = await recentUploadsCollection.updateOne(
    { _id: new ObjectId(_id) },
    { $set: { ...req.body } },
    { upsert: true }
  );

  res.send(updateCursor);
});

router.get("/by-order-id/:orderId", async (req, res) => {
  const { orderId } = req.params;
  const { recentUploadsCollection } = await getCollections();

  const song = await recentUploadsCollection.findOne({ orderId });
  res.send(song);
});

router.put("/by-order-id/:orderId", async (req, res) => {
  const { orderId } = req.params;
  // const { recentUploadsCollection } = await getCollections();
  const { recentUploadsCollection } = await getCollections();

  const data = await recentUploadsCollection.findOne({ orderId });
  const updated = req.body;
  updated.status = "paid";

  delete updated._id;

  // console.log({ data, req: req.body, updated });

  const updateCursor = await recentUploadsCollection.updateOne(
    { _id: data._id },
    { $set: updated },
    { upsert: false }
  );

  res.send(updateCursor);
});

router.get("/:_id", async (req, res) => {
  try {
    // Retrieve the collections from the database
    const { songs, recentUploadsCollection, newSongs } = await getCollections();
    const { _id } = req.params;

    // Search for the song in the 'songs' collection
    let song = await songs.findOne({ _id: new ObjectId(_id) });

    // If the song is not found in the 'songs' collection, check the 'recentUploadsCollection'
    if (song === null) {
      song = await recentUploadsCollection.findOne({ _id: new ObjectId(_id) });
      if (song === null) {
        song = await newSongs.findOne({ _id: new ObjectId(_id) });
      }
    }

    // Log the song data (for debugging purposes)
    // If the song is found, send it back as the response
    if (song !== null && (song.songName || song.Song)) {
      res.status(200).send(song);
    } else {
      res.status(404).send({ message: "Song not found" });
    }

    console.log(song);
  } catch (error) {
    // Log the error and send a 500 status in case of a server error
    console.error("Error finding song:", error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

router.get("/by-isrc/:ISRC", async (req, res) => {
  const { ISRC } = req.params;
  const { songs, recentUploadsCollection } = await getCollections();

  // const song = await songs.findOne({ ISRC });

  // Case insensitive
  const song = await songs.findOne({
    ISRC: { $regex: `^${ISRC}$`, $options: "i" },
  });
  // console.log(song);
  // console.log(song);
  if (song === null) {
    const song2 = await recentUploadsCollection.findOne({
      isrc: ISRC,
    });
    // console.log(song2);
    res.send(song2);
  } else {
    res.send(song);
  }
});

module.exports = router;
