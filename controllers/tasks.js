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
  // const date = new Date(result[0].startAt);
  // const dateTimestamp = date.toISOString();
  // const month = dateTimestamp.split("-");
  // console.log(month);
  // console.log(date.toISOString());
  // console.log(result[0].startAt);
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
  console.log(reqUserId);
  const { taskId } = req.params;

  const receivedTask = await Task.findById(taskId);
  const receivedUserId = receivedTask.assignedUser.userId.toString();
  console.log(receivedUserId);

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
  if (Object.keys(req.body).length === 0) {
    res.status(400).json({
      message: "missing fields",
    });
  }

  const reqUserId = req.user._id.toString();
  const { taskId } = req.params;

  const receivedTask = await Task.findById(taskId);
  const receivedUserID = receivedTask.assignedUser.userId.toString();

  if (reqUserId !== receivedUserID) {
    throw HttpError(401);
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
  getAllTasksByMonth: ctrlWrapper(getAllTasksByMonth),
  addTask: ctrlWrapper(addTask),
  deleteTaskById: ctrlWrapper(deleteTaskById),
  updateTaskById: ctrlWrapper(updateTaskById),
};
