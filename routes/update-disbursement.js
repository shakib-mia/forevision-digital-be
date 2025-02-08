const express = require("express");
const router = express.Router();
const { getCollections } = require("../constants");
const verifyJWT = require("../verifyJWT");
const jwt = require("jsonwebtoken");
const { ObjectId } = require("mongodb");

router.get("/", async (req, res) => {
  const { clientsCollection, paymentHistory } = await getCollections();

  const users = await clientsCollection.find({}).toArray();
  // //   console.log(users);
  const disbrusedPayments = await paymentHistory.find({}).toArray();

  for (const user of users) {
    let lifetimeDisbursed = 0;
    for (const payment of disbrusedPayments) {
      if (user.emailId === payment.emailId) {
        // console.log(payment);
        lifetimeDisbursed = lifetimeDisbursed + parseFloat(payment.totalAmount);

        // console.log(user.emailId, lifetimeDisbursed);
      }
    }
    user.lifetimeDisbursed = lifetimeDisbursed;
    // console.log(newUser);
    // if (newUser.lifetimeDisbursed) {
    // //   console.log(newUser);
    // }
    // console.log(await clientsCollection.findOne({ emailId: newUser.emailId }));
    // console.log(newUser);

    delete user._id;

    const updatedCursor = await clientsCollection.updateOne(
      { emailId: user.emailId },
      { $set: user },
      {
        upsert: false,
      }
    );

    // console.log(updatedCursor);
  }

  res.send(await clientsCollection.find({}).toArray());
});

module.exports = router;
