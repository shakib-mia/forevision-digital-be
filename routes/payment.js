const express = require("express");
const Razorpay = require("razorpay");
const router = express.Router();
const crypto = require("crypto");
const { getCollections } = require("../constants");
const jwt = require("jsonwebtoken");
const verifyJWT = require("../verifyJWT");
const { ObjectId } = require("mongodb");
const { default: getNextYearDate } = require("../utils/getNextYearDate");
const {
  default: getCurrentYearDateFormatted,
} = require("../utils/getCurrentYearDateFormatted");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.hostinger.com", // Replace with your Hostinger SMTP server
  port: 587, // Typically, SMTP uses port 587
  secure: false, // Set to true if you are using SSL/TLS
  auth: {
    user: process.env.emailAddress,
    pass: process.env.emailPass,
  },
});

router.post("/", async (req, res) => {
  try {
    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const options = {
      amount: req.body.amount,
      currency: req.body.currency,
      receipt: crypto.randomBytes(10).toString("hex"),
    };
    // console.clear();
    // console.log(req.body);

    instance.orders.create(options, (error, order) => {
      if (error) {
        console.log(error);
        return res.status(500).json({ message: "Payment Request Failed" });
      }
      console.clear();
      // console.log(order);
      res.send(order);
    });
  } catch (error) {
    console.log(error);
  }
});

router.post("/verify/yearly", verifyJWT, async (req, res) => {
  const { paymentsCollection, plansCollection, userDetails } =
    await getCollections();

  const { email } = jwt.decode(req.headers.token);

  const yearlyPlanStartDate = getCurrentYearDateFormatted("1/1/2000");
  const yearlyPlanEndDate = getNextYearDate(yearlyPlanStartDate);
  const client = await userDetails.findOne({ user_email: email });
  client.yearlyPlanStartDate = yearlyPlanStartDate;
  client.yearlyPlanEndDate = yearlyPlanEndDate;

  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      price,
    } = req.body;
    const sign = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature === expectedSign) {
      // await paymentsCollection.
      client.razorpay_order_id = razorpay_order_id;
      client.razorpay_payment_id = razorpay_payment_id;
      const { _id, ...rest } = client;
      const updateCursor = await userDetails.updateOne(
        { _id: new ObjectId(_id) },
        { $set: rest },
        { upsert: true }
      );

      var message = {
        from: `ForeVision Digital ${process.env.emailAddress}`,
        to: client.user_email,
        cc: "connect@forevisiondigital.com",
        subject: "Password Reset Request",
        // text: "Plaintext version of the message",
        html: `<div style="max-width: 500px; margin: 0 auto">
        Dear [User’s Name], <br />
        <br />
        <p>
          Thank you for upgrading to our Yearly Plan! Your subscription has been
          successfully activated, and you’re now set for a full year of seamless
          music distribution.
        </p>
  
        <h4>Purchase Details</h4>
        <ul>
          <li>Plan: ForeVision Yearly Plan</li>
          <li>Amount Paid: [₹XXX / $XXX]</li>
          <li>Transaction ID: [XXXXXXXXXX]</li>
          <li>Purchase Date: [DD/MM/YYYY]</li>
          <li>Expiry Date: [DD/MM/YYYY]</li>
        </ul>
  
        <h4>What’s Next?</h4>
  
        <ul style="list-style-type: none; padding-left: 0">
          <li>
            ✅ Full Access – Distribute your music to all major platforms without
            interruptions.
          </li>
          <li>
            ✅ Priority Support – Get faster responses from our support team.
          </li>
          <li>✅ Royalty Dashboard – Track your earnings with ease.</li>
          <li>
            ✅ Advanced Analytics – Monitor your music’s performance in real-time.
          </li>
        </ul>
  
        <p>
          Your journey with ForeVision Digital just got even better! If you have
          any questions or need assistance, feel free to reach out.
        </p>
        <h4>Need Help?</h4>
        <p>Contact our support team at [Support Email] or visit [Website URL].</p>
        <p>Happy Distributing!</p>
  
        <p>
          Best regards, <br />
          ForeVision Digital <br />
          [Website URL] | [Support Email] <br />
        </p>
      </div>`,
      };

      // transporter.sendMail(message, async (error, info) => {
      //   if (error) {
      //     console.error(error);
      //     res.status(500).send({ message: "Error Sending Mail" });
      //   } else {
      //     bcrypt.hash(newPassword, 10, async function (err, hash) {
      //       // Store hash in your password DB.
      //       if (hash.length) {
      //         const updateCursor = await usersCollection.updateOne(
      //           { user_email },
      //           { $set: { ...usersCursor, user_password: hash } },
      //           { upsert: false }
      //         );
      //         res.send(updateCursor);
      //         // res.status(200).send("message sent successfully");
      //       }
      //     });
      //   }
      // });

      const data = {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        emailId: email,
        date: Date.now(),
        ...req.body,
      };

      return res.send({
        message: "Payment verified successfully",
        razorpay_order_id,
        razorpay_payment_id,
        updateCursor,
      });
    }
  } catch (error) {
    console.log(error);
  }
});

router.post("/verify", verifyJWT, async (req, res) => {
  const { paymentsCollection, plansCollection } = await getCollections();

  const { email } = jwt.decode(req.headers.token);

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;
    const sign = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature === expectedSign) {
      // await paymentsCollection.

      const data = {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        emailId: email,
        date: Date.now(),
        ...req.body,
      };

      // console.log(data);
      const insertCursor = await paymentsCollection.insertOne(data);

      const currentDate = new Date();
      const salesEntry = {
        date: currentDate,
        price: parseFloat(req.body.price),
        userEmail: email,
      }; // price in paisa

      // Update the monthly-sales array (push new sales entry)
      const plan = await plansCollection.findOne({
        price: parseFloat(req.body.price),
      });
      plan["monthly-sales"]?.push(salesEntry);

      // Save the updated plan back to the collection
      await plansCollection.updateOne(
        { _id: plan._id }, // find the plan by its unique ID
        { $push: { "monthly-sales": salesEntry } } // push the new entry into 'monthly-sales'
      );

      return res.send({
        message: "Payment verified successfully",
        razorpay_order_id,
        razorpay_payment_id,
        insertCursor,
      });
    }
  } catch (error) {
    console.log(error);
  }
});

router.post("/send-link/:_id", async (req, res) => {
  const { yearlyPlansCollection, notificationsCollections } =
    await getCollections();

  const plan = await yearlyPlansCollection.findOne({
    _id: new ObjectId(req.params._id),
  });

  const timeStamp = Math.floor(new Date().getTime() / 1000);
  delete plan._id;

  plan.linkSent = true;

  const notification = {
    email: plan.emailId,
    message: `Click <a style="color: blue" onClick="e => e.stopPropagation()" target="_blank" href="${
      req.body.link.includes("https://")
        ? req.body.link
        : "https://" + req.body.link
    }">here</a> to Pay for the yearly Plan`,
    read: false,
    date: timeStamp,
  };

  const notificationCursor = await notificationsCollections.insertOne(
    notification
  );
  res.send(notification);
});

module.exports = router;
