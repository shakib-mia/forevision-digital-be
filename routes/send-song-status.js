const express = require("express");
const nodemailer = require("nodemailer");
const { getCollections, client } = require("../constants");
const { ObjectId } = require("mongodb");
const router = express.Router();

router.post("/", async (req, res) => {
  const {
    clientsCollection,
    notificationsCollections,
    recentUploadsCollection,
    userDetails,
  } = await getCollections();
  // console.log(req.body);
  //   const { recipientEmail, artistName, status, songName, additionalInfo } =
  //     req.body;
  const { emailId, songName, status, reason } = req.body;
  console.log(req.body);
  const user = await clientsCollection.findOne({
    emailId: emailId,
  });
  const user2 = await userDetails.findOne({ user_email: emailId });

  const { first_name, last_name } = { ...user, ...user2 };

  //   Create a transport instance with your email configuration
  const transporter = nodemailer.createTransport({
    host: "smtp.hostinger.com", // Replace with your Hostinger SMTP server
    port: 587, // Typically, SMTP uses port 587
    secure: false, // Set to true if you are using SSL/TLS
    auth: {
      user: process.env.emailAddress,
      pass: process.env.emailPass,
    },
  });

  const timeStamp = Math.floor(new Date().getTime() / 1000);

  let notificationContent = "";

  switch (status) {
    case "Sent to Stores":
      notificationContent = `Your music has been successfully distributed to our partner platforms.`;
      break;
    case "streaming":
      notificationContent = `Your music is streaming now to platforms you have selected. Check you profile for the live link(s)`;
      break;
    case "Copyright infringed":
      notificationContent = `We've received a copyright infringement claim regarding your song "${songName}"`;
      break;
    case "Taken Down":
      notificationContent = `Your song "${songName}" has been removed from distribution due to ${reason}.`;
      break;
    case "Rejected":
      notificationContent = `Your submission for "${songName}" has been rejected due to ${reason}.`;
      break;
    case "On Hold":
      notificationContent = `Your distribution for "${songName}" is currently on hold due to ${reason}.`;
      break;
    case "paid":
      notificationContent = `Your song has been marked as paid.`;
      break;
    default:
      return res.status(400).send("Invalid status provided.");
  }

  let notification = {
    email: req.body.emailId,
    message: notificationContent,
    date: timeStamp,
  };

  // Define the email content based on the status
  let emailContent = "";

  switch (status) {
    case "Sent to Stores":
      emailContent = `
          Dear ${first_name} ${last_name}, <br/><br/>
          Your music has been successfully distributed to our partner platforms.
          You can expect it to appear on major platforms within the next 2 business days.<br/><br/>
          Best regards,<br/>
          Team ForeVision Digital
        `;
      break;
    case "streaming":
      emailContent = `
          Dear ${first_name} ${last_name}, <br/><br/>
          Your music has been successfully distributed to our partner platforms.
          You can expect it to appear on major platforms within the next 2 business days.<br/><br/>
          Best regards,<br/>
          Team ForeVision Digital
        `;
      break;
    case "Copyright infringed":
      emailContent = `
          Dear ${first_name} ${last_name}, <br/><br/>
          We've received a copyright infringement claim regarding your song "${songName}".
          Please provide documentation of your rights to this content within 5 business days to prevent removal.<br/><br/>
          Best regards,<br/>
          Team ForeVision Digital
        `;
      break;
    case "Taken Down":
      emailContent = `
          Dear ${first_name} ${last_name}, <br/><br/>
          Your song "${songName}" has been removed from distribution due to ${reason}.
          If you believe this is an error, please contact our support team immediately.<br/><br/>
          Best regards,<br/>
          Team ForeVision Digital
        `;
      break;
    case "Rejected":
      emailContent = `
          Dear ${first_name} ${last_name}, <br/><br/>
          Your submission for "${songName}" has been rejected due to ${reason}.
          Please address these issues and resubmit.<br/><br/>
          Best regards,<br/>
          Team ForeVision Digital
        `;
      break;
    case "On Hold":
      emailContent = `
          Dear ${first_name} ${last_name}, <br/><br/>
          Your distribution for "${songName}" is currently on hold due to ${reason}.
          We'll update you once we have more information.<br/><br/>
          Best regards,<br/>
          Team ForeVision Digital
        `;
      break;
    case "paid":
      emailContent = `
          Dear ${first_name} ${last_name}, <br/><br/>
          Your song has been marked as paid.<br/><br/>
          Best regards,<br/>
          Team ForeVision Digital
        `;
      break;
    default:
      return res.status(400).send("Invalid status provided.");
  }

  // Send Notification
  const notificationCursor = await notificationsCollections.insertOne(
    notification
  );

  //   Set up email data
  let mailOptions = {
    from: process.env.emailAddress,
    to: emailId,
    cc: "connect@forevisiondigital.com",
    // to: "smdshakibmia2001@gmail.com",
    subject: `Update on Your Music Distribution Status with ForeVision Digital`,
    html: emailContent,
  };

  // Send Mail
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error sending email:", error);
      return res.status(500).send("Failed to send email.");
    }
    // res.status(200).send("Email sent successfully!");
  });

  // When Sent To Stores
  // console.log(req.body);
  const newBody = { ...req.body };
  delete newBody._id;

  if (status === "Sent to Stores") {
    // newBody.status = status;

    const updateCursor = await recentUploadsCollection.updateOne(
      {
        _id: new ObjectId(req.body._id),
      },
      {
        $set: { ...newBody },
      },
      {
        upsert: false,
      }
    );

    res.send(updateCursor);
  }

  // When Streaming

  if (status === "streaming") {
    // console.log(req.body);

    // newBody.status = status;

    const updateCursor = await recentUploadsCollection.updateOne(
      {
        _id: new ObjectId(req.body._id),
      },
      {
        $set: { ...newBody, status },
      },
      {
        upsert: false,
      }
    );

    const { isrc, emailId } = req.body;

    const client = await clientsCollection.findOne({ emailId: emailId });
    console.log(client);

    console.log(updateCursor);
    res.send(updateCursor);
  }

  // When on hold

  if (status === "On Hold") {
    const updateCursor = await recentUploadsCollection.updateOne(
      {
        _id: new ObjectId(req.body._id),
      },
      {
        $set: { ...newBody, status },
      },
      {
        upsert: false,
      }
    );

    res.send(updateCursor);
  }

  if (status === "Copyright infringed") {
    const updateCursor = await recentUploadsCollection.updateOne(
      {
        _id: new ObjectId(req.body._id),
      },
      {
        $set: { ...newBody, status },
      },
      {
        upsert: false,
      }
    );

    res.send(updateCursor);
  }

  if (status === "Taken Down") {
    console.log(req.body);
    const updateCursor = await recentUploadsCollection.updateOne(
      {
        _id: new ObjectId(req.body._id),
      },
      {
        $set: { ...newBody, status },
      },
      {
        upsert: false,
      }
    );

    res.send(updateCursor);
  }

  if (status === "Rejected") {
    console.log(req.body);
    const updateCursor = await recentUploadsCollection.updateOne(
      {
        _id: new ObjectId(req.body._id),
      },
      {
        $set: { ...newBody, status },
      },
      {
        upsert: false,
      }
    );

    res.send(updateCursor);
  }
});

module.exports = router;
