const express = require("express");
const AdminPagesController = require("../../controller/admin/Admin.pages.controller");
const router = express.Router();



router.get("/", AdminPagesController.Login);
router.get("/dashboard", AdminPagesController.Dashboard);
router.get("/listOfStudents", AdminPagesController.listofStudents);
router.get("/listOfTutor", AdminPagesController.listOfTutor);
router.get("/documentVerification", AdminPagesController.document);
router.get("/payments", AdminPagesController.payments);
router.get("/createprimium", AdminPagesController.createPrimium);
router.get("/getprimium", AdminPagesController.getpurchaseplan);
router.get("/taxchat", AdminPagesController.taxchat);
router.get("/allstudentrequirment", AdminPagesController.allstudentsrequirment);
router.get("/alltutorrequirment", AdminPagesController.alltutorrequirment);


module.exports = router;