const express = require("express");
const verifyJWT = require("../verifyJWT");
const { getCollections, client } = require("../constants");
const router = express.Router();
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
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
  //   console.log(req.body);
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
    const [songsArray, newSongsArray, splitRoyaltiesArray] = await Promise.all([
      songs.find({ ISRC: { $in: isrcs } }).toArray(),
      newSongs.find({ ISRC: { $in: isrcs } }).toArray(),
      splitRoyalties.find({ isrc: { $in: isrcs } }).toArray(),
    ]);

    // Create a Map for splitRoyalties by ISRC for fast lookup
    const splitRoyaltiesMap = new Map();
    splitRoyaltiesArray.forEach((royalty) => {
      splitRoyaltiesMap.set(royalty.isrc, {
        confirmed: royalty.confirmed || false,
        denied: royalty.denied || false,
      });
    });

    // Combine songs and newSongs, adding the `splitAvailable` field
    const allSongs = [...songsArray, ...newSongsArray].map((song) => ({
      ...song,
      splitAvailable: splitRoyaltiesMap.has(song.ISRC),
      splitDetails: splitRoyaltiesMap.get(song.ISRC) || null, // Attach details if available
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
  const { recentUploadsCollection, userDetails, notificationsCollections } =
    await getCollections();
  const client = await userDetails.findOne({
    user_email: req.body.emailId || req.body.userEmail,
  });
  const data = await recentUploadsCollection.findOne({ orderId });
  const updated = req.body;

  if (updated.price !== 0) {
    updated.status = "paid";
  } else {
    updated.status = "submitted";
  }

  delete updated._id;

  const timeStamp = Math.floor(new Date().getTime() / 1000);

  const notification = {
    email: req.body.emailId || req.body.userEmail,
    message: `Congratulations! You Uploaded a Song Successfully!`,
    date: timeStamp,
  };
  const notificationCursor = await notificationsCollections.insertOne(
    notification
  );

  const date = new Date();
  const options = { year: "numeric", month: "long", day: "numeric" };
  const formattedDate = date.toLocaleDateString("en-US", options);

  const unitPrice = parseFloat(updated.price) / 100;
  const subTotal = unitPrice / (1 + 18 / 100);
  const gstAmount = unitPrice - subTotal;

  //   console.log(unitPrice);
  let mailOptions = {
    from: `ForeVision Digital ${process.env.emailAddress}`,
    to: updated.emailId,
    // to: "smdshakibmia2001@gmail.com",
    cc: "connect@forevisiondigital.com",
    subject: `Update on Your Music Distribution Status with ForeVision Digital`,
    html: ` Dear Artist, <br />
    A new order has been placed on ForeVision Digital. Below are the order
    details:
    <br /><br />
    ORDER #${orderId} (${formattedDate}) <br />
    <br /><br />
    Product: <br />
    •
    <span style="text-transform: capitalize"
      >${updated.planName.split("-").join(" ")}</span
    >
    <br />

    Quantity: 1 <br />

    Price: ₹${unitPrice > 0 ? unitPrice.toFixed(2) : "0"}  
    ${
      unitPrice > 0
        ? `Includes ₹${(unitPrice - subTotal).toFixed(2)} (18% GST)`
        : ""
    }
    <br />
    ${unitPrice > 0 ? `Payment Method: Razorpay <br />` : ""} 
    <br />
    Billing Address: <br />
    ${client.billing_city ? `${client.billing_city}, <br />` : ``}
    ${client.billing_state ? `${client.billing_state}, <br />` : ``}
    ${client.billing_country ? `${client.billing_country}, <br />` : ``}
    ${client.phone_no ? `Contact: ${client.phone_no}, <br />` : ``}

    Email: ${req.body.userEmail} <br />
    <br />
    To track your order, please check the My Releases section on your ForeVision
    Digital dashboard. <br />
    <br />
    Congratulations on the new order! <br />
    <br />
    Best regards, <br />
    ForeVision Digital Team`,
  };

  const transporter = nodemailer.createTransport({
    host: "smtp.hostinger.com", // Replace with your Hostinger SMTP server
    port: 587, // Typically, SMTP uses port 587
    secure: false, // Set to true if you are using SSL/TLS
    auth: {
      user: process.env.emailAddress,
      pass: process.env.emailPass,
    },
  });

  //   console.log("sending mail...");

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error sending email:", error);
      return res.status(500).send("Failed to send email.");
    }
    // res.status(200).send("Email sent successfully!");
  });

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

    //   console.log(song);
  } catch (error) {
    // Log the error and send a 500 status in case of a server error
    console.error("Error finding song:", error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

router.get("/by-isrc/:ISRC", async (req, res) => {
  try {
    const { ISRC } = req.params;
    const { songs, recentUploadsCollection, clientsCollection } =
      await getCollections();

    // Step 1: Search for the song in the songs collection
    const song = await songs.findOne({
      ISRC: { $regex: `^${ISRC}$`, $options: "i" },
    });

    if (song === null) {
      // Step 2: If song is not found in songs collection, search in recentUploadsCollection
      const song2 = await recentUploadsCollection.findOne({
        isrc: ISRC,
      });

      if (song2) {
        // Find the client associated with this ISRC
        const client = await clientsCollection.findOne({
          isrc: { $regex: `(^|,)${ISRC}($|,)`, $options: "i" },
        });

        if (client) {
          song2.emailId = client.emailId;
        }

        return res.send(song2);
      }
    } else {
      // Step 3: Find the client associated with this ISRC
      const client = await clientsCollection.findOne({
        isrc: { $regex: `(^|,)${ISRC}($|,)`, $options: "i" },
      });

      if (client) {
        song.emailId = client.emailId;
      }

      return res.send(song);
    }

    // If song or recent upload is not found, return a 404
    return res.status(404).send({ error: "No song found for this ISRC" });
  } catch (error) {
    console.error("Error processing the request:", error);
    return res
      .status(500)
      .send({ error: "An error occurred while processing the request" });
  }
});

module.exports = router;
