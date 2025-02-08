const express = require("express");
const { getCollections, client } = require("../constants");
const router = express.Router();
const jwt = require("jsonwebtoken");

router.get("/", async (req, res) => {
  const { userDetails } = await getCollections();
  const userIds = await userDetails
    .find({}, { projection: { "user-id": 1, _id: 0 } })
    .toArray();
  // Map the results to an array of user-id values
  const userIdArray = userIds.map((user) => user["user-id"]);

  res.send(userIdArray);
});

router.get("/by-email-id/:user_email", async (req, res) => {
  const { userDetails, clientsCollection } = await getCollections();
  const { user_email } = req.params;

  const data = await userDetails.findOne({ user_email });
  const data2 = await clientsCollection.findOne({ emailId: user_email });

  const user = { ...data, ...data2 };

  // Use the full first name
  const firstNamePart = user.first_name.toLowerCase();

  // Take the first character of the last name
  const lastNamePart = user.last_name.substring(0, 1).toLowerCase();

  // Combine with a unique number (e.g., last 4 digits of the current timestamp)
  const uniqueNumber = Date.now().toString().slice(-4);

  // Combine to form the user ID
  const userId = `${firstNamePart}${lastNamePart}${uniqueNumber}`;

  data2["user-id"] = userId;
  // console.log(data2);
  const newData = { ...data2 };
  delete newData._id;
  //   console.log(newData);

  const updateCursor = await clientsCollection.updateOne(
    { _id: data2._id },
    {
      $set: newData,
    },
    {
      upsert: false,
    }
  );

  res.send({ updateCursor, userId });

  // res.send(userId);
});

// For updating the user ID

/******************************
 *  !!!!!!!!!!!!!!!!!!!! DANGER !!!!!!!!!!!!!!!!!!!!!!!!
 *
 *    this will change all users' userid
 *   ***********************************************/

router.get("/all", async (req, res) => {
  const { userDetails, clientsCollection } = await getCollections();

  // Fetch all users from both collections
  const usersDetailsList = await userDetails.find({}).toArray();
  const clientsCollectionList = await clientsCollection.find({}).toArray();

  // Merge both collections by user_email/emailId
  const allUsers = [...usersDetailsList, ...clientsCollectionList];

  const uniqueUsers = {};

  // Iterate through all users and generate a unique user ID
  for (let user of allUsers) {
    // Skip users without a first name, last name, or email
    if (
      !user.first_name ||
      !user.last_name ||
      (!user.user_email && !user.emailId)
    )
      continue;

    // Sanitize the first name: remove spaces and special characters
    const firstNamePart = user.first_name
      .replace(/[^a-zA-Z0-9]/g, "")
      .toLowerCase();

    // Sanitize the last name: take the first character, remove any special characters
    const lastNamePart = user.last_name
      .substring(0, 1)
      .replace(/[^a-zA-Z0-9]/g, "")
      .toLowerCase();

    // Combine with a unique number (e.g., last 4 digits of the current timestamp)
    const uniqueNumber = Date.now().toString().slice(-4);

    // Combine to form the user ID
    const userId = `${firstNamePart}${lastNamePart}${uniqueNumber}`;

    const email = user.user_email || user.emailId;

    uniqueUsers[email] = userId;

    // Update the userDetails collection with the generated user ID
    if (user.user_email) {
      await userDetails.updateOne(
        { user_email: user.user_email }, // Find the user by email
        { $set: { "user-id": userId } } // Set the user-id field
      );

      await clientsCollection.updateOne(
        { emailId: user.user_email }, // Find the user by email
        { $set: { "user-id": userId } } // Set the user-id field
      );
    }
  }

  res.send(uniqueUsers);
});

// router.get("/all", async (req, res) => {
//   const { userDetails } = await getCollections();
//   const users = await userDetails.find({}).toArray();

//   res.send(users);
// });

module.exports = router;
