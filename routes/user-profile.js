const express = require("express");
const router = express.Router();
const verifyJWT = require("../verifyJWT"); // Make sure to provide the correct path
const { getCollections } = require("../constants");
const jwt = require("jsonwebtoken");

router.get("/", verifyJWT, async (req, res) => {
  const { userProfileCollection } = await getCollections();
  const { email } = jwt.decode(req.headers.token);
  // //   console.log(clientsCollection);
  const usersCursor = await userProfileCollection.find({ user_email: email });
  const users = await usersCursor.toArray();

  res.send(users);
});

router.post("/", verifyJWT, async (req, res) => {
  const { userProfileCollection } = await getCollections();

  const postCursor = await userProfileCollection.insertOne(req.body);

  res.send(postCursor);
});

module.exports = router;
