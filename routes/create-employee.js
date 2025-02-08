const express = require("express");
const { getCollections } = require("../constants");
const verifyJWT = require("../verifyJWT");
const { ObjectId } = require("mongodb");
const router = express.Router();
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const generatePassword = (length = 6) => {
  return crypto.randomBytes(length).toString("base64").slice(0, length);
};

const generateEmployeeCode = async () => {
  // Get the highest current employee code number and increment it
  const { employeesCollection } = await getCollections();
  const latestEmployee = await employeesCollection.findOne(
    {},
    { sort: { employeeCode: -1 } }
  );
  let newCodeNumber = 1;

  if (latestEmployee && typeof latestEmployee.employeeCode === "string") {
    // Extract the numeric part of the code (after 'FVDE')
    const numericPart = latestEmployee.employeeCode.replace("FVDE", "");
    const currentCodeNumber = parseInt(numericPart, 10);

    // Check if the extracted number is valid
    if (!isNaN(currentCodeNumber)) {
      newCodeNumber = currentCodeNumber + 1;
    }
  }

  // Generate the new employee code with the correct format
  const newEmployeeCode = `FVDE${newCodeNumber.toString().padStart(5, "0")}`;
  //   console.log(newEmployeeCode);

  return newEmployeeCode;
};

router.get("/", async (req, res) => {
  const { employeesCollection } = await getCollections();

  const employees = await employeesCollection.find({}).toArray();

  res.send(employees);
});

router.post("/create-employee", async (req, res) => {
  const db = req.app.locals.db; // Get MongoDB instance
  const { name, role } = req.body; // Expecting name and role from the admin
  const { employeesCollection } = await getCollections();

  try {
    // Generate employee code
    const employeeCode = await generateEmployeeCode();

    // console.log(employeeCode);

    // Generate password
    const password = generatePassword();

    // Create employee object
    const newEmployee = {
      employeeCode,
      name,
      role,
      password: password,
    };

    // Insert into the database
    // await db.collection("employees").insertOne(newEmployee);
    const insertCursor = await employeesCollection.insertOne(newEmployee);

    // Return the generated code and password to the admin
    // if (insertCursor.insertedId.length) {
    res.send({
      message: "Employee created successfully",
      employeeCode,
      password,
    });
    // }
  } catch (error) {
    console.error("Error creating employee:", error);
    res.status(500).send("Internal Server Error");
  }
});

router.get("/check-role", verifyJWT, async (req, res) => {
  const { token } = req.headers;
  const { role } = jwt.decode(token);
  // console.log();

  res.send({ role: role || jwt.decode(token).email.split("@")[0] });

  // console.log();
});

router.delete("/:_id", async (req, res) => {
  const { _id } = req.params;
  const { employeesCollection } = await getCollections();

  const deleteCursor = await employeesCollection.deleteOne({
    _id: new ObjectId(_id),
  });

  res.send(deleteCursor);
});

module.exports = router;
