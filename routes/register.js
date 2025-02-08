const express = require("express");
const router = express.Router();
const { getCollections } = require("../constants");
const bcrypt = require("bcrypt");

// Your /users route logic
router.post("/", async (req, res) => {
  const { adminsCollection } = await getCollections();
  // console.log(adminsCollection);
  //   console.log(req.body);
  const userExist = await adminsCollection.findOne({
    email: req.body.email,
  });

  // if user doesn't exist
  if (userExist === null) {
    // encrypting
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(req.body.password, salt);

    const user = {
      email: req.body.email,
      password: hash,
    };

    const registerCursor = await adminsCollection.insertOne(user);
    res.send(registerCursor);
  } else {
    // if user exists
    res.send("user already exist");
  }
});

module.exports = router;
