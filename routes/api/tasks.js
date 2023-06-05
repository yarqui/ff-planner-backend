const express = require("express");
const { Task } = require("../../models/task");
const { HttpError } = require("../../helpers");
const ctrl = require("../../controllers/tasks");

const router = express.Router();

router.get("/", ctrl.getAllByMonth);

router.post("/", ctrl.add);

router.delete("/:id", ctrl.deleteById);

router.patch("/:id", ctrl.updateById);
// FIXME: just for test. Later we will create controller
// router.get("/", async (req, res) => {
//   const result = await Task.find();

//   if (!result) {
//     throw HttpError(404, "Not found");
//   }

//   res.status(200).json(result);
// });

module.exports = router;
