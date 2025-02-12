const express = require("express");
const router = express.Router();
const { getCollections } = require("../constants");
const verifyJWT = require("../verifyJWT");
const { ObjectId } = require("mongodb");

router.get("/", verifyJWT, async (req, res) => {
  const { platformsCollection } = await getCollections();
  const platformsCursor = await platformsCollection.find({});
  const platforms = await platformsCursor.toArray();

  res.send(platforms.filter((item) => item.platformType !== "Unknown"));
});

router.get("/admin", async (req, res) => {
  const { platformsCollection } = await getCollections();
  const platformsCursor = await platformsCollection.find({});
  const platforms = await platformsCursor.toArray();

  console.log(platforms);
  res.send(platforms);
});

router.get("/all", async (req, res) => {
  const { platformsCollection } = await getCollections();
  const platformsCursor = await platformsCollection.find({});
  const platformsDivision = await platformsCursor.toArray();

  let platforms = [];

  for (const item of platformsDivision) {
    platforms = [...platforms, ...item.platforms];
  }

  // Add the logo_url field to each platform
  const platformsWithLogos = platforms.map((platform) => {
    const formattedName = platform.cat_name.toLowerCase().replace(/\s+/g, "-"); // Replace spaces with dashes and convert to lowercase
    const logo_url = `https://api.forevisiondigital.in/uploads/platforms/${formattedName}.png`; // Adjust the path and file extension as needed

    return { ...platform, logo_url };
  });

  res.send(platformsWithLogos);
});

module.exports = router;
