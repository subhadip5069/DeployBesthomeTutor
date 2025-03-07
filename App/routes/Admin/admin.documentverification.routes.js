const express = require("express");
const router = express.Router();

const adminDoccontroller = require("../../controller/admin/admin.documntsverification.controller");
const { AdminauthMiddleware } = require("../../utils/auth.middleware");

router.post("/update/:id",AdminauthMiddleware, adminDoccontroller.updateDocumentVerification);

module.exports = router;