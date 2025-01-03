const express = require("express");
const { getCollections } = require("../constants");
const verifyJWT = require("../verifyJWT");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { ObjectId } = require("mongodb");

router.post("/", verifyJWT, async (req, res) => {
  const { couponCodesCollection } = await getCollections();

  const insertCursor = await couponCodesCollection.insertOne(req.body);
  res.send(insertCursor);
});

router.get("/", verifyJWT, async (req, res) => {
  const { couponCodesCollection } = await getCollections();

  const coupons = await couponCodesCollection.find({}).toArray();

  res.send(coupons);
});

router.get("/:couponCode", async (req, res) => {
  const { couponCode } = req.params;
  const { couponCodesCollection } = await getCollections();
  const requestedPlanName = req.headers.planname;

  try {
    // Find the coupon code in the collection
    const couponCodeCursor = await couponCodesCollection.findOne({
      couponCode,
    });

    if (couponCodeCursor !== null) {
      const currentDate = new Date();
      const validFrom = new Date(couponCodeCursor.validFrom);
      const validTill = new Date(couponCodeCursor.validTill);

      // Check if the plan is associated with the coupon
      if (!couponCodeCursor.plan.includes(requestedPlanName)) {
        return res.status(400).send({
          message: "Invalid Coupon Code for this Plan",
        });
      }

      // Check if the coupon is within the valid date range
      if (currentDate >= validFrom && currentDate <= validTill) {
        return res.send(couponCodeCursor);
      } else {
        return res.status(410).send({
          message: "Coupon Code Expired",
        });
      }
    } else {
      // Coupon code is invalid
      return res.status(400).send({
        message: "Invalid Coupon Code",
      });
    }
  } catch (error) {
    console.error("Error processing coupon code:", error);
    return res.status(500).send({
      message: "Internal Server Error",
    });
  }
});

router.delete("/:_id", verifyJWT, async (req, res) => {
  const { _id } = req.params;
  const { couponCodesCollection } = await getCollections();

  const deletedCursor = await couponCodesCollection.deleteOne({
    _id: new ObjectId(_id),
  });
  // console.log(id);
  res.send(deletedCursor);
});

module.exports = router;
