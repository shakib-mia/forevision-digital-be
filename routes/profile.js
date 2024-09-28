const express = require("express");
const { getCollections } = require("../constants");
const verifyJWT = require("../verifyJWT");
const { ObjectId } = require("mongodb");
const router = express.Router();
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

router.get("/", async (req, res) => {
  const { userDetails, clientsCollection } = await getCollections();
  const { token } = req.headers;
  if (jwt.decode(token) !== null) {
    const { email } = jwt.decode(token);
    // console.log(email);
    const data = await userDetails.findOne({ user_email: email });
    const data2 = await clientsCollection.findOne({ emailId: email });
    // console.log({ data, data2 });
    res.send({ data: { ...data, ...data2 } });
  } else {
    res.status(401).send("Unauthorized Access");
  }
});

router.get("/:user_id", async (req, res) => {
  const { user_id } = req.params;
  const { userDetails, clientsCollection } = await getCollections();

  const user2 = await clientsCollection.findOne({ "user-id": user_id });

  // console.log(user_id, user2);

  const user = await clientsCollection.findOne({ "user-id": user_id });
  //   console.log(user, user2);
  console.log({ ...user, ...user2 });
  res.send({ ...user, ...user2 });
});

router.put("/:user_email", async (req, res) => {
  const { user_email } = req.params;
  const { clientsCollection } = await getCollections();

  // console.log(user_email, req.body);
  const newBody = { ...req.body };
  // console.log(newBody);
  delete newBody._id;
  const updateCursor = await clientsCollection.updateOne(
    { user_email },
    { $set: newBody },
    { upsert: false }
  );

  res.send(updateCursor);
});

module.exports = router;