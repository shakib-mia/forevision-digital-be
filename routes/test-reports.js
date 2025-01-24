const express = require("express");
const router = express.Router();
const multer = require("multer");
const fs = require("fs");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { getCollections } = require("../constants");

router.get("/", async (req, res) => {
  const { testReports } = await getCollections();
  const reports = await testReports.find({}).toArray();

  res.send(reports);
});

module.exports = router;
