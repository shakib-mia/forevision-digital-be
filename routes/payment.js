const express = require("express");
const Razorpay = require("razorpay");
const router = express.Router();
const crypto = require("crypto");
const { getCollections } = require("../constants");
const jwt = require("jsonwebtoken");
const verifyJWT = require("../verifyJWT");
const { ObjectId } = require("mongodb");

router.post("/", async (req, res) => {
  try {
    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const options = {
      amount: req.body.amount,
      currency: "INR",
      receipt: crypto.randomBytes(10).toString("hex"),
    };

    instance.orders.create(options, (error, order) => {
      if (error) {
        console.log(error);
        return res.status(500).json({ message: "Payment Request Failed" });
      }
      console.clear();
      // console.log(order);
      res.send(order);
    });
  } catch (error) {
    console.log(error);
  }
});

router.post("/verify", verifyJWT, async (req, res) => {
  const { paymentsCollection } = await getCollections();

  const { email } = jwt.decode(req.headers.token);

  // const payments = await paymentsCollection.find({}).toArray();

  // console.log(payments);

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;
    const sign = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature === expectedSign) {
      // await paymentsCollection.

      const data = {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        emailId: email,
        date: Date.now(),
        ...req.body,
      };

      // console.log(data);
      const insertCursor = await paymentsCollection.insertOne(data);

      return res.send({
        message: "Payment verified successfully",
        razorpay_order_id,
        razorpay_payment_id,
        insertCursor,
      });
    }
  } catch (error) {
    console.log(error);
  }
});

router.post("/send-link/:_id", async (req, res) => {
  const { yearlyPlansCollection, notificationsCollections } =
    await getCollections();

  const { emailId } = await yearlyPlansCollection.findOne({
    _id: new ObjectId(req.params._id),
  });
  const timeStamp = Math.floor(new Date().getTime() / 1000);

  console.log(req.body);

  const notification = {
    email: emailId,
    message: `Click <a style="color: blue" onClick="e => e.stopPropagation()" target="_blank" href="${
      req.body.link.includes("https://")
        ? req.body.link
        : "https://" + req.body.link
    }">here</a> to Pay for the yearly Plan`,
    read: false,
    date: timeStamp,
  };

  const notificationCursor = await notificationsCollections.insertOne(
    notification
  );
  res.send(notification);
});

module.exports = router;
