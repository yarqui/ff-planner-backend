const { ctrlWrapper, HttpError } = require("../helpers");
const { Task } = require("../models/task");
const { User } = require("../models/user");

const getTasks = async (req, res) => {
  const { _id } = req.user;
  console.log("_id:", _id);
  const { filterBy, date } = req.query;
  const convertedDate = +date; // a value from query string is a string, so we have to convert it to Number

  if (filterBy === "month") {
    const targetMonth = new Date(convertedDate).getMonth();
    const targetYear = new Date(convertedDate).getFullYear();

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

    const filteredTasks = await Task.find(
      {
        assignedUserId: _id,
        startAt: { $gte: startOfMonthKyiv, $lt: endOfMonthKyiv },
      },
      "-createdAt -updatedAt"
    );

    const usersFromTasks = await Promise.all(
      Array.from(
        new Set(filteredTasks.map(({ assignedUserId }) => assignedUserId))
      ).map((id) => User.findById(id, "_id name avatarURL "))
    );

    const updatedTasks = filteredTasks.map(
      ({ assignedUserId, _id, startAt, endAt, title, priority, category }) => ({
        _id,
        startAt,
        endAt,
        title,
        priority,
        category,
        assignedUser: Array.from(usersFromTasks).find(
          ({ _id }) => _id.toString() === assignedUserId
        ),
      })
    );

    res.status(200).json(updatedTasks);
    return; // ❗ Don't remove. For some reason without return it doesn't stop function execution
  }

  if (filterBy === "day") {
    const targetDate = new Date(convertedDate).toLocaleString("en-US", {
      timeZone: "Europe/Kiev",
    });
    console.log("targetDate:", targetDate);

    // const targetDayStart = new Date(targetDate);
    const targetDayStart = new Date(targetDate);
    targetDayStart.setHours(0, 0, 0, 0);
    console.log("targetDayStart:", targetDayStart);
    console.log("targetDayStart:", targetDayStart.getTime());

    // const targetDayEnd = new Date(targetDate);
    const targetDayEnd = new Date(targetDate);
    targetDayEnd.setHours(23, 59, 59, 999);
    console.log("targetDayEnd:", targetDayEnd);
    console.log("targetDayEnd:", targetDayEnd.getTime());

    const filteredTasks = await Task.find(
      {
        assignedUserId: _id,
        startAt: {
          $gte: targetDayStart.getTime(),
          $lt: targetDayEnd.getTime(),
        },
      },
      "-createdAt -updatedAt"
    );

    const usersFromTasks = await Promise.all(
      Array.from(
        new Set(filteredTasks.map(({ assignedUserId }) => assignedUserId))
      ).map((id) => User.findById(id, "_id name avatarURL "))
    );

    const updatedTasks = filteredTasks.map(
      ({ assignedUserId, _id, startAt, endAt, title, priority, category }) => ({
        _id,
        startAt,
        endAt,
        title,
        priority,
        category,
        assignedUser: Array.from(usersFromTasks).find(
          ({ _id }) => _id.toString() === assignedUserId
        ),
      })
    );

    res.status(200).json(updatedTasks);
    return; // ❗ Don't remove. For some reason without return it doesn't stop function execution
  }
  throw HttpError(501, "The request is not supported");
};

const addTask = async (req, res) => {
  const { _id: assignedUserId } = req.user;
  const { startAt, endAt, title, priority, category } = req.body;

  if (startAt > endAt) {
    throw HttpError(400, "End time should be later than start time");
  }

  const result = await Task.create({
    startAt,
    endAt,
    title,
    priority,
    category,
    assignedUserId,
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
  const { startAt, endAt, title, priority, category } = req.body;

  if (Object.keys(req.body).length === 0) {
    throw HttpError(400, "missing fields");
  }

  const reqUserId = req.user._id.toString();
  const { taskId } = req.params;

  const receivedTask = await Task.findById(taskId);

  if (!receivedTask) {
    throw HttpError(404);
  }

  const receivedUserId = receivedTask.assignedUserId.toString();

  if (reqUserId !== receivedUserId) {
    throw HttpError(401);
  }

  if (startAt && endAt && startAt > endAt) {
    throw HttpError(400, "End time should be later than start time");
  }

  if (startAt && !endAt && startAt > receivedTask.endAt) {
    throw HttpError(400, "End time should be later than start time");
  }

  if (endAt && !startAt && endAt < receivedTask.startAt) {
    throw HttpError(400, "End time should be later than start time");
  }

  const result = await Task.findOneAndUpdate(
    { _id: taskId },
    { startAt, endAt, title, priority, category },
    {
      new: true,
    }
  );

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
