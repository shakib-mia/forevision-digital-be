const express = require("express");
const router = express.Router();
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { client2, getCollections } = require("../constants");
const { ObjectId } = require("mongodb");

router.use(cors());
router.use(express.json()); // Add this line to parse JSON bodies

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch main data
    const mainCollection = client2.db("forevision-digital").collection(id);
    const mainData = await mainCollection.find({}).toArray();

    // Fetch song data
    const songCollection = client2.db("forevision-digital").collection("songs");
    const songData = await songCollection.find({}).toArray();

    // Create a mapping of ISRC to song name for faster lookups
    const isrcToSongMap = songData.reduce((map, song) => {
      if (song.ISRC) {
        map[song.ISRC] = song.Song; // Map ISRC to the song name
      }
      return map;
    }, {});

    console.clear();
    // console.log(mainData, id);

    // Replace ISRCs in main data with corresponding song names
    const updatedData = mainData.map((entry) => {
      // Check if `isrcs` exists and is an array
      if (Array.isArray(entry.isrcs)) {
        // console.log(entry.isrcs.map((isrc) => isrcToSongMap[isrc]));
        return {
          ...entry,
          songs: entry.isrcs.map((isrc) => isrcToSongMap[isrc] || isrc), // Replace ISRC with song name, keep ISRC if no match found
        };
      } else {
        // console.log(entry);
        const songs = Object.keys(entry).map(
          (item) => item.includes("isrc") && isrcToSongMap[entry[item]]
        );
        // console.log(songs);
        let songName = "";
        for (const song of songs) {
          if (song) {
            songName = song;
          }
        }

        // console.log(entry);
        return {
          ...entry,
          songName, // Set songs as an empty array if isrcs doesn't exist or isn't an array
        };
      }
    });

    res.send(updatedData);
  } catch (error) {
    console.error("Error processing data:", error);
    res
      .status(500)
      .send({ message: "An error occurred", error: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    // console.log(req.body);
    const formData = req.body; // Form data
    // console.log("Received form data:", formData);

    // If you have additional custom handling for certain conditions, add it here
    // Example: Handle 'video-distribution' type fields
    // if (formData.id === "video-distribution") {
    // //   console.log(
    //     "Video Distribution Content Type:",
    //     formData.video_distribution_content_type
    //   );
    // }

    const { id, ...dataToInsert } = formData;

    //   console.log(id);
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

router.put("/:collection/:_id", async (req, res) => {
  const { collection, _id } = req.params;
  //   console.log(collection, _id);
  const { notificationsCollections } = await getCollections();

  delete req.body._id;
  // console.log(collection, _id, req.body);
  const collections = await client2
    .db("forevision-digital")
    .collection(collection);
  const updateCursor = await collections.updateOne(
    { _id: new ObjectId(_id) },
    {
      $set: req.body,
    },
    { upsert: false }
  );

  const timeStamp = Math.floor(new Date().getTime() / 1000);

  const notification = {
    email: req.body.emailId,
    message: `Your Request for ${req.body.id.split("-").join(" ")} has been ${
      req.body.approved ? "approved" : req.body.denied ? "denied" : ""
    }${
      req.body.approved
        ? "."
        : req.body.denied
        ? ` due to ${req.body.reason}.`
        : ""
    }`,
    date: timeStamp,
  };
  const notificationCursor = await notificationsCollections.insertOne(
    notification
  );

  res.send({ ...updateCursor, notificationCursor });
});

module.exports = router;
