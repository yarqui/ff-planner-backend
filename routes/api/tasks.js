const express = require("express");
const { Task } = require("../../models/task");
const { HttpError } = require("../../helpers");
const { authenticate } = require("../../middlewares");
const ctrl = require("../../controllers/tasks");

const router = express.Router();

router.get("/", authenticate, ctrl.getAllTasksByMonth);

router.post("/", authenticate, ctrl.addTask);

router.delete("/:id", authenticate, ctrl.deleteTaskById);

router.patch("/:id", authenticate, ctrl.updateTaskById);

module.exports = router;
