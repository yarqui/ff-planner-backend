const { ctrlWrapper, HttpError } = require("../helpers");
const { Task } = require("../models/task");

const getAllTasksByMonth = async (req, res) => {
  const { _id: assignedUser } = req.user;
  const result = await Task.find({ assignedUser }, "-createdAt -updatedAt");

  res.status(200).json(result);
};

const addTask = async (req, res) => {
  const { _id, name, avatarURL } = req.user;
  const assignedUser = {
    userId: _id,
    userName: name,
    userAvatar: avatarURL,
  };

  const result = await Task.create({
    ...req.body,
    assignedUser,
  });
  res.status(201).json(result);
};

const deleteTaskById = async (req, res) => {
  const { _id: assignedUser } = req.user;
  const { id } = req.params;

  const result = await Task.findOneAndDelete({
    _id: id,
    assignedUser: assignedUser.toString(),
  });

  if (!result) {
    throw HttpError(404);
  }

  res.status(200).json({
    message: "Task is deleted",
  });
};

const updateTaskById = async (req, res) => {
  if (Object.keys(req.body).length === 0) {
    res.status(400).json({
      message: "missing fields",
    });
  }
  const { _id: assignedUser } = req.user;
  const { id } = req.params;

  const result = await Task.findOneAndUpdate(
    { _id: id, assignedUser: assignedUser.toString() },
    req.body,
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
  getAllTasksByMonth: ctrlWrapper(getAllTasksByMonth),
  addTask: ctrlWrapper(addTask),
  deleteTaskById: ctrlWrapper(deleteTaskById),
  updateTaskById: ctrlWrapper(updateTaskById),
};
