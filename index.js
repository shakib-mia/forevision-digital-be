require("dotenv").config();
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.db_username}:${process.env.db_password}@cluster0.i4vpazx.mongodb.net/?retryWrites=true&w=majority`;
const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const verifyJWT = require("./verifyJWT");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");

app.use(express());
const corsOptions = {
  origin: "*",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true, // Allow cookies and credentials
};
app.use(cors(corsOptions));
app.options("*", cors());

// app.options("/revenue", cors()); // Handle preflight requests
// app.options("/dashboard", cors()); // Handle preflight requests

app.use(express.json());
app.use(bodyParser.json());

const transporter = nodemailer.createTransport({
  host: "smtp.hostinger.com", // Replace with your Hostinger SMTP server
  port: 587, // Typically, SMTP uses port 587
  secure: false, // Set to true if you are using SSL/TLS
  auth: {
    user: process.env.emailAddress,
    pass: process.env.emailPass,
  },
});

const port = process.env.port;

app.get("/", (req, res) => {
  res.send(`from port: ${port}`);
});

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    const adminsCollection = await client
      .db("forevision-digital")
      .collection("admins"); // admins collection

    const clientsCollection = await client
      .db("forevision-digital")
      .collection("client-with-isrc-collection"); // users collection

    const demoClientsCollection = await client
      .db("forevision-digital")
      .collection("demo-clients"); // users collection

    const isrcCollection = await client
      .db("forevision-digital")
      .collection("isrc-with-id"); // ISRC collection

    const platformsCollection = await client
      .db("forevision-digital")
      .collection("platform-name"); // platform-name

    const revenueCollections = await client
      .db("forevision-digital")
      .collection("demo-revenue"); // demo-revenue
    const usersCollection = await client
      .db("forevision-digital")
      .collection("user-credentials-db");

    const userDetails = await client
      .db("forevision-digital")
      .collection("user-details");

    const demoClients = await client
      .db("forevision-digital")
      .collection("demo-clients");

    /**
     *
     * Getting all users
     *
     * */
    app.get("/users", verifyJWT, async (req, res) => {
      const usersCursor = await clientsCollection.find({});
      const users = await usersCursor.toArray();

      res.send(users);
    });

    /**
     *
     * Register Section
     *
     *
     * **/

    app.post("/register", async (req, res) => {
      const userExist = await adminsCollection.findOne({
        email: req.body.email,
      });

      // if user doesn't exist
      if (userExist === null) {
        // encrypting
        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync(req.body.password, salt);

        const user = {
          email: req.body.email,
          password: hash,
        };

        const registerCursor = await adminsCollection.insertOne(user);
        res.send(registerCursor);
      } else {
        // if user exists
        res.send("user already exist");
      }
    });

    app.get("/dashboard", verifyJWT, async (req, res) => {
      try {
        const usersCursor = await clientsCollection.find({});
        const clientsCursor = await demoClientsCollection.find({});
        const clients = await clientsCursor.toArray();

        const users = await usersCursor.toArray();
        const pipeline = [
          {
            $project: {
              _id: 0,
              "final revenue": 1,
            },
          },
        ];

        const revenues = (
          await revenueCollections.aggregate(pipeline).toArray()
        ).map((item) => item["final revenue"]);

        const result = await clientsCollection
          .aggregate([
            {
              $match: {
                isrc: { $ne: null },
              },
            },
            {
              $group: {
                _id: null,
                totalISRCs: {
                  $sum: {
                    $size: { $split: ["$isrc", ","] },
                  },
                },
              },
            },
          ])
          .toArray();

        const topContributor = users.reduce(
          (max, obj) =>
            obj.isrc?.split(",").length > max.isrc?.split(",").length
              ? obj
              : max,
          users[0]
        );

        res.send({
          usersCount: users.length,
          isrcCount: result[0].totalISRCs,
          topContributor,
          grandTotalRevenue: 0,
        });
      } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Internal Server Error");
      }
    });

    app.get("/top-performer", async (req, res) => {
      const allClientsCursor = await demoClients.find({});
      const allClients = await allClientsCursor.toArray();
      const revenues = allClients.map((item) => item.lifeTimeRevenue);
      const existingRevenues = [];
      for (const revenue of revenues) {
        // console.log(revenue !== undefined);
        if (revenue !== undefined && revenue.toString() !== "NaN") {
          existingRevenues.push(revenue);
        }
      }

      const max = Math.max(...existingRevenues);
      res.send(allClients.find((item) => item.lifeTimeRevenue === max));
      // console.log(Math.max(...existingRevenues));
    });

    app.get("/platforms", verifyJWT, async (req, res) => {
      const platformsCursor = await platformsCollection.find({});
      const platforms = await platformsCursor.toArray();

      res.send(platforms);
    });

    app.post("/login", async (req, res) => {
      const { email, password } = req.body;
      const admin = await adminsCollection.findOne({ email });
      // console.log(admin);

      if (admin !== null) {
        if (bcrypt.compareSync(password, admin.password)) {
          const token = jwt.sign({ email }, process.env.access_token_secret, {
            expiresIn: "1h",
          });

          res.send({ token });
        }
      } else {
        res.status(401).send({ message: "no user found" });
      }
    });

    app.post("/revenue-upload", verifyJWT, async (req, res) => {
      const data = req.body;

      const uploadCursor = await revenueCollections.insertMany(data);

      res.send(uploadCursor);
    });

    app.post("/revenue", verifyJWT, async (req, res) => {
      const { page, currentPage } = req.body;
      const revenueCursor = await revenueCollections.find({}).limit(100);
      const revenues = await revenueCursor.toArray();
      // const data = revenues.splice(currentPage * 50, 50);
      const data = revenues;

      res.send({ data, count: revenues.length });
    });

    app.get("/user-revenue", verifyJWT, async (req, res) => {
      const { email } = jwt.decode(req.headers.token);

      const clientsCursor = await clientsCollection.findOne({
        emailId: email,
      });

      // const

      const isrcs = [];

      if (clientsCollection !== null) {
        if (clientsCursor !== null) {
          clientsCursor.isrc.split(",").map((item) => isrcs.push(item.trim()));
          res.send(isrcs);
        } else {
          res.send({ message: "No isrc found in clientsCursor" });
        }
      } else {
        res.send({ message: "clientsCollection is null" });
      }

      // isrcs.map((isrc) => {
      //   const revenueCursor = revenueCollections.findOne({ isrc });
      // });
      // for (const isrc of isrcs) {
      //   const revenueCursor = await revenueCollections.find({ isrc });
      //   const allRevenues = await revenueCursor.toArray();

      //   // res.send(allRevenues);
      //   // revenueCursor !== null && revenues.push(revenueCursor);
      // }
    });

    app.get("/user-revenue/:isrc", async (req, res) => {
      const pipeline = [
        {
          $match: { isrc: req.params.isrc },
        },
        {
          $project: {
            _id: 0,
            "final revenue": 1,
            song_name: 1,
            platform_name: 1,
            album: 1,
            track_artist: 1,
            label: 1,
            isrc: 1,
            total: 1,
            "after tds revenue": 1,
          },
        },
      ];

      const revenues = await revenueCollections.aggregate(pipeline).toArray();
      res.send({ revenues });
    });

    app.post("/songs-for-isrc", async (req, res) => {
      const { isrcs } = req.body;

      const songs = await revenueCollections
        .find({ isrc: { $in: isrcs } })
        .toArray();
      res.send(songs);
    });

    app.delete(
      "/revenue/:month/:year/:platform",
      verifyJWT,
      async (req, res) => {
        const deleteCursor = await revenueCollections.deleteMany({
          uploadDate: `${req.params.year}-${req.params.month}`,
          platformName: req.params.platform,
        });
        res.send(deleteCursor);
      }
    );

    app.post("/user-login", cors(), async (req, res) => {
      const { email, password } = req.body;
      const userCursor = await usersCollection.findOne({ user_email: email });
      const details = await userDetails.findOne({ user_email: email });
      if (userCursor !== null) {
        bcrypt.compare(password, userCursor.user_password, (err, result) => {
          if (result) {
            // res.send({ message: "success" });
            const token = jwt.sign({ email }, process.env.access_token_secret, {
              expiresIn: "1h",
            });

            res.send({ token, details });
          } else {
            res.status(401).send({ message: "incorrect password" });
          }
        });
      } else {
        res.status(401).send({ message: "no user found" });
      }
    });

    app.post("/reset-password", async (req, res) => {
      const { user_email } = req.body;
      const usersCursor = await usersCollection.findOne({ user_email });
      // console.log(usersCursor === null);
      // res.send(usersCursor);

      function generatePassword() {
        var length = 8,
          charset =
            "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
          retVal = "";
        for (var i = 0, n = charset.length; i < length; ++i) {
          retVal += charset.charAt(Math.floor(Math.random() * n));
        }
        return retVal;
      }
      if (usersCursor !== null) {
        const newPassword = generatePassword();

        var message = {
          from: process.env.emailAddress,
          to: user_email,
          subject: "Reset Password",
          // text: "Plaintext version of the message",
          html: `<div>
          Your New Password is
          <h1>${newPassword}</h1>
          </div>`,
        };

        transporter.sendMail(message, async (error, info) => {
          if (error) {
            console.error(error);
            res.status(500).send(error);
          } else {
            // res.send("Email sent successfully");
            bcrypt.hash(newPassword, 10, async function (err, hash) {
              // Store hash in your password DB.
              if (hash.length) {
                const updateCursor = await usersCollection.updateOne(
                  { user_email },
                  { $set: { ...usersCursor, user_password: hash } },
                  { upsert: false }
                );

                res.send(updateCursor);
              }
            });
          }
        });
      } else {
        res.status(401).send({ message: "no user found" });
      }
    });

    app.get("/getUserData", async (req, res) => {
      const { token } = req.headers;
      if (jwt.decode(token) !== null) {
        const { email } = jwt.decode(token);

        const data = await userDetails.findOne({ user_email: email });
        // console.log(data);
        res.send({ data });
      }
    });

    app.post("/user-signup", async (req, res) => {
      const reqBody = req.body;
      const userExist = await userDetails.find({
        user_email: reqBody.email,
      });
      const user = await usersCollection.findOne({
        user_email: reqBody.email,
      });

      const users = await userExist.toArray();

      // console.log();
      if (users.length === 0 && user === null) {
        bcrypt.hash(reqBody.password, 10, async function (err, hash) {
          if (hash.length) {
            // Store hash in your password DB.
            // if (hash.length) {
            const user = {
              user_email: reqBody.email,
              user_password: hash,
            };

            const registerCursor = await usersCollection.insertOne(user);
            res.send(registerCursor);
            // console.log(registerCursor);
            // }
          }
        });
      } else {
        res.status(401).send("user already exist");
      }
    });

    app.post("/post-user-details", async (req, res) => {
      const { user_email } = req.body;
      const foundUserDetails = await userDetails.findOne({ user_email });
      if (foundUserDetails === null) {
        const userDetailsCursor = await userDetails.insertOne(req.body);

        res.send(userDetailsCursor);
      }
    });

    app.get("/all-users", async (req, res) => {
      const usersCursor = await demoClientsCollection.find({});
      const users = await usersCursor.toArray();

      res.send(users);
    });

    app.get("/all-users/:cat/:data", async (req, res) => {
      const usersCursor = await demoClientsCollection.find({});
      const users = await usersCursor.toArray();

      const foundUser = [];

      for (const user of users) {
        if (user[req.params.cat]) {
          // console.log(user);
          if (user[req.params.cat].toLowerCase().includes(req.params.data)) {
            foundUser.push(user);
          }
        }
      }

      res.send(foundUser);
    });

    app.get("/lifetime-revenue/:userId?", async (req, res) => {
      try {
        const user = await demoClients.findOne({
          _id: new ObjectId(req.params.userId),
        });

        // console.log(user);

        const isrcs = user.isrc.split(","); // Assuming ISRCs are provided as a comma-separated list

        const pipeline = [
          {
            $match: { isrc: { $in: isrcs } },
          },
          {
            $project: {
              _id: 0,
              "final revenue": 1,
            },
          },
        ];
        const revenues = (
          await revenueCollections.aggregate(pipeline).toArray()
        ).map((item) => item["final revenue"]);

        res.send(revenues);

        const sum = revenues.reduce(
          (accumulator, currentValue) => accumulator + parseFloat(currentValue),
          0
        );

        const updateCursor = await demoClients.updateOne(
          { _id: new ObjectId(req.params.userId) },
          { $set: { ...user, lifeTimeRevenue: sum } },
          {
            upsert: true,
          }
        );

        // res.send(updateCursor);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
      }
    });
  } finally {
  }
}
run().catch(console.dir);

app.listen(port, () => console.log("listening on port", port));
