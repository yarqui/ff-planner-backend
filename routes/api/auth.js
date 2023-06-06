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

// TODO: delete it when we implement auto login after email verification
router.get("/current", authenticate, ctrl.getCurrentUser);

router.patch(
  "/:userId",
  authenticate,
  validateBody(schemas.updateUserSchema),
  ctrl.updateUserProfile
);

router.patch(
  "/:userId/password",
  authenticate,
  validateBody(schemas.userPasswordSchema),
  ctrl.changeUserPassword
);

module.exports = router;
