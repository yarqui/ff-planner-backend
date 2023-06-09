const express = require("express");

const { authenticate, isValidId } = require("../../middlewares");
const ctrl = require("../../controllers/tasks");

const router = express.Router();

router.get("/", authenticate, ctrl.getAllTasksByMonth);

router.post("/", authenticate, ctrl.addTask);

router.delete(
  "/:taskId",
  authenticate,
  isValidId("taskId"),
  ctrl.deleteTaskById
);

router.patch(
  "/:taskId",
  authenticate,
  isValidId("taskId"),
  ctrl.updateTaskById
);

module.exports = router;
