const express = require("express");
const {
  validateBody,
  authenticate,
  isValidId,
  upload,
} = require("../../middlewares");

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

router.get("/:userId", authenticate, isValidId("userId"), ctrl.getCurrentUser);

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

router.patch(
  "/avatar",
  authenticate,
  upload.single("avatar"), // "avatar" is the key of request method
  ctrl.updateUserAvatar
);

module.exports = router;
