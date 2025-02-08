const express = require("express");
const router = express.Router();
const { getCollections } = require("../constants");
const verifyJWT = require("../verifyJWT");
const jwt = require("jsonwebtoken");

router.get("/:user_email", async (req, res) => {
  const { usersCollection, userDetails } = await getCollections();
  const { user_email } = req.params;
  const userData = await usersCollection.findOne({ user_email });
  // //   console.log(userData);

  if (userData !== null) {
    const token = jwt.sign(
      { email: userData.user_email },
      process.env.access_token_secret,
      {
        expiresIn: "1h",
      }
    );

    const details = await userDetails.findOne({ user_email });

    res.send({ token, details });
  } else {
    res.status(401).send({ message: "no user found" });
  }

  //   res.send(userData);
});

module.exports = router;
