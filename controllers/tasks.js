const { ctrlWrapper, HttpError } = require("../helpers");
const { Task } = require("../models/task");

const getAllTasksByMonth = async (req, res) => {
  const { _id, name, avatarURL } = req.user;

  const assignedUser = {
    userId: _id,
    userName: name,
    userAvatar: avatarURL,
  };

  const result = await Task.find({ assignedUser }, "-createdAt -updatedAt");

  res.status(200).json(result);
};

const addTask = async (req, res) => {
  const { _id, name, avatarURL } = req.user;
  const { startAt, endAt } = req.body;
  const assignedUser = {
    userId: _id,
    userName: name,
    userAvatar: avatarURL,
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

  const receivedUserId = receivedTask.assignedUser.userId.toString();

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
  //const { startAt, endAt } = req.body;

  if (Object.keys(req.body).length === 0) {
    throw HttpError(400, "missing fields");
  }

  const reqUserId = req.user._id.toString();
  const { taskId } = req.params;

  const receivedTask = await Task.findById(taskId);

  if (!receivedTask) {
    throw HttpError(404);
  }

  console.log(receivedTask);

  const receivedUserId = receivedTask.assignedUser.userId.toString();

  if (reqUserId !== receivedUserId) {
    throw HttpError(401);
  }

  if (req.body.startAt && req.body.startAt > receivedTask.endAt) {
    throw HttpError(404, "End time should be later than start time");
  }

  if (req.body.endAt && req.body.endAt < receivedTask.startAt) {
    throw HttpError(404, "End time should be later than start time");
  }
  // if (startAt > endAt) {
  //   throw HttpError(404, "End time should be later than start time");
  // }

  const result = await Task.findOneAndUpdate({ _id: taskId }, req.body, {
    new: true,
  });

  if (!result) {
    throw HttpError(404);
  }
  res.status(200).json(result);
};

module.exports = {
  getAllTasksByMonth: ctrlWrapper(getAllTasksByMonth),
  addTask: ctrlWrapper(addTask),
  deleteTaskById: ctrlWrapper(deleteTaskById),
  updateTaskById: ctrlWrapper(updateTaskById),
};
