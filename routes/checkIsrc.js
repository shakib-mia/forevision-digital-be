const express = require("express");
const { getCollections } = require("../constants");
const router = express.Router();

router.get("/:isrc", async (req, res) => {
  const { isrc } = req.params;
  const { isrcWithIDCollection } = await getCollections();
  const foundCursor = await isrcWithIDCollection.find({ isrc }).toArray();

  // //   console.log(foundCursor);
  res.send(foundCursor);
});

module.exports = router;
