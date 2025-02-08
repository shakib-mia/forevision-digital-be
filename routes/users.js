// users.js
const express = require("express");
const router = express.Router();
const verifyJWT = require("../verifyJWT"); // Make sure to provide the correct path
const { getCollections } = require("../constants");

// Your /users route logic
router.get("/", async (req, res) => {
  const { clientsCollection } = await getCollections();
  // //   console.log(clientsCollection);
  const usersCursor = await clientsCollection.find({});
  const users = await usersCursor.toArray();

  res.send(users);
});

module.exports = router;
