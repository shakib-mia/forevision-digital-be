const { Router } = require("express");
const { getCollections } = require("../constants");
const { customLog } = require("../customlog");

const router = Router();

router.get("/", async (req, res) => {
  try {
    const { revenueCollections, clientsCollection } = await getCollections();
    const clients = await clientsCollection.find({}).toArray();

    for (const client of clients) {
      let lifetimeRevenue = 0;
      let accountBalance = 0;

      if (client.isrc) {
        const isrcs = client?.isrc?.split(",");
        for (const isrc of isrcs) {
          const revenueItems = await revenueCollections
            .find({ isrc })
            .toArray();
          revenueItems.forEach((item) => {
            lifetimeRevenue += item["final revenue"];
          });
        }
      }

      // Update the client's lifetimeRevenue if it has changed
      if (client.lifetimeRevenue !== lifetimeRevenue) {
        await clientsCollection.updateOne(
          { _id: client._id },
          { $set: { lifetimeRevenue } }
        );
      }

      // Reflect the updated lifetimeRevenue in the client object for response
      client.lifetimeRevenue = lifetimeRevenue;
    }

    res.send(clients);
  } catch (error) {
    console.error("Failed to calculate lifetimeRevenue:", error);
    res.status(500).send("An error occurred while processing your request.");
  }
});

router.get("/songs", async (req, res) => {
  const { songsCollection, revenueCollections } = await getCollections();

  const songs = await songsCollection.find({}).toArray();

  for (const song of songs) {
    const pipeline = [
      {
        $match: { isrc: song.ISRC },
      },
      {
        $project: {
          _id: 0,
          "final revenue": 1,
        },
      },
    ];

    const revenues = await revenueCollections.aggregate(pipeline).toArray();
    let count = 0;

    for (const revenue of revenues) {
      count = count + revenue["final revenue"];
    }

    const newData = { ...song, lifetimeRevenue: count };

    delete newData._id;

    const updateCursor = await songsCollection.updateOne(
      { ISRC: song.ISRC },
      { $set: newData },
      { upsert: false }
    );

    // console.log(updateCursor, { ...newData });
  }

  res.send(songs);
});

// router.get("/:ISRC", async (req, res) => {
//   // res.send(req.params.isrc);
//   const { ISRC } = req.params;

//   const { songsCollection, revenueCollections } = await getCollections();

//   const song = await songsCollection.findOne({ ISRC });

//   const pipeline = [
//     {
//       $match: { isrc: req.params.ISRC },
//     },
//     {
//       $project: {
//         _id: 0,
//         "final revenue": 1,
//       },
//     },
//   ];

//   const revenues = await revenueCollections.aggregate(pipeline).toArray();

//   let count = 0;

//   for (const revenue of revenues) {
//     count = count + revenue["final revenue"];
//   }

//   const newData = { ...song, lifetimeRevenue: count };

//   const updateCursor = await songsCollection.updateOne(
//     { ISRC: req.params.ISRC },
//     { $set: newData },
//     { upsert: false }
//   );

//   // console.log(count);

//   res.send(updateCursor);
// });

module.exports = router;
