const { ctrlWrapper, HttpError } = require("../helpers");
const { Task } = require("../models/task");

const getTasks = async (req, res) => {
  const { _id } = req.user;
  const { startAt } = req.body;

  if (req.query.filter === "byMonth") {
    const targetMonth = new Date(startAt).getMonth();
    const targetYear = new Date(startAt).getFullYear();

    const startOfMonth = new Date(targetYear, targetMonth, 1);
    startOfMonth.setHours(0, 0, 0, 0);

    const startOfMonthKyiv = new Date(
      startOfMonth.toLocaleString("en-US", { timeZone: "Europe/Kiev" })
    );

    const endOfMonth = new Date(targetYear, targetMonth + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);

    const endOfMonthKyiv = new Date(
      endOfMonth.toLocaleString("en-US", { timeZone: "Europe/Kiev" })
    );

    const result = await Task.find(
      {
        "assignedUser._id": _id,
        startAt: { $gte: startOfMonthKyiv, $lt: endOfMonthKyiv },
      },
      "-createdAt -updatedAt"
    );
    res.status(200).json(result);
  }

  if (req.query.filter === "byDay") {
    const targetDate = new Date(startAt).toLocaleString("en-US", {
      timeZone: "Europe/Kiev",
    });

    const targetDayStart = new Date(targetDate);
    targetDayStart.setHours(0, 0, 0, 0);

    const targetDayEnd = new Date(targetDate);
    targetDayEnd.setHours(23, 59, 59, 999);

    const result = await Task.find(
      {
        "assignedUser._id": _id,
        startAt: { $gte: targetDayStart, $lt: targetDayEnd },
      },
      "-createdAt -updatedAt"
    );

    res.status(200).json(result);
  }
  throw HttpError(401);
};

const addTask = async (req, res) => {
  const { _id, name, avatarURL } = req.user;
  const { startAt, endAt } = req.body;
  const assignedUser = {
    _id,
    name,
    avatarURL,
  };

  if (startAt > endAt) {
    throw HttpError(404, "End time should be later than start time");
  }

  const result = await Task.create({
    ...req.body,
    assignedUser,
  });
  res.status(201).json(result);
};

const deleteTaskById = async (req, res) => {
  const reqUserId = req.user._id.toString();
  const { taskId } = req.params;

  const receivedTask = await Task.findById(taskId);

  if (!receivedTask) {
    throw HttpError(404);
  }

  const receivedUserId = receivedTask.assignedUser._id.toString();

  if (reqUserId !== receivedUserId) {
    throw HttpError(401);
  }

  const result = await Task.findByIdAndDelete(taskId);

  if (!result) {
    throw HttpError(404);
  }

  res.json({
    message: "Task is deleted",
  });
};

const updateTaskById = async (req, res) => {
  const { startAt, endAt } = req.body;

  if (Object.keys(req.body).length === 0) {
    throw HttpError(400, "missing fields");
  }

  const reqUserId = req.user._id.toString();
  const { taskId } = req.params;

  const receivedTask = await Task.findById(taskId);

  if (!receivedTask) {
    throw HttpError(404);
  }

  const receivedUserId = receivedTask.assignedUser._id.toString();

  if (reqUserId !== receivedUserId) {
    throw HttpError(401);
  }

  if (startAt && startAt > receivedTask.endAt) {
    throw HttpError(404, "End time should be later than start time");
  }

  if (endAt && endAt < receivedTask.startAt) {
    throw HttpError(404, "End time should be later than start time");
  }

  const result = await Task.findOneAndUpdate({ _id: taskId }, req.body, {
    new: true,
  });

  if (!result) {
    throw HttpError(404);
  }
  res.status(200).json(result);
};

module.exports = {
  getTasks: ctrlWrapper(getTasks),
  addTask: ctrlWrapper(addTask),
  deleteTaskById: ctrlWrapper(deleteTaskById),
  updateTaskById: ctrlWrapper(updateTaskById),
};
