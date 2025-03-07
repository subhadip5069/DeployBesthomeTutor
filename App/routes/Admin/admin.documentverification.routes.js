const express = require("express");
const router = express.Router();

const adminDoccontroller = require("../../controller/admin/admin.documntsverification.controller");

router.post("/update/:id", adminDoccontroller.updateDocumentVerification);

module.exports = router;