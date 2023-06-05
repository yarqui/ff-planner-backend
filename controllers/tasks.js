const { ctrlWrapper } = require("../helpers");
const { Task } = require("../models/task");

const getAllByMonth = async (req, res) => {
  //   const { _id: assignedUser } = req.user;
  //   const result = await Task.find({ assignedUser });
  const result = await Task.find();

  res.json(result);
};

const add = async (req, res) => {
  //   const { _id: assignedUser } = req.user;
  //   const result = await Task.create({ ...req.body, assignedUser });
  const result = await Task.create(req.body);
  res.status(201).json(result);
};

const deleteById = async (req, res) => {
  //   const { _id: owner } = req.user;
  const { id } = req.params;

  //   const result = await Task.findOneAndDelete({
  //     _id: id,
  //     owner: owner.toString(),
  //   });

  const result = await Task.findByIdAndDelete(id);

  if (!result) {
    throw HttpError(404);
  }

  res.json({
    message: "Task is deleted",
  });
};

const updateById = async (req, res) => {
  if (Object.keys(req.body).length === 0) {
    res.status(400).json({
      message: "missing fields",
    });
  }
  //   const { _id: owner } = req.user;
  const { id } = req.params;

  const result = await Task.findByIdAndUpdate(id, req.body, {
    new: true,
  });

  //   const result = await Task.findOneAndUpdate(
  //     { _id: id, owner: owner.toString() },
  //     req.body,
  //     {
  //       new: true,
  //     }
  //   );
  if (!result) {
    throw HttpError(404);
  }
  res.json(result);
};

module.exports = {
  getAllByMonth: ctrlWrapper(getAllByMonth),
  add: ctrlWrapper(add),
  deleteById: ctrlWrapper(deleteById),
  updateById: ctrlWrapper(updateById),
};
