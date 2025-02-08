const express = require("express");
const verifyJWT = require("../verifyJWT");
const { getCollections } = require("../constants");
const { ObjectId } = require("mongodb");
const Razorpay = require("razorpay");
const router = express.Router();

// router.post("/")

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

router.get("/", verifyJWT, async (req, res) => {
  const { refundRequests } = await getCollections();

  const requests = await refundRequests.find({}).toArray();
  res.send(requests);
});

router.post("/", verifyJWT, async (req, res) => {
  const { refundRequests, recentUploadsCollection } = await getCollections();
  const request = { ...req.body };
  delete request._id;

  // //   console.log(request);
  request.requested = true;

  // //   console.log(req.body._id);

  const updateCursor = await recentUploadsCollection.updateOne(
    { _id: new ObjectId(req.body._id) },
    { $set: { ...request } },
    { upsert: true }
  );

  const postCursor = await refundRequests.insertOne(request);
  res.send({ postCursor, updateCursor });
});

router.post("/:payment_id", async (req, res) => {
  /**
   *
   * 1, order id
   *
   *
   * */
  const { recentUploadsCollection, refundRequests } = await getCollections();

  // console.log(req.body);
  const { percentage } = req.body;

  const { payment_id } = req.params;
  const paymentItem = await recentUploadsCollection.findOne({ payment_id });
  // console.log(paymentItem);
  delete paymentItem.requested;
  paymentItem.refunded = true;
  // paymentItem.refuund
  const { _id } = paymentItem;
  // console.log(_id);
  delete paymentItem._id;
  const amount = Math.round(
    (parseFloat(paymentItem.price) / 100) * (parseFloat(percentage) / 100)
  );
  // console.log(pa);
  // // res.send(paymentItem);
  try {
    // console.log(amount);
    if (amount > 1) {
      const response = await razorpay.payments.refund(payment_id, {
        amount: amount * 100,
      });
      paymentItem.refundId = response.id;
      const refundData = await refundRequests.findOne({ payment_id });
      const updated = { ...refundData, refundId: response.id };
      delete updated._id;

      const refundUpdateCursor = await refundRequests.updateOne(
        { _id: refundData._id },
        { $set: updated },
        { upsert: false }
      );
      const updateCursor = await recentUploadsCollection.updateOne(
        { _id },
        { $set: paymentItem },
        { upsert: true }
      );
      // const deleteCursor = await recent
      res.send({ ...paymentItem, ...updateCursor, refundUpdateCursor });
    }
  } catch (error) {
    //   console.log(error);
    res.status(500).json({
      message: "Refund initiation failed",
      error: error.error.description,
    });
  }
});

module.exports = router;
