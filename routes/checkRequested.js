const express = require("express");
const { getCollections } = require("../constants");
const router = express.Router();

router.get("/:emailId", async (req, res) => {
  const { emailId } = req.params;
  const { withdrawalRequest } = await getCollections();

  const found = await withdrawalRequest.findOne({ emailId });
  console.log(found);

  res.send(found);
});

module.exports = router;
