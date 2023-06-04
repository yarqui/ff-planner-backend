const express = require("express");
const { validateBody, authenticate, upload } = require("../../middlewares");
const { schemas } = require("../../models/user");
const ctrl = require("../../controllers/auth");
const router = express.Router();

router.post("/signup", validateBody(schemas.signupSchema), ctrl.signup);

router.get("/verify/:verificationToken", ctrl.verifyEmail);

router.post(
  "/verify",
  validateBody(schemas.emailSchema),
  ctrl.resendVerifyEmail
);

module.exports = router;
