require("dotenv").config();
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.db_username}:${process.env.db_password}@cluster0.i4vpazx.mongodb.net/?retryWrites=true&w=majority`;
const express = require("express");
const app = express();
const path = require("path");
const multer = require("multer");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const verifyJWT = require("./verifyJWT");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
const users = require("./routes/users");
const login = require("./routes/login");
const topPerformer = require("./routes/top-performer");
const register = require("./routes/register");
const userSignup = require("./routes/user-signup");
const dashboard = require("./routes/dashboard");
const platforms = require("./routes/platforms");
const revenueUpload = require("./routes/revenue-upload");
const userRevenue = require("./routes/user-revenue");
const postRevenue = require("./routes/post-revenue");
const disbursePayment = require("./routes/disbursePayment");
const songsForIsrc = require("./routes/songs-for-isrc");
const adminRevenue = require("./routes/adminRevenue");
const userLogin = require("./routes/user-logn");
const calculateLifetimeRevenue = require("./routes/calculate-lifetime-revenue");
const getDisbursePayment = require("./routes/getDisbursePayment");
const history = require("./routes/history");
const getCollections = require("./constants");

const paidData = [
  {
    client_name: "Humanity-A Vision",
    last_paid: "Sep-21",
    amount: 24229,
    emailId: "akashthakurmsva@gmail.com",
  },
  {
    client_name: "Rohit Gopalakrishnan",
    last_paid: "Dec-21",
    amount: 11847,
    emailId: "rohitextreme@gmail.com",
  },
  {
    client_name: "Gujuu Entertainment",
    last_paid: "Dec-21",
    amount: 6392,
    emailId: "Jaimaabadiya@gmail.com",
  },
  {
    client_name: "Ravi Kansal",
    last_paid: "Jan-21",
    amount: 3662.37,
    emailId: "kansal.ravi89@gmail.com",
  },
  {
    client_name: "Bloomfair Music",
    last_paid: "Jan-21",
    amount: 3044.28,
    emailId: "bloomfairproduction@gmail.com",
  },
  {
    client_name: "Gujuu Entertainment",
    last_paid: "Jan-22",
    amount: 21292,
    emailId: "Jaimaabadiya@gmail.com",
  },
  {
    client_name: "Ravi Kansal",
    last_paid: "Feb-22",
    amount: 17391,
    emailId: "kansal.ravi89@gmail.com",
  },
  {
    client_name: "Rohit Gopalakrishnan",
    last_paid: "Feb-22",
    amount: 39385,
    emailId: "rohitextreme@gmail.com",
  },
  {
    client_name: "Vipin Agnihotri",
    last_paid: "Feb-22",
    amount: 1210,
    emailId: "vipin.agnihotrijournalist@gmail.com",
  },
  {
    client_name: "Raj Mirza",
    last_paid: "Feb-22",
    amount: 12837,
  },
  {
    client_name: "Gujuu Entertainment",
    last_paid: "Feb-22",
    amount: 39542,
    emailId: "Jaimaabadiya@gmail.com",
  },
  {
    client_name: "Gujuu Entertainment",
    last_paid: "Mar-22",
    amount: 32749,
    emailId: "Jaimaabadiya@gmail.com",
  },
  {
    client_name: "Rohit Gopalakrishnan",
    last_paid: "Mar-22",
    amount: 51671,
    emailId: "rohitextreme@gmail.com",
  },
  {
    client_name: "D Land",
    last_paid: "Mar-22",
    amount: 35555,
    emailId: "dlandmusic123@gmail.com",
  },
  {
    client_name: "Rohit Gopalakrishnan",
    last_paid: "May-22",
    amount: 6352,
    emailId: "rohitextreme@gmail.com",
  },
  {
    client_name: "Band Fusion",
    last_paid: "May-22",
    amount: 3783,
    emailId: "wrupsarkar@gmail.com",
  },
  {
    client_name: "Murmu Muzik Production",
    last_paid: "May-22",
    amount: 3927,
    emailId: "murmuproductionofficial@gmail.com",
  },
  {
    client_name: "ASHOKSARAVANAN",
    last_paid: "May-22",
    amount: 1528,
    emailId: "ashoksonsaravanan@gmail.com",
  },
  {
    client_name: "Silent Entertainments",
    last_paid: "May-22",
    amount: 1500,
    emailId: "behindshoots@gmail.com",
  },
  {
    client_name: "Kokborok Music Entertainment",
    last_paid: "May-22",
    amount: 4793,
    emailId: "gupidebbarma@gmail.com",
  },
  {
    client_name: "Soul Track Music",
    last_paid: "May-22",
    amount: 2885,
    emailId: "shubhsaxena555@gmail.com",
  },
  {
    client_name: "Rahul Kiran",
    last_paid: "Jul-22",
    amount: 16068,
    emailId: "sukiranavisions@gmail.com",
  },
  {
    client_name: "Ajit Kumar Films",
    last_paid: "Jul-22",
    amount: 75000,
    emailId: "beingodiotic@gmail.com",
  },
  {
    client_name: "Bucks Boy",
    last_paid: "Jul-22",
    amount: 3402,
    emailId: "sudarshansiddh27@gmail.com",
  },
  {
    client_name: "Laibuma Creation",
    last_paid: "Jul-22",
    amount: 13583,
    emailId: "salkadebbarma91@gmail.com",
  },
  {
    client_name: "Suraj Palodia Films Netwood Tv",
    last_paid: "Jul-22",
    amount: 4350,
    emailId: "palodiyasuraj1999@gmail.com",
  },
  {
    client_name: "Anupam Dutta",
    last_paid: "Aug-22",
    amount: 1606,
    emailId: "duttaa494@gmail.com",
  },
  {
    client_name: "Ravi Kansal",
    last_paid: "Aug-22",
    amount: 26593,
    emailId: "kansal.ravi89@gmail.com",
  },
  {
    client_name: "Raj Mirza",
    last_paid: "Aug-22",
    amount: 21781,
  },
  {
    client_name: "D Land",
    last_paid: "Aug-22",
    amount: 20701,
    emailId: "dlandmusic123@gmail.com",
  },
  {
    client_name: "Band Fusion",
    last_paid: "Sep-22",
    amount: 2310,
    emailId: "wrupsarkar@gmail.com",
  },
  {
    client_name: "Rahul Biswas",
    last_paid: "Sep-22",
    amount: 1055,
  },
  {
    client_name: "Rohit Gopalakrishnan",
    last_paid: "Sep-22",
    amount: 40604,
    emailId: "rohitextreme@gmail.com",
  },
  {
    client_name: "Silent Entertainments",
    last_paid: "Sep-22",
    amount: 1361,
    emailId: "behindshoots@gmail.com",
  },
  {
    client_name: "Kokborok Music Entertainment",
    last_paid: "Oct-22",
    amount: 4138,
    emailId: "gupidebbarma@gmail.com",
  },
  {
    client_name: "Murmu Muzik Production",
    last_paid: "Oct-22",
    amount: 4448,
    emailId: "murmuproductionofficial@gmail.com",
  },
  {
    client_name: "Jeet Music Assamese",
    last_paid: "Oct-22",
    amount: 1073,
    emailId: "zumanjeetofficial@gmail.com",
  },
  {
    client_name: "ASHOKSARAVANAN",
    last_paid: "Nov-22",
    amount: 1712,
    emailId: "ashoksonsaravanan@gmail.com",
  },
  {
    client_name: "D Land",
    last_paid: "Nov-22",
    amount: 16613,
    emailId: "dlandmusic123@gmail.com",
  },
  {
    client_name: "Rahul Kiran",
    last_paid: "Nov-22",
    amount: 38180,
    emailId: "sukiranavisions@gmail.com",
  },
  {
    client_name: "Soul Track Music",
    last_paid: "Dec-22",
    amount: 1826,
    emailId: "shubhsaxena555@gmail.com",
  },
  {
    client_name: "Ajit Kumar Films",
    last_paid: "Dec-22",
    amount: 86443,
    emailId: "beingodiotic@gmail.com",
  },
  {
    client_name: "Being Odiotic",
    last_paid: "Dec-22",
    amount: 56932,
    emailId: "beingodiotic@gmail.com",
  },
  {
    client_name: "Rohit Gopalakrishnan",
    last_paid: "Jan-23",
    amount: 20471,
    emailId: "rohitextreme@gmail.com",
  },
  {
    client_name: "Kokborok Music Entertainment",
    last_paid: "Jan-23",
    amount: 3084,
    emailId: "gupidebbarma@gmail.com",
  },
  {
    client_name: "MRD Films International",
    last_paid: "Feb-23",
    amount: 2073,
    emailId: "itsofficialrk@gmail.com",
  },
  {
    client_name: "LST Enterprise",
    last_paid: "Mar-23",
    amount: 1133,
    emailId: "langnehstudios@gmail.com",
  },
  {
    client_name: "D Land",
    last_paid: "Mar-23",
    amount: 17969,
    emailId: "dlandmusic123@gmail.com",
  },
  {
    client_name: "Bucks Boy",
    last_paid: "Mar-23",
    amount: 60278,
    emailId: "sudarshansiddh27@gmail.com",
  },
  {
    client_name: "Muzical Mind Yo!",
    last_paid: "Mar-23",
    amount: 1060,
    emailId: "muzicalmindyo@gmail.com",
  },
  {
    client_name: "Ravi Kansal",
    last_paid: "Mar-23",
    amount: 1119,
    emailId: "kansal.ravi89@gmail.com",
  },
  {
    client_name: "Band Fusion",
    last_paid: "Mar-23",
    amount: 1258,
    emailId: "wrupsarkar@gmail.com",
  },
  {
    client_name: "KOK Creation",
    last_paid: "Mar-23",
    amount: 7093,
    emailId: "opdewangan26@gmail.com",
  },
  {
    client_name: "Rohit Gopalakrishnan",
    last_paid: "Mar-23",
    amount: 7101,
    emailId: "rohitextreme@gmail.com",
  },
  {
    client_name: "FiMiX Music",
    last_paid: "Mar-23",
    amount: 2243,
    emailId: "fimixmusic.in@gmail.com",
  },
  {
    client_name: "Perfect Sandhu",
    last_paid: "Mar-23",
    amount: 5944,
    emailId: "perfectsandhuofficial@gmail.com",
  },
  {
    client_name: "Pareek Brothers",
    last_paid: "Mar-23",
    amount: 1719,
    emailId: "masterbadalpareek@gmail.com",
  },
  {
    client_name: "Being Odiotic",
    last_paid: "Apr-23",
    amount: 5735,
    emailId: "beingodiotic@gmail.com",
  },
  {
    client_name: "Ajit Kumar Films",
    last_paid: "Apr-23",
    amount: 24882,
    emailId: "beingodiotic@gmail.com",
  },
  {
    client_name: "Laibuma Creation",
    last_paid: "Apr-23",
    amount: 13453,
    emailId: "salkadebbarma91@gmail.com",
  },
  {
    client_name: "Murmu Muzik Production",
    last_paid: "Apr-23",
    amount: 6225,
    emailId: "murmuproductionofficial@gmail.com",
  },
  {
    client_name: "Jayantho",
    last_paid: "Apr-23",
    amount: 6887,
    emailId: "jayantho.15@gmail.com",
  },
  {
    client_name: "Jeet Music Assamese",
    last_paid: "May-23",
    amount: 1850,
    emailId: "zumanjeetofficial@gmail.com",
  },
  {
    client_name: "Om Shantih Production",
    last_paid: "May-23",
    amount: 9086,
    emailId: "omshantiproduction7023@gmail.com",
  },
  {
    client_name: "Rahul Kiran",
    last_paid: "May-23",
    amount: 31270,
    emailId: "sukiranavisions@gmail.com",
  },
  {
    client_name: "Suraj Palodia Films Netwood Tv",
    last_paid: "May-23",
    amount: 2534,
    emailId: "palodiyasuraj1999@gmail.com",
  },
  {
    client_name: "Bucks Boy",
    last_paid: "May-23",
    amount: 14366,
    emailId: "sudarshansiddh27@gmail.com",
  },
  {
    client_name: "Laibuma Creation",
    last_paid: "May-23",
    amount: 22942,
    emailId: "salkadebbarma91@gmail.com",
  },
  {
    client_name: "D Land",
    last_paid: "May-23",
    amount: 15395,
    emailId: "dlandmusic123@gmail.com",
  },
  {
    client_name: "Humanity-A Vision",
    last_paid: "May-23",
    amount: 26987,
    emailId: "akashthakurmsva@gmail.com",
  },
  {
    client_name: "Samprit Tigga",
    last_paid: "May-23",
    amount: 4151,
    emailId: "sadri.beatz@gmail.com",
  },
  {
    client_name: "Perfect Sandhu",
    last_paid: "Jun-23",
    amount: 1550,
    emailId: "perfectsandhuofficial@gmail.com",
  },
  {
    client_name: "Silent Entertainments",
    last_paid: "Jun-23",
    amount: 1838,
    emailId: "behindshoots@gmail.com",
  },
  {
    client_name: "360India",
    last_paid: "Jun-23",
    amount: 6900,
    emailId: "360meet@gmail.com",
  },
  {
    client_name: "bharath varma",
    last_paid: "Jun-23",
    amount: 4683,
    emailId: "bharathproductionsbvrm.2019@gmail.com",
  },
  {
    client_name: "Rohit Gopalakrishnan",
    last_paid: "Jul-23",
    amount: 19172,
    emailId: "rohitextreme@gmail.com",
  },
  {
    client_name: "Anupam Dutta",
    last_paid: "Jul-23",
    amount: 4266,
    emailId: "duttaa494@gmail.com",
  },
  {
    client_name: "Kokborok Music Entertainment",
    last_paid: "Jul-23",
    amount: 3238,
    emailId: "gupidebbarma@gmail.com",
  },
  {
    client_name: "Rahul Sathe",
    last_paid: "Jul-23",
    amount: 1402,
    emailId: "rahulsatheofficial@gmail.com",
  },
  {
    client_name: "Ishwar Bhakti Ras",
    last_paid: "Jul-23",
    amount: 2758,
    emailId: "sunilguptasinger@gmail.com",
  },
  {
    client_name: "Aditya Dalai",
    last_paid: "Aug-23",
    amount: 1381,
    emailId: "arinndalai@gmail.com",
  },
  {
    client_name: "Being Odiotic",
    last_paid: "Aug-23",
    amount: 73897,
    emailId: "beingodiotic@gmail.com",
  },
  {
    client_name: "Ajit Kumar Films",
    last_paid: "Aug-23",
    amount: 123415,
    emailId: "beingodiotic@gmail.com",
  },
  {
    client_name: "Bucks Boy",
    last_paid: "Aug-23",
    amount: 39954,
    emailId: "sudarshansiddh27@gmail.com",
  },
  {
    client_name: "Jinni Music",
    last_paid: "Aug-23",
    amount: 1684,
    emailId: "entertainmentjinni@gmail.com",
  },
  {
    client_name: "Om Shantih Production",
    last_paid: "Sep-23",
    amount: 9748,
    emailId: "omshantiproduction7023@gmail.com",
  },
  {
    client_name: "Trendani Music",
    last_paid: "Sep-23",
    amount: 26006,
    emailId: "trendanimusic@gmail.com",
  },
  {
    client_name: "Perfect Sandhu",
    last_paid: "Oct-23",
    amount: 1061,
    emailId: "perfectsandhuofficial@gmail.com",
  },
  {
    client_name: "Gill Armaan",
    last_paid: "Oct-23",
    amount: 34124,
    emailId: "hs59507@gmail.com",
  },
  {
    client_name: "Pindhood Records",
    last_paid: "Oct-23",
    amount: 2819,
    emailId: "pindhoodrecords@gmail.com",
  },
  {
    client_name: "Anupam Dutta",
    last_paid: "Oct-23",
    amount: 2089,
    emailId: "duttaa494@gmail.com",
  },
  {
    client_name: "Mani Bhawanigarh",
    last_paid: "Oct-23",
    amount: 18980,
    emailId: "manibhawanigarh7860@gmail.com",
  },
  {
    client_name: "Muzical Mind Yo!",
    last_paid: "Oct-23",
    amount: 1416,
    emailId: "muzicalmindyo@gmail.com",
  },
  {
    client_name: "D Land",
    last_paid: "Oct-23",
    amount: 22304,
    emailId: "dlandmusic123@gmail.com",
  },
  {
    client_name: "Pareek Brothers",
    last_paid: "Oct-23",
    amount: 1379,
    emailId: "masterbadalpareek@gmail.com",
  },
  {
    client_name: "Gill Armaan",
    last_paid: "Nov-23",
    amount: 64796,
    emailId: "hs59507@gmail.com",
  },
  {
    client_name: "Om Shantih Production",
    last_paid: "Dec-23",
    amount: 3888,
    emailId: "omshantiproduction7023@gmail.com",
  },
  {
    client_name: "Bucks Boy",
    last_paid: "Dec-23",
    amount: 57559,
    emailId: "sudarshansiddh27@gmail.com",
  },
  {
    client_name: "The Future Music",
    last_paid: "Dec-23",
    amount: 1185,
    emailId: "viparmar5@gmail.com",
  },
];

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
  const token = jwt.sign(
    { email: "rohitextreme@gmail.com" },
    process.env.access_token_secret,
    { expiresIn: "1h" }
  );

  res.send(`from port: ${port} ${token}`);
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
      .collection("isrcs"); // ISRC collection

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

    app.use("/users", users);
    app.use("/login", login);
    app.use("/top-performer", topPerformer);
    app.use("/register", register);
    app.use("/user-signup", userSignup);
    app.use("/dashboard", dashboard);
    app.use("/platforms", platforms);
    app.use("/revenue-upload", revenueUpload);
    app.use("/user-revenue", userRevenue);
    app.use("/revenue", postRevenue);
    app.use("/disburse-payment", disbursePayment);
    app.use("/songs-for-isrc", songsForIsrc);
    app.use("/admin-royalty", adminRevenue);
    app.use("/calculate-lifetime-revenue", calculateLifetimeRevenue);
    app.use("/disburse-payment", getDisbursePayment);
    app.use("/history", history);
    // app.use("/user-login", userLogin);

    const storage = multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, "uploads/"); // Specify the destination folder
      },
      filename: function (req, file, cb) {
        const originalname = file.originalname.split(".")[0]; // Extract the filename without the extension
        const timestamp = Date.now(); // Get the current timestamp
        const uniqueFilename = `${originalname}_${timestamp}${path.extname(
          file.originalname
        )}`;
        cb(null, uniqueFilename);
      },
    });

    const upload = multer({ storage: storage });

    // Serve static files from the 'uploads' folder
    app.use("/uploads", express.static("uploads"));

    // Define a route for file upload
    app.post("/upload", upload.single("file"), (req, res) => {
      // 'file' in upload.single('file') should match the name attribute in your form

      if (!req.file) {
        return res.status(400).send("No file uploaded.");
      }

      res.send("File uploaded successfully!");
    });

    app.get("/demo-clients", async (req, res) => {
      const { demoClientsCollection } = await getCollections();

      const data = await demoClientsCollection.find({}).toArray();

      res.send(data);
    });

    app.get("/getAllIsrcs", async (req, res) => {
      let isrcs = "";

      const allIsrcs = await isrcCollection.find({}).toArray();

      // for (const isrc of allIsrcs) {
      //   const pipeline = [
      //     {
      //       $match: { isrc },
      //     },
      //     {
      //       $project: {
      //         _id: 0,
      //         royality: 1,
      //       },
      //     },
      //   ];
      //   const cursor = await revenueCollections.aggregate(pipeline).toArray();
      //   console.log(cursor);
      // }

      const pipeline = [
        {
          $match: { isrc: "INF232200285" },
        },
        {
          $project: {
            _id: 0,
            royality: 1,
          },
        },
      ];
      const cursor = await revenueCollections.aggregate(pipeline).toArray();
      console.log(cursor.length);

      res.send(allIsrcs);
    });

    app.get("/demo-clients", async (req, res) => {
      const demoClientsCursor = await demoClients.find({});
      const demoClientsList = await demoClientsCursor.toArray();

      res.send(demoClientsList);
    });

    app.get("/handle-payment", async (req, res) => {
      // console.log(paidData);
      for (const item of paidData) {
        const user = await demoClients.findOne({ emailId: item.emailId });
        // console.log(user);
        if (user !== null) {
          // console.log(user);
          const newUser = { ...user, ...item };

          newUser.accountBalance = newUser.lifeTimeRevenue - newUser.amount;
          // console.log(newUser);
          const updatedCursor = await demoClients.updateOne(
            { emailId: item.emailId },
            {
              $set: {
                ...newUser,
              },
            },
            {
              upsert: false,
            }
          );
        }
        res.send({ message: "updated" });
      }
    });

    /**
     *
     * Register Section
     *
     *
     * **/

    // app.post("/register", async (req, res) => {
    //   const userExist = await adminsCollection.findOne({
    //     email: req.body.email,
    //   });

    //   // if user doesn't exist
    //   if (userExist === null) {
    //     // encrypting
    //     const salt = bcrypt.genSaltSync(10);
    //     const hash = bcrypt.hashSync(req.body.password, salt);

    //     const user = {
    //       email: req.body.email,
    //       password: hash,
    //     };

    //     const registerCursor = await adminsCollection.insertOne(user);
    //     res.send(registerCursor);
    //   } else {
    //     // if user exists
    //     res.send("user already exist");
    //   }
    // });

    // app.get("/dashboard", verifyJWT, async (req, res) => {
    //   try {
    //     const usersCursor = await clientsCollection.find({});
    //     const clientsCursor = await demoClientsCollection.find({});
    //     const clients = await clientsCursor.toArray();

    //     const users = await usersCursor.toArray();
    //     const pipeline = [
    //       {
    //         $project: {
    //           _id: 0,
    //           "final revenue": 1,
    //         },
    //       },
    //     ];

    //     const revenues = (
    //       await revenueCollections.aggregate(pipeline).toArray()
    //     ).map((item) => item["final revenue"]);

    //     const result = await clientsCollection
    //       .aggregate([
    //         {
    //           $match: {
    //             isrc: { $ne: null },
    //           },
    //         },
    //         {
    //           $group: {
    //             _id: null,
    //             totalISRCs: {
    //               $sum: {
    //                 $size: { $split: ["$isrc", ","] },
    //               },
    //             },
    //           },
    //         },
    //       ])
    //       .toArray();

    //     const topContributor = users.reduce(
    //       (max, obj) =>
    //         obj.isrc?.split(",").length > max.isrc?.split(",").length
    //           ? obj
    //           : max,
    //       users[0]
    //     );

    //     res.send({
    //       usersCount: users.length,
    //       isrcCount: result[0].totalISRCs,
    //       topContributor,
    //       grandTotalRevenue: 0,
    //     });
    //   } catch (error) {
    //     console.error("Error:", error);
    //     res.status(500).send("Internal Server Error");
    //   }
    // });

    // app.get("/top-performer", async (req, res) => {
    //   const allClientsCursor = await demoClients.find({});
    //   const allClients = await allClientsCursor.toArray();
    //   const revenues = allClients.map((item) => item.lifeTimeRevenue);
    //   const existingRevenues = [];
    //   for (const revenue of revenues) {
    //     // console.log(revenue !== undefined);
    //     if (revenue !== undefined && revenue.toString() !== "NaN") {
    //       existingRevenues.push(revenue);
    //     }
    //   }

    //   const max = Math.max(...existingRevenues);
    //   res.send(allClients.find((item) => item.lifeTimeRevenue === max));
    //   // console.log(Math.max(...existingRevenues));
    // });

    // app.get("/platforms", verifyJWT, async (req, res) => {
    //   const platformsCursor = await platformsCollection.find({});
    //   const platforms = await platformsCursor.toArray();

    //   res.send(platforms);
    // });

    // app.post("/revenue-upload", verifyJWT, async (req, res) => {
    //   const data = req.body;

    //   const uploadCursor = await revenueCollections.insertMany(data);

    //   res.send(uploadCursor);
    // });

    // app.post("/revenue", verifyJWT, async (req, res) => {
    //   const { page, currentPage } = req.body;
    //   const revenueCursor = await revenueCollections.find({}).limit(100);
    //   const revenues = await revenueCursor.toArray();
    //   // const data = revenues.splice(currentPage * 50, 50);
    //   const data = revenues;

    //   res.send({ data, count: revenues.length });
    // });

    // app.get("/user-revenue", verifyJWT, async (req, res) => {
    //   const { email } = jwt.decode(req.headers.token);

    //   const clientsCursor = await clientsCollection.findOne({
    //     emailId: email,
    //   });

    //   // const

    //   const isrcs = [];

    //   if (clientsCollection !== null) {
    //     if (clientsCursor !== null) {
    //       clientsCursor.isrc.split(",").map((item) => isrcs.push(item.trim()));
    //       res.send(isrcs);
    //     } else {
    //       res.send({ message: "No isrc found in clientsCursor" });
    //     }
    //   } else {
    //     res.send({ message: "clientsCollection is null" });
    //   }

    //   // isrcs.map((isrc) => {
    //   //   const revenueCursor = revenueCollections.findOne({ isrc });
    //   // });
    //   // for (const isrc of isrcs) {
    //   //   const revenueCursor = await revenueCollections.find({ isrc });
    //   //   const allRevenues = await revenueCursor.toArray();

    //   //   // res.send(allRevenues);
    //   //   // revenueCursor !== null && revenues.push(revenueCursor);
    //   // }
    // });

    // app.get("/user-revenue/:isrc", async (req, res) => {
    //   const pipeline = [
    //     {
    //       $match: { isrc: req.params.isrc },
    //     },
    //     {
    //       $project: {
    //         _id: 0,
    //         "final revenue": 1,
    //         song_name: 1,
    //         platform_name: 1,
    //         album: 1,
    //         track_artist: 1,
    //         label: 1,
    //         isrc: 1,
    //         total: 1,
    //         "after tds revenue": 1,
    //       },
    //     },
    //   ];

    //   const revenues = await revenueCollections.aggregate(pipeline).toArray();
    //   res.send({ revenues });
    // });

    // app.post("/songs-for-isrc", async (req, res) => {
    //   const { isrcs } = req.body;

    //   const songs = await revenueCollections
    //     .find({ isrc: { $in: isrcs } })
    //     .toArray();
    //   res.send(songs);
    // });

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
        // console.log(email);

        const data = await userDetails.findOne({ user_email: email });
        console.log(data);
        res.send({ data });
      } else {
        res.status(401).send("Unauthorized Access");
      }
    });

    // app.post("/user-signup", async (req, res) => {
    //   const reqBody = req.body;
    //   const userExist = await userDetails.find({
    //     user_email: reqBody.email,
    //   });
    //   const user = await usersCollection.findOne({
    //     user_email: reqBody.email,
    //   });

    //   const users = await userExist.toArray();

    //   // console.log();
    //   if (users.length === 0 && user === null) {
    //     bcrypt.hash(reqBody.password, 10, async function (err, hash) {
    //       if (hash.length) {
    //         // Store hash in your password DB.
    //         // if (hash.length) {
    //         const user = {
    //           user_email: reqBody.email,
    //           user_password: hash,
    //         };

    //         const registerCursor = await usersCollection.insertOne(user);
    //         res.send(registerCursor);
    //         // console.log(registerCursor);
    //         // }
    //       }
    //     });
    //   } else {
    //     res.status(401).send("user already exist");
    //   }
    // });

    app.post("/post-user-details", async (req, res) => {
      const { user_email } = req.body;
      const foundUserDetails = await userDetails.findOne({ user_email });
      console.log(req.body);
      if (foundUserDetails === null) {
        const userDetailsCursor = await userDetails.insertOne(req.body);

        res.send(userDetailsCursor);
      } else {
        res.send("Already exists");
      }
    });

    app.get("/all-users", async (req, res) => {
      const usersCursor = await clientsCollection.find({});
      const users = await usersCursor.toArray();

      res.send(users);
    });

    app.get("/all-users/:cat/:data", async (req, res) => {
      const usersCursor = await clientsCollection.find({});
      const users = await usersCursor.toArray();

      const foundUser = [];

      for (const user of users) {
        if (user[req.params.cat]) {
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

        for (const rev of revenues) {
          if (parseFloat(rev) === NaN) {
            // console.log("object");
          }
        }

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

        res.send(revenues);
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
