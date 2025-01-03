const express = require("express");
const { getCollections } = require("../constants");
const { ObjectId } = require("mongodb");
const verifyJWT = require("../verifyJWT");
const router = express.Router();

router.post("/", verifyJWT, async (req, res) => {
  const { body } = req;
  const { songUpdateRequestCollection } = await getCollections();
  const newBody = { ...body };
  delete newBody._id;

  const insertCursor = await songUpdateRequestCollection.insertOne(newBody);
  // console.log("requested");
  res.send(insertCursor);
});

router.get("/", verifyJWT, async (req, res) => {
  const { songUpdateRequestCollection } = await getCollections();

  const insertCursor = await songUpdateRequestCollection.find({}).toArray();
  res.send(insertCursor);
});

router.put("/new/:_id", async (req, res) => {
  const {
    recentUploadsCollection,
    songUpdateRequestCollection,
    notificationsCollections,
    newSongs,
    songs,
  } = await getCollections();
  // delete req.body
  const newBody = { ...req.body };
  newBody.updated = true;

  const newSongForProfile = await newSongs.findOne({ isrc: newBody.isrc });
  // const songForProfile = await songs.findOne({ ISRC: newBody.isrc });
  // console.log(songForProfile);
  const copy = { ...newSongForProfile };
  // const copy2 = { ...songForProfile };

  // console.log(newSongForProfile);

  // delete newSongForProfile._id;
  // delete songForProfile._id;

  await newSongs.updateOne(
    { _id: new ObjectId(copy._id) },
    { $set: { ...newBody } },
    { upsert: false }
  );
  // await songs.updateOne(
  //   { _id: new ObjectId(copy2._id) },
  //   { $set: { ...songForProfile } },
  //   { upsert: false }
  // )
  // console.log({ newSongForProfilee });

  delete newBody._id;

  const song = await recentUploadsCollection.findOne({
    orderId: newBody.orderId,
  });

  const updateCursorForExistingSong = await recentUploadsCollection.updateOne(
    { _id: song._id },
    { $set: newBody },
    { upsert: false }
  );

  // console.log(song);

  const updateCursor = await recentUploadsCollection.updateOne(
    { _id: new ObjectId(req.params._id) },
    { $set: newBody },
    { upsert: false }
  );

  const updateCursor2 = await songUpdateRequestCollection.updateOne(
    {
      _id: new ObjectId(req.params._id),
    },
    {
      $set: newBody,
    },
    { upsert: false }
  );

  const timeStamp = Math.floor(new Date().getTime() / 1000);

  const notification = {
    email: req.body.emailId,
    message: `Your Update Request for ${
      newBody.songName || newBody.Song
    } has been ${req.body.approved ? "approved" : "denied"}`,
    date: timeStamp,
  };

  const notificationCursor = await notificationsCollections.insertOne(
    notification
  );

  res.send({
    updateCursor,
    updateCursor2,
    notification,
    updateCursorForExistingSong,
  });
});

/**
 *
 *
 * for old songs use the collections `songs`
 *
 *
 * */

router.put("/old/:_id", async (req, res) => {
  const { _id } = req.params;

  // console.log(_id);

  const {
    songs,
    songUpdateRequestCollection,
    recentUploadsCollection,
    newSongs,
    notificationsCollections,
  } = await getCollections();
  const song = await songs.findOne({ ISRC: req.body.ISRC });
  if (req.body.S) {
    delete req.body.S;
  }

  // console.log(song);
  delete req.body.approved;

  const updateCursor = await songs.updateOne(
    { _id: new ObjectId(song._id) },
    { $set: req.body },
    { upsert: false }
  );

  await songUpdateRequestCollection.updateOne(
    { _id: new ObjectId(_id) },
    { $set: { ...req.body, approved: true } },
    { upsert: false }
  );
  const timeStamp = Math.floor(new Date().getTime() / 1000);

  const notification = {
    email: req.body.emailId,
    message: `Your Update Request for ${song.Song} has been approved`,
    date: timeStamp,
  };
  const notificationCursor = await notificationsCollections.insertOne(
    notification
  );
  // console.log(song);
  res.send(updateCursor);
});

module.exports = router;
