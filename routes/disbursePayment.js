const express = require("express");
const router = express.Router();
const { getCollections } = require("../constants");
const verifyJWT = require("../verifyJWT");
const multer = require("multer");
const { ObjectId } = require("mongodb");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.hostinger.com", // Replace with your Hostinger SMTP server
  port: 587, // Typically, SMTP uses port 587
  secure: false, // Set to true if you are using SSL/TLS
  auth: {
    user: process.env.emailAddress,
    pass: process.env.emailPass,
  },
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + "-" + Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

// for history
router.get("/", async (req, res) => {
  const { paymentRequest } = await getCollections();

  const historyCursor = await paymentRequest.find({}).toArray();
  res.send(historyCursor);
});

// for getting specific data
router.get("/:_id", async (req, res) => {
  const { withdrawalRequest } = await getCollections();

  const { _id } = req.params;

  const data = await withdrawalRequest.findOne({ _id: new ObjectId(_id) });

  // console.log(data);
  res.send(data);
});

// for disbursement
router.put("/:_id", async (req, res) => {
  const { _id } = req.params;
  const updatedDoc = req.body;
  delete updatedDoc._id;
  updatedDoc.disbursed = true;
  // console.log(updatedDoc);

  const { paymentHistory, withdrawalRequest, clientsCollection } =
    await getCollections();

  const client = await clientsCollection.findOne({
    emailId: updatedDoc.emailId,
  });

  const date = new Date();
  const paymentDate =
    String(date.getDate()).padStart(2, "0") +
    "/" +
    String(date.getMonth() + 1).padStart(2, "0") +
    "/" +
    date.getFullYear();

  // console.log(updatedDoc);
  client.lifetimeDisbursed =
    (client.lifetimeDisbursed || 0) + parseFloat(updatedDoc.totalAmount);

  var message = {
    from: `ForeVision Payments ${process.env.emailAddress}`,
    // to: updatedDoc.emailId,
    to: "smdshakibmia2001@gmail.com",
    subject: "Payment Confirmation - ForeVision Digital",
    // text: "Plaintext version of the message",
    html: `<div>
    Dear ${
      client.partner_name || userData.first_name + " " + userData.last_name
    }, <br />

    We trust this email finds you well.<br />
    We're writing to confirm that the payment for last invoice number raise has been successfully processed. The transaction details are as follows:
    <ul>
      <li>Amount: ${Math.abs(
        (client.lifetimeRevenue - client.lifetimeDisbursed).toFixed(2)
      )}</li>
      <li>Date of Payment: ${paymentDate}</li>
      <li>Invoice Number: ${updatedDoc.invoiceNumber}</li>
      <li>Payment Method: ${updatedDoc.paymentMethod}</li>
      <li>Transaction ID: ${updatedDoc.transactionID}</li>
    </ul>
    We appreciate your trust in us and look forward to serving you.<br />
    <br />
    Best regards,<br />
    ForeVision Digital<br />
    </div>`,
  };

  console.log(message);

  transporter.sendMail(message, async (error, info) => {
    if (error) {
      console.error(error);
      res.status(500).send({ message: "Error Sending Mail" });
    } else {
      // console.log("sent");
      res.send({ message: "Success" });
    }
  });

  // console.log(client);

  const deleteCursor = await withdrawalRequest.deleteOne({
    _id: new ObjectId(_id),
  });

  const addedCursor = await paymentHistory.insertOne(updatedDoc);
  const updatedDocument = await clientsCollection.updateOne(
    { emailId: client.emailId },
    { $set: { ...client } },
    { upsert: false }
  );
  // res.send({ deleteCursor, addedCursor, updatedDocument });
});

// for declining
router.post("/:_id", async (req, res) => {
  const { _id } = req.params;
  const { paymentHistory, withdrawalRequest, notificationsCollections } =
    await getCollections();

  const deleteCursor = await withdrawalRequest.deleteOne({
    _id: new ObjectId(_id),
  });

  const data = req.body;
  data.declined = true;

  delete data._id;
  const timeStamp = Math.floor(new Date().getTime() / 1000);

  const addedCursor = await paymentHistory.insertOne(data);
  const notification = {
    email: req.body.emailId,
    message: `Your Request was declined because <b>${req.body.reason}</b>`,
    date: timeStamp,
  };
  const notificationCursor = await notificationsCollections.insertOne(
    notification
  );

  var message = {
    from: `ForeVision Payments ${process.env.emailAddress}`,
    to: req.body.emailId || req.body.user_email,
    to: "smdshakibmia2001@gmail.com",
    subject: "Payment Rejection Notification and Resubmission Request",
    // text: "Plaintext version of the message",
    html: `<div>
    Dear Artists, <br />

    We hope this message finds you well. We would like to bring to your attention that your submission for last payment processing submitted to us has been rejected. 
    After careful review, we discovered that the payment could not be processed due to <b>${req.body.reason}</b>.<br />
    
    We apologize for any problem regarding this may have caused.<br />
    
    In order to ensure that your payment is successfully processed, we kindly ask that you resubmit the payment at your earliest convenience. Please review the details of your payment method and ensure that all necessary information is accurate and up to date.<br />
    
    Incase of any assistance, you can reach us at your earliest convenience.<br />
    
    Best regards<br />
    Team ForeVision Digital
    </div>`,
  };

  transporter.sendMail(message, async (error, info) => {
    if (error) {
      console.error(error);
      res.status(500).send({ message: "Error Sending Mail" });
    } else {
      // console.log("sent");
      res.send({ message: "Success" });
    }
  });

  // res.send({ deleteCursor, addedCursor, notification });
});

// need to send notification to user

module.exports = router;
