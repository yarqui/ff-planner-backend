const express = require("express");
const { Task } = require("../../models/task");

const router = express.Router();

// FIXME: just for test. Later we will create controller
router.get("/", async (req, res) => {
  const result = await Task.find();

  if (!result) {
    throw HttpError(404, "Not found");
  }

  res.status(200).json(result);
});

module.exports = router;
