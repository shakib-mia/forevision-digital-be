const express = require("express");
const router = express.Router();
const { getCollections, client } = require("../constants");
const verifyJWT = require("../verifyJWT");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer"); // Include nodemailer for sending emails
const { ObjectId } = require("mongodb");

router.get("/", verifyJWT, async (req, res) => {
  const { splitRoyalties } = await getCollections();

  const splits = await splitRoyalties.find({}).toArray();
  res.send(splits);
});

router.post("/", async (req, res) => {
  const { splitRoyalties } = await getCollections();

  const postCursor = await splitRoyalties.insertOne(req.body);
  res.send(postCursor);
});

router.put("/:_id", async (req, res) => {
  const {
    splitRoyalties,
    notificationsCollections,
    clientsCollection,
    userDetails,
  } = await getCollections();
  delete req.body._id;

  const { splits, isrc, songName, owner } = req.body;
  // console.log(req.body);

  try {
    // Find the artist name (owner email)
    const clientData = await clientsCollection.findOne({ emailId: owner });
    const userData = await userDetails.findOne({ user_email: owner });

    const ownerDetails = { ...clientData, ...userData };

    const artistName = ownerDetails
      ? ownerDetails.first_name + " " + ownerDetails.last_name
      : "an artist";

    // console.log(ownerDetails);

    if (req.body.denied) {
      const timeStamp = Math.floor(new Date().getTime() / 1000);

      const notification = {
        email: req.body.owner,
        message: `Your Split Request has been denied`,
        date: timeStamp,
      };

      const notificationRequest = await notificationsCollections.insertOne(
        notification
      );
      //   console.log(notificationRequest);
    }

    for (const split of splits) {
      const { emailId } = split;

      // Check if emailId exists in clientsCollection
      const hasClient = await clientsCollection.findOne({
        emailId,
      });

      if (!hasClient) {
        // User doesn't exist in clientsCollection
        const insertCursor = await clientsCollection.insertOne({
          emailId,
          isrc,
        });

        if (req.body.confirmed) {
          // Send email only to the unavailable user
          const message = `
            <p>Hello Dear Artist,</p>
            <p>You've made some awesome music, and now it's time to get paid for what you love to do.</p>
            <p>You collaborated in a song called - <strong>${songName}</strong>.</p>
            <p>We have got a request from - <strong>${artistName}</strong> to add you in the loop, to distribute the royalty with transparency.</p>
            <p>To claim your share of deal, kindly visit <a href="https://dashboard.forevisiondigital.com/">dashboard.forevisiondigital.com</a>.</p>
            <p>In case you're not signed up, put your Gmail and other details as asked, or just log in to your dashboard.</p>
            <p>We will add you to our system and notify you about the disbursement accordingly.</p>
          `;

          await sendEmail(emailId, "Royalty Distribution Request", message);
        }
      } else {
        // If user already exists, update their ISRC
        if (hasClient.isrc) {
          if (!hasClient.isrc.includes(isrc)) {
            hasClient.isrc = `${hasClient.isrc},${isrc}`;
          }
        } else {
          hasClient.isrc = isrc;
        }

        const { _id, ...rest } = hasClient;

        // Update client's ISRC in the collection
        await clientsCollection.updateOne(
          { _id },
          { $set: rest },
          { upsert: true }
        );
      }
    }

    const updateCursor = await splitRoyalties.updateOne(
      { _id: new ObjectId(req.params._id) },
      {
        $set: req.body,
      },
      {
        upsert: false,
      }
    );

    res.send({
      message: "Clients updated successfully, emails sent as needed.",
    });
  } catch (error) {
    console.error("Error updating clients:", error);
    res.status(500).send({ error: "Something went wrong" });
  }
});

// Email-sending function
const sendEmail = async (to, subject, htmlContent) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.hostinger.com", // Replace with your Hostinger SMTP server
      port: 587, // Typically, SMTP uses port 587
      secure: false, // Set to true if you are using SSL/TLS
      auth: {
        user: process.env.emailAddress,
        pass: process.env.emailPass,
      },
    });

    const mailOptions = {
      from: `ForeVision Digital ${process.env.emailAddress}`,
      to,
      cc: "connect@forevisiondigital.com",
      subject,
      html: htmlContent,
    };

    await transporter.sendMail(mailOptions);
    //   console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error(`Error sending email to ${to}:`, error);
  }
};

module.exports = router;
