const express = require("express");
const { getCollections } = require("../constants");
const verifyJWT = require("../verifyJWT");
const router = express.Router();
const jwt = require("jsonwebtoken");

router.get("/", async (req, res) => {
  const { plansCollection } = await getCollections();
  const plans = await plansCollection.find({}).toArray();
  res.send(plans);
});

router.get("/monthly-sales/:price", verifyJWT, async (req, res) => {
  const { email } = jwt.decode(req.headers.token);
  try {
    const { price } = req.params;
    const { plansCollection } = await getCollections();

    // Find the plan by price (convert to paisa)
    const plan = await plansCollection.findOne({
      price: parseFloat(price),
    });

    if (!plan) {
      return res.status(404).send({ message: "Plan not found" });
    }

    // Prepare the new sales data (current date and price in paisa)
    const currentDate = new Date();
    const salesEntry = {
      date: currentDate,
      price: parseFloat(price),
      userEmail: email,
    }; // price in paisa

    // Update the monthly-sales array (push new sales entry)
    plan["monthly-sales"].push(salesEntry);

    // Save the updated plan back to the collection
    await plansCollection.updateOne(
      { _id: plan._id }, // find the plan by its unique ID
      { $push: { "monthly-sales": salesEntry } } // push the new entry into 'monthly-sales'
    );

    // Send the updated plan back as a response
    res.send(plan);
  } catch (error) {
    console.error("Error updating plan:", error);
    res.status(500).send({ message: "Server error" });
  }
});

router.get("/monthly-sales", async (req, res) => {
  const { plansCollection } = await getCollections();
  const plans = await plansCollection.find({}).toArray();

  function getMonthlySalesForAllPlans(plans) {
    const salesByMonth = {};

    plans.forEach((plan) => {
      plan["monthly-sales"].forEach((sale) => {
        const saleDate = new Date(sale.date);
        const year = saleDate.getFullYear();
        const month = saleDate.getMonth() + 1; // JavaScript months are 0-based, so add 1.
        const monthKey = `${year}-${month.toString().padStart(2, "0")}`; // Ensure month is two digits.

        if (!salesByMonth[monthKey]) {
          salesByMonth[monthKey] = {
            month: monthKey,
            ForevisionSocial: 0,
            ForevisionCRBTPlus: 0,
            ForevisionPro: 0,
            ForevisionCRBT: 0,
            "ForeVision Digital Yearly Plan": 0,
          };
        }

        // Accumulate sales for each plan
        if (plan.planName === "ForeVision-social") {
          salesByMonth[monthKey].ForevisionSocial += sale.price;
        } else if (plan.planName === "CRBT+") {
          salesByMonth[monthKey].ForevisionCRBTPlus += sale.price;
        } else if (plan.planName === "ForeVision Pro") {
          salesByMonth[monthKey].ForevisionPro += sale.price;
        } else if (plan.planName === "CRBT") {
          salesByMonth[monthKey].ForevisionCRBT += sale.price;
        } else if (plan.planName === "Yearly") {
          salesByMonth[monthKey]["ForeVision Digital Yearly Plan"] +=
            sale.price;
        }
      });
    });

    // Convert salesByMonth object to an array
    return Object.values(salesByMonth);
  }

  const monthlySalesByPlan = getMonthlySalesForAllPlans(plans);

  res.send(monthlySalesByPlan);
});

router.get("/monthly-sales-by-count", async (req, res) => {
  const { plansCollection } = await getCollections();
  const plans = await plansCollection.find({}).toArray();

  function getMonthlySalesCountForAllPlans(plans) {
    const salesByMonth = {};

    plans.forEach((plan) => {
      plan["monthly-sales"].forEach((sale) => {
        const saleDate = new Date(sale.date);
        const year = saleDate.getFullYear();
        const month = saleDate.getMonth() + 1; // JavaScript months are 0-based, so add 1.
        const monthKey = `${year}-${month.toString().padStart(2, "0")}`; // Ensure month is two digits.

        if (!salesByMonth[monthKey]) {
          salesByMonth[monthKey] = {
            month: monthKey,
            ForevisionSocial: 0,
            ForevisionCRBTPlus: 0,
            ForevisionPro: 0,
            ForevisionCRBT: 0,
            "ForeVision Digital Yearly Plan": 0,
          };
        }

        // Count the number of sales for each plan
        if (plan.planName === "ForeVision-social") {
          salesByMonth[monthKey].ForevisionSocial += 1;
        } else if (plan.planName === "CRBT+") {
          salesByMonth[monthKey].ForevisionCRBTPlus += 1;
        } else if (plan.planName === "ForeVision Pro") {
          salesByMonth[monthKey].ForevisionPro += 1;
        } else if (plan.planName === "CRBT") {
          salesByMonth[monthKey].ForevisionCRBT += 1;
        } else if (plan.planName === "Yearly") {
          salesByMonth[monthKey]["ForeVision Digital Yearly Plan"] += 1;
        }
      });
    });

    // Convert salesByMonth object to an array
    return Object.values(salesByMonth);
  }

  const monthlySalesByPlan = getMonthlySalesCountForAllPlans(plans);

  res.send(monthlySalesByPlan);
});

module.exports = router;
