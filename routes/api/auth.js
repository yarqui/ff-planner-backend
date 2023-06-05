const express = require("express");
const { validateBody, authenticate } = require("../../middlewares");

const { schemas } = require("../../models/user");
const ctrl = require("../../controllers/auth");
const router = express.Router();

router.post("/register", validateBody(schemas.signupSchema), ctrl.signup);

router.post("/login", validateBody(schemas.loginSchema), ctrl.login);

router.post("/logout", authenticate, ctrl.logout);

router.get("/verify/:verificationToken", ctrl.verifyEmail);

router.post(
  "/verify",
  validateBody(schemas.emailSchema),
  ctrl.resendVerifyEmail
);

router.get("/current", authenticate, ctrl.getCurrentUser);

// router.patch(
//   "/current/update-name",
//   authenticate,
//   validateBody(schemas.nameSchema),
//   ctrl.updateUserName
// );
// router.patch(
//   "/current/update-email",
//   authenticate,
//   validateBody(schemas.emailSchema),
//   ctrl.updateUserEmail
// );

module.exports = router;
