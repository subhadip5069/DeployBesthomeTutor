const express = require("express");

const app = express.Router();

app.use("/auth", require("./auth.middleware.routes"));
app.use("/", require("./user.pages.routes"));
app.use("/requirment", require("./requirement.routes"));
app.use("/payment", require("./payment.routs"));
app.use("/unlockuser",require("./unlockuser.routes"))
app.use("/scearch",require("./scearch.routes"))

module.exports = app;


