const { Router } = require("express");
const { getCollections } = require("../constants");

const router = Router();

router.get("/", async (req, res) => {
  const { paymentHistory } = await getCollections();

  const historyCursor = await paymentHistory.find({}).toArray();

  res.send(historyCursor);
});

router.get("/calculate-disburse", async (req, res) => {
  const { paymentHistory, clientsCollection } = await getCollections();

  const historyCursor = await paymentHistory
    .find({ disbursed: true })
    .toArray();

  // console.log(historyCursor);

  const totalAmountByEmail = historyCursor.reduce((acc, curr) => {
    const email = curr.emailId;
    const amount = parseFloat(curr.totalAmount);

    if (!acc[email]) {
      acc[email] = 0;
    }

    acc[email] += amount;

    return acc;
  }, {});

  // console.log(object);

  // const clients = await clientsCollection.find({}).toArray();

  // for (const client of clients) {
  // //   console.log(client);
  // }

  // console.log(object);

  const clients = [];

  for (const item of Object.keys(totalAmountByEmail)) {
    // console.log(item);
    const client = await clientsCollection.findOne({ emailId: item });

    if (client !== null) {
      client.lifetimeDisbursed = totalAmountByEmail[item];
      client.accountBalance = parseFloat(
        (client.lifetimeRevenue - client.lifetimeDisbursed).toFixed(2)
      );
      // console.log(client);
      // res.send
      clients.push(client);
    } else {
      //   console.log(item);
    }
  }

  const minus = clients.filter((item) => item.accountBalance < 0);

  res.send(minus);

  // res.send(minus);
});

module.exports = router;
