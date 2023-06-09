const express = require("express");

const { authenticate, isValidId, validateBody } = require("../../middlewares");
const ctrl = require("../../controllers/tasks");
const { taskSchemas } = require("../../models/task");

const router = express.Router();

router.get("/", authenticate, ctrl.getAllTasksByMonth);

router.post(
  "/",
  authenticate,
  validateBody(taskSchemas.addTaskSchema),
  ctrl.addTask
);

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
  validateBody(taskSchemas.updateTaskSchema),
  ctrl.updateTaskById
);

module.exports = router;
