const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = `mongodb+srv://${process.env.db_username}:${process.env.db_password}@cluster0.i4vpazx.mongodb.net/?retryWrites=true&w=majority`;
const uri2 = `mongodb+srv://${process.env.user_db}:${process.env.user_db_pass}@cluster0.ynlqa8v.mongodb.net/?retryWrites=true&w=majority`;
const revenueUri = `mongodb+srv://${process.env.revenue_db}:${process.env.revenue_password}@cluster0.jmgru.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
const client2 = new MongoClient(uri2, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
const revenueClient = new MongoClient(revenueUri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const getCollections = async () => {
  const userProfileCollection = await client2
    .db("forevision-digital")
    .collection("user-profile-data");

  const adminsCollection = await client
    .db("forevision-digital")
    .collection("admins"); // admins collection

  const clientsCollection = await client
    .db("forevision-digital")
    .collection("client-with-isrc-collection"); // users collection

  const demoClientsCollection = await client
    .db("forevision-digital")
    .collection("demo-clients"); // users collection

  const isrcWithIDCollection = await client
    .db("forevision-digital")
    .collection("all-isrcs"); // ISRC collection
  const recordLabelsCollection = await client2
    .db("forevision-digital")
    .collection("record-labels");

  const platformsCollection = await client
    .db("forevision-digital")
    .collection("platform-name"); // platform-name

  const revenueCollections = await revenueClient
    .db("forevision-digital")
    .collection("revenue"); // demo-revenue
  const usersCollection = await client
    .db("forevision-digital")
    .collection("user-credentials-db");

  const userDetails = await client
    .db("forevision-digital")
    .collection("user-details");

  const demoClients = await client
    .db("forevision-digital")
    .collection("demo-clients");

  const paymentHistory = await client
    .db("forevision-digital")
    .collection("payment-history");

  const isrcCollection = await client
    .db("forevision-digital")
    .collection("isrcs");

  const paymentRequest = await client2
    .db("forevision-digital")
    .collection("withdrawal-request");

  const fbInstaWhitelisting = await client2
    .db("forevision-digital")
    .collection("fb-insta-whitelisting");

  const fbInstaProfile = await client2
    .db("forevision-digital")
    .collection("fb-insta-profile");
  const withdrawalRequest = await client2
    .db("forevision-digital")
    .collection("withdrawal-request");
  const songsCollection = await client2
    .db("forevision-digital")
    .collection("mother-isrc-collection");
  const couponCodesCollection = await client2
    .db("forevision-digital")
    .collection("coupon-codes");
  const notificationsCollections = await client2
    .db("forevision-digital")
    .collection("notifications");
  const dummyRevenue = await client
    .db("forevision-digital")
    .collection("dummy-revenue");
  const cutPercentages = await client
    .db("forevision-digital")
    .collection("cut-percentages");
  const customCuts = await client2
    .db("forevision-digital")
    .collection("custom-cut");

  const songUpdateRequestCollection = await client2
    .db("forevision-digital")
    .collection("song-update-requests");

  const newSongs = await client2
    .db("forevision-digital")
    .collection("new-songs");

  const paymentsCollection = await client2
    .db("forevision-digital")
    .collection("payments");

  const refundRequests = await client2
    .db("forevision-digital")
    .collection("refund-requests");

  const kycCollection = await client2
    .db("forevision-digital")
    .collection("kyc");

  const yearlyPlansCollection = await client2
    .db("forevision-digital")
    .collection("yearly-plan-requests");

  const bulkUploadCollection = await client2
    .db("forevision-digital")
    .collection("bulk-upload");

  const songs = await client2.db("forevision-digital").collection("songs");

  const recentUploadsCollection = await client2
    .db("forevision-digital")
    .collection("recent-uploads");

  const agreementsCollection = await client2
    .db("forevision-digital")
    .collection("agreements");
  const recordLabelFilesCollection = await client2
    .db("forevision-digital")
    .collection("record-label-files");

  const takedownRequestsCollection = await client2
    .db("forevision-digital")
    .collection("takedown-requests");
  const employeesCollection = await client2
    .db("forevision-digital")
    .collection("employees");

  const plansCollection = await client2
    .db("forevision-digital")
    .collection("plans");

  const crbtCodes = await client2
    .db("forevision-digital")
    .collection("crbt-codes");

  const splitRoyalties = await client2
    .db("forevision-digital")
    .collection("split-royalties");

  const cutsCollection = await client2
    .db("forevision-digital")
    .collection("custom-cut");

  const uploadDate = await client2
    .db("forevision-digital")
    .collection("upload-date");

  const testReports = await client2
    .db("forevision-digital")
    .collection("test-reports");

  function customLog(...messages) {
    const err = new Error();
    const stackLine = err.stack.split("\n")[2]; // Adjust this line number based on where the error stack points to the correct caller
    const matchResult = stackLine.match(/at (.*)\s+\((.*):(\d*):(\d*)\)/);
    if (matchResult) {
      const [, , filePath, line, column] = matchResult;
      const fileAndLine = `${filePath}:${line}:${column}`;
      console.log(fileAndLine, ...messages);
    } else {
      console.log(...messages);
    }
  }

  return {
    adminsCollection,
    clientsCollection,
    demoClients,
    isrcCollection,
    platformsCollection,
    revenueCollections,
    usersCollection,
    userProfileCollection,
    userDetails,
    demoClientsCollection,
    paymentHistory,
    paymentRequest,
    fbInstaWhitelisting,
    fbInstaProfile,
    withdrawalRequest,
    songsCollection,
    customLog,
    isrcWithIDCollection,
    recordLabelsCollection,
    couponCodesCollection,
    notificationsCollections,
    paymentsCollection,
    songs,
    recentUploadsCollection,
    dummyRevenue,
    cutPercentages,
    refundRequests,
    songUpdateRequestCollection,
    kycCollection,
    yearlyPlansCollection,
    bulkUploadCollection,
    newSongs,
    takedownRequestsCollection,
    employeesCollection,
    agreementsCollection,
    recordLabelFilesCollection,
    plansCollection,
    crbtCodes,
    splitRoyalties,
    uploadDate,
    testReports,
    customCuts,
  };
};

// module.exports = getCollections;
module.exports = { client, client2, getCollections };
