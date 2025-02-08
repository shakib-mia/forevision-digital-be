const express = require("express");
const { getCollections } = require("../constants");
const verifyJWT = require("../verifyJWT");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { ObjectId } = require("mongodb");

router.get("/", verifyJWT, async (req, res) => {
  const { recordLabelsCollection } = await getCollections();

  const { email } = jwt.decode(req.headers.token);
  // //   console.log(email);

  const recordLabels = await recordLabelsCollection
    .find({
      "Email ID": email,
    })
    .toArray();

  const names = recordLabels
    .map((item) => item["Sub-Label Name"])
    .filter((item) => item !== "__________");

  // console.log(names);

  res.send([...names, "ForeVision Digital"]); // forevision digital is common for all
});

// For Admin

router.get("/all", verifyJWT, async (req, res) => {
  const { recordLabelsCollection } = await getCollections();

  const recordLabels = await recordLabelsCollection
    .find({ status: "Requested" })
    .toArray();

  res.send(recordLabels);
});

router.post("/", verifyJWT, async (req, res) => {
  const { recordLabelsCollection } = await getCollections();

  const { body } = req;

  // console.log(body);

  const recordLabels = await recordLabelsCollection.find({}).toArray();

  const found = recordLabels.find(
    (item) => item["Sub-Label Name"] === body["Sub-Label Name"]
  );

  // console.log(found);

  if (!found) {
    const postCursor = await recordLabelsCollection.insertOne(body);

    res.send(postCursor);
  } else {
    res.status(409).send("Record Label Already Exists");
  }
});

router.put("/:_id", async (req, res) => {
  const { _id } = req.params;
  const updateData = req.body;
  const { recordLabelsCollection } = await getCollections();
  delete updateData._id;

  const label = await recordLabelsCollection.updateOne(
    { _id: new ObjectId(_id) },
    { $set: updateData },
    { upsert: false }
  );

  res.send(label);
  // console.log(updateData, _id);
});

router.post("/:_id", async (req, res) => {
  //   console.log(req.params._id, req.body);
  const { recordLabelsCollection, notificationsCollections } =
    await getCollections();

  const { _id } = req.params;
  const deleteCursor = await recordLabelsCollection.deleteOne({
    _id: new ObjectId(_id),
  });

  const timeStamp = Math.floor(new Date().getTime() / 1000);

  const notification = {
    email: req.body.emailId,
    message: req.body.message,
    date: timeStamp,
    read: false,
  };

  const notificationCursor = await notificationsCollections.insertOne(
    notification
  );

  res.send({ deleteCursor, notificationCursor });
});

module.exports = router;
