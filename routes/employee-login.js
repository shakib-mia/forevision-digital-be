const express = require("express");
const { getCollections } = require("../constants");
const verifyJWT = require("../verifyJWT");
const { ObjectId } = require("mongodb");
const router = express.Router();
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

router.post("/", async (req, res) => {
  const { employeesCollection } = await getCollections();
  const { employeeCode, employeePassword } = req.body;

  try {
    // Check if the employee exists
    const found = await employeesCollection.findOne({ employeeCode });

    if (!found) {
      return res.status(401).json({ message: "User does not exist" });
    }
    //   console.log(found.password, employeePassword);

    // Check if the password matches
    if (found.password !== employeePassword) {
      return res.status(401).json({ message: "Incorrect password" });
    }

    // Generate a token
    const token = jwt.sign(
      { employeeCode: found.employeeCode, role: found.role },
      process.env.access_token_secret, // Replace with your secret key
      { expiresIn: "30m" }
    );

    // Respond with the token
    return res.status(200).json({
      token,
      role: found.role,
      name: found.name,
    });
  } catch (error) {
    console.error("Error during login:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;
