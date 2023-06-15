const { ctrlWrapper, HttpError } = require("../helpers");
const { Task } = require("../models/task");
const { User } = require("../models/user");

const getTasks = async (req, res) => {
  const { _id } = req.user;
  const { filterBy, date } = req.query;
  console.log("date:", date); // date is a string ''Fri Jun 16 2023 00:00:00 GMT+0300 (за східноєвропейським літнім часом)''

  const dataRef = new Date(date); // it's UTC time
  console.log("dataRef:", dataRef);
  const offset = dataRef.getTimezoneOffset() * 60000; // Convert minutes to milliseconds

  console.log("offset:", offset);

  if (filterBy === "month") {
    // const targetYear = dataRef.getFullYear();
    // console.log("targetMonth:", targetMonth);
    // console.log("targetYear:", targetYear);

    // const startOfMonth = new Date(targetYear, targetMonth, 1);
    // startOfMonth.setUTCHours(0, 0, 0, 0);
    // console.log("startOfMonth:", startOfMonth);

    // const startOfMonthOffset = new Date(
    //   Date.UTC(targetYear, targetMonth, 1) - offset
    // ); // Adjust for user's local offset

    // console.log("startOfMonthOffset:", startOfMonthOffset);

    // const endOfMonth = new Date(targetYear, targetMonth + 1, 0);
    // endOfMonth.setUTCHours(23, 59, 59, 999);
    // console.log("endOfMonth:", endOfMonth);

    // const endOfMonthOffset = new Date(
    //   Date.UTC(targetYear, targetMonth, 0) - offset
    // ); // Adjust for user's local offset

    // console.log("endOfMonthOffset:", endOfMonthOffset);
    const targetMonth = dataRef.getMonth();
    const targetYear = dataRef.getFullYear();
    console.log("targetMonth:", targetMonth);
    console.log("targetYear:", targetYear);

    const startOfMonth = new Date(targetYear, targetMonth, 1);
    startOfMonth.setUTCHours(0, 0, 0, 0);
    console.log("startOfMonth:", startOfMonth);

    const startOfMonthOffset = new Date(startOfMonth.getTime() - offset); // Adjust for user's local offset

    console.log("startOfMonthOffset:", startOfMonthOffset);

    const endOfMonth = new Date(targetYear, targetMonth + 1, 0);
    endOfMonth.setUTCHours(23, 59, 59, 999);
    console.log("endOfMonth:", endOfMonth);

    const endOfMonthOffset = new Date(endOfMonth.getTime() - offset); // Adjust for user's local offset

    console.log("endOfMonthOffset:", endOfMonthOffset);

    const filteredTasks = await Task.find(
      {
        assignedUserId: _id,
        startAt: { $gte: startOfMonthOffset, $lt: endOfMonthOffset },
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
    const targetDayStart = new Date(dataRef);
    targetDayStart.setUTCHours(0, 0, 0, 0);
    console.log("targetDayStart:", targetDayStart);

    const targetDayEnd = new Date(dataRef);
    targetDayEnd.setUTCHours(23, 59, 59, 999);
    console.log("targetDayEnd:", targetDayEnd);
    console.log(new Date(targetDayStart - offset));
    console.log(new Date(targetDayEnd - offset));

    const filteredTasks = await Task.find(
      {
        assignedUserId: _id,
        startAt: {
          $gte: new Date(targetDayStart.getTime() + offset), // Adjust for user's local offset
          $lt: new Date(targetDayEnd.getTime() + offset), // Adjust for user's local offset
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

  const receivedUserId = receivedTask.assignedUserId.toString();

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
