const express = require("express");
const { getCollections } = require("../constants");
const verifyJWT = require("../verifyJWT");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { ObjectId } = require("mongodb");

router.get("/", async (req, res) => {
  const { token } = req.headers;
  const { clientsCollection } = await getCollections();

  //   console.log(token);
  const { email } = jwt.decode(token);

  //   console.log(email);
  const userData = await clientsCollection.findOne({ emailId: email });
  console.log(userData);
});

module.exports = router;
