const express = require("express");
const router = express.Router();

const { getCollections } = require("../constants");

router.get("/:platformName/:uploadDate", async (req, res) => {
  const { platformName, uploadDate } = req.params;
  const { revenueCollections } = await getCollections();

  const deletedCursor = await revenueCollections.deleteMany({
    platformName,
    uploadDate,
  });
  res.send(deletedCursor);
});

router.get("/:uploadDate", async (req, res) => {
  const { uploadDate } = req.params;
  const { revenueCollections } = await getCollections();
  const pipeline = [
    {
      $match: {},
    },
    {
      $project: {
        _id: 0,
        "final revenue": 1,
        platformName: 1,
      },
    },
  ];
  const found = await revenueCollections.aggregate(pipeline).toArray();
  // //   console.log(pipeline);
  const types = [];
  for (const item of found) {
    if (typeof item["final revenue"] !== "number") {
      types.push(item);
    }
  }
  res.send(types);
});

module.exports = router;
