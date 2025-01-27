const express = require("express");
const { getCollections } = require("../constants");
const verifyJWT = require("../verifyJWT");
const { ObjectId } = require("mongodb");
const router = express.Router();
const nodemailer = require("nodemailer");
// console.log(process.env.emailAddress);

router.get("/", async (req, res) => {
  const { yearlyPlansCollection } = await getCollections();
  const plans = await yearlyPlansCollection.find({}).toArray();

  res.send(plans);
});

router.post("/", verifyJWT, async (req, res) => {
  const { yearlyPlansCollection } = await getCollections();

  // console.log(req.body);

  const insertCursor = await yearlyPlansCollection.insertOne(req.body);

  res.send(insertCursor);
});

router.put("/:_id", async (req, res) => {
  const { body } = req;
  const { yearlyPlansCollection, clientsCollection, notificationsCollections } =
    await getCollections();
  const { emailId } = body;

  // console.log(body, req.params._id);
  // const updateCursor = await yearlyPlansCollection.updateOne(
  //   { _id: new ObjectId(req.params._id) },
  //   { $set: body },
  //   { upsert: true }
  // );

  const userData = await clientsCollection.findOne({ emailId });
  const deleteCursor = await yearlyPlansCollection.deleteOne({
    _id: new ObjectId(req.params._id),
  });

  userData.yearlyPlanStartDate = body.yearlyPlanStartDate;
  userData.yearlyPlanEndDate = body.yearlyPlanEndDate;

  const updatedUserData = { ...userData };
  delete updatedUserData._id;

  const updateCursor = await clientsCollection.updateOne(
    { _id: new ObjectId(userData._id) },
    { $set: updatedUserData },
    { upsert: true }
  );
  // const usersCursor = await usersCollection.findOne({ user_email:"abc@admin" });

  const transporter = nodemailer.createTransport({
    host: "smtp.hostinger.com", // Replace with your Hostinger SMTP server
    port: 587, // Typically, SMTP uses port 587
    secure: false, // Set to true if you are using SSL/TLS
    auth: {
      user: process.env.emailAddress,
      pass: process.env.emailPass,
    },
  });

  var message = {
    from: process.env.emailAddress,
    to: emailId,
    subject: "Yearly Plan Request Approved",
    // text: "Plaintext version of the message",
    html: `<div>
      Dear ${userData.first_name}, <br />

      Thank you for reaching out to us.<br />
      Your Yearly Plan Request is Approved
      <br />
      Team ForeVision Digital
    </div>`,
  };

  transporter.sendMail(message, async (error, info) => {
    if (error) {
      console.error(error);
      res.status(500).send(error);
    }
  });

  const timeStamp = Math.floor(new Date().getTime() / 1000);

  const notification = {
    email: emailId,
    message: "Yearly Plan Request Approved",
    date: timeStamp,
    read: false,
  };

  const notificationCursor = await notificationsCollections.insertOne(
    notification
  );

  res.send({ updateCursor, deleteCursor, notificationCursor });

  // res.send(updateCursor);
});

router.post("/delete/:_id", async (req, res) => {
  const { notificationsCollections, yearlyPlansCollection, clientsCollection } =
    await getCollections();
  const timeStamp = Math.floor(new Date().getTime() / 1000);

  const notification = {
    email: req.body.emailId,
    message: `Your Request for yearly plan request rejected for ${req.body.declineReason}`,
    date: timeStamp,
  };

  const userData = await clientsCollection.findOne({
    emailId: req.body.emailId,
  });

  const notificationCursor = await notificationsCollections.insertOne(
    notification
  );

  const transporter = nodemailer.createTransport({
    host: "smtp.hostinger.com", // Replace with your Hostinger SMTP server
    port: 587, // Typically, SMTP uses port 587
    secure: false, // Set to true if you are using SSL/TLS
    auth: {
      user: process.env.emailAddress,
      pass: process.env.emailPass,
    },
  });

  var message = {
    from: process.env.emailAddress,
    to: req.body.emailId,
    // to: "smdshakibmia2001@gmail.com",
    subject: "Yearly Plan Request Declined",
    // text: "Plaintext version of the message",
    html: `<div>
      Dear ${userData.first_name}, <br />

      Thank you for reaching out to us.<br />
      Your Yearly Plan Request is Approved
      <br />
      Team ForeVision Digital
    </div>`,
  };

  transporter.sendMail(message, async (error, info) => {
    if (error) {
      console.error(error);
      res.status(500).send(error);
    }
  });

  const deleteCursor = await yearlyPlansCollection.deleteOne({
    _id: new ObjectId(req.params._id),
  });

  // const notificationCursor = await notificationsCollections.insertOne(
  //   notification
  // );

  res.send({ notificationCursor, deleteCursor });
});

module.exports = router;
