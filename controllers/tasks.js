const { ctrlWrapper, HttpError } = require("../helpers");
const { Task } = require("../models/task");

const getTasks = async (req, res) => {
  const { _id } = req.user;
  const { filterBy, date } = req.query;
  const convertedDate = +date; // a value from query string is a string, so we have to convert it to Number
  console.log("date:", date);
  console.log("convertedDate:", convertedDate);

  if (filterBy === "month") {
    const targetMonth = new Date(convertedDate).getMonth();
    const targetYear = new Date(convertedDate).getFullYear();

    const startOfMonth = new Date(targetYear, targetMonth, 1);
    startOfMonth.setHours(0, 0, 0, 0);
    console.log("startOfMonth byMonth:", startOfMonth);

    const startOfMonthKyiv = new Date(
      startOfMonth.toLocaleString("en-US", { timeZone: "Europe/Kiev" }) // FIXME: do we need startOfMonthKyiv? It's the same as startOfMonth
    );
    console.log("startOfMonthKyiv byMonth:", startOfMonthKyiv);

    const endOfMonth = new Date(targetYear, targetMonth + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);
    console.log("endOfMonth byMonth:", endOfMonth);

    const endOfMonthKyiv = new Date(
      endOfMonth.toLocaleString("en-US", { timeZone: "Europe/Kiev" }) // FIXME: do we need endOfMonthKyiv? It's the same as endOfMonthKyiv
    );
    console.log("endOfMonthKyiv byMonth:", endOfMonthKyiv);

    const result = await Task.find(
      {
        "assignedUser._id": _id,
        startAt: { $gte: startOfMonthKyiv, $lt: endOfMonthKyiv },
      },
      "-createdAt -updatedAt"
    );
    res.status(200).json(result);
    return; // ❗ Don't remove. For some reason without return it doesn't stop function execution
  }

  if (filterBy === "day") {
    const targetDate = new Date(convertedDate);
    // const targetDate = new Date(convertedDate).toLocaleString("en-US", {
    //   timeZone: "Europe/Kiev",
    //   }); // ❗ although without toLocaleString targetDayStart & targetDayEnd are 3 hours earlier, it sends correct dates in response
    console.log("targetDate byDay:", targetDate);

    const targetDayStart = new Date(targetDate);
    console.log("targetDayStart 1 byDay:", targetDayStart);
    // targetDayStart.setHours(0, 0, 0, 0); // ❗ in production it sends 3 hour earlier date, but in dev it's ok
    targetDayStart.setHours(3, 0, 0, 0); // ❗ in dev it doesn't work, but in production it's ok
    console.log("targetDayStart byDay:", targetDayStart);

    const targetDayEnd = new Date(targetDate);
    console.log("targetDayEnd 1 byDay:", targetDayEnd);
    // targetDayEnd.setHours(23, 59, 59, 999); // ❗ in production it sends 3 hour earlier date, but in dev it's ok
    targetDayEnd.setHours(4, 59, 59, 999); // ❗ in dev it doesn't work, but in production it's ok
    console.log("targetDayEnd byDay:", targetDayEnd);

    const result = await Task.find(
      {
        "assignedUser._id": _id,
        startAt: { $gte: targetDayStart, $lt: targetDayEnd },
      },
      "-createdAt -updatedAt"
    );

    res.status(200).json(result);
    return; // ❗ Don't remove. For some reason without return it doesn't stop function execution
  }
  throw HttpError(501, "The request is not supported");
};

const addTask = async (req, res) => {
  const { _id, name, avatarURL } = req.user;
  const { startAt, endAt, title, priority, category } = req.body;
  const assignedUser = {
    _id,
    name,
    avatarURL,
  };

  if (startAt > endAt) {
    throw HttpError(400, "End time should be later than start time");
  }

  const result = await Task.create({
    startAt,
    endAt,
    title,
    priority,
    category,
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

  const receivedUserId = receivedTask.assignedUser._id.toString();

  if (reqUserId !== receivedUserId) {
    throw HttpError(401);
  }

  if (startAt && startAt > receivedTask.endAt) {
    throw HttpError(400, "End time should be later than start time");
  }

  if (endAt && endAt < receivedTask.startAt) {
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
