const express = require("express");
const router = express.Router();
const { getCollections } = require("../constants");

router.get("/", async (req, res) => {
  const {
    clientsCollection,
    demoClientsCollection,
    revenueCollections,
    paymentHistory,
  } = await getCollections();

  try {
    // Fetch counts directly from the database
    const [usersCount, clientsCount] = await Promise.all([
      clientsCollection.countDocuments(),
      demoClientsCollection.countDocuments(),
    ]);

    // Revenue calculation pipeline
    const finalRevenueResult = await revenueCollections
      .aggregate([
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: { $toDouble: "$royality" } },
          },
        },
      ])
      .toArray();
    const finalRevenue = finalRevenueResult[0]?.totalRevenue || 0;

    // ISRC count pipeline
    const isrcCountResult = await clientsCollection
      .aggregate([
        {
          $match: {
            isrc: { $ne: null },
          },
        },
        {
          $project: {
            isrcCount: { $size: { $split: ["$isrc", ","] } },
          },
        },
        {
          $group: {
            _id: null,
            totalCount: { $sum: "$isrcCount" },
          },
        },
      ])
      .toArray();
    const isrcCount = isrcCountResult[0]?.totalCount || 0;

    // Total payment calculation
    const totalPaidResult = await paymentHistory
      .aggregate([
        {
          $match: {
            disbursed: true, // Exclude documents where disbursed is false
          },
        },
        {
          $group: {
            _id: null,
            totalPaid: { $sum: { $toDouble: "$totalAmount" } },
          },
        },
      ])
      .toArray();

    const totalPaid = totalPaidResult[0]?.totalPaid || 0;

    // Send the optimized response
    res.send({
      usersCount,
      clientsCount,
      isrcCount,
      finalRevenue,
      totalPaid,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
});

module.exports = router;
