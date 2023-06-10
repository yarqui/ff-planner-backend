// Mongoose model - is a noun in a single form, so we name the file task.js
const { Schema, model } = require("mongoose");
const Joi = require("joi");

const { handleMongooseError } = require("../helpers");

const PRIORITY_VALUES = ["low", "medium", "high"];
const CATEGORY_VALUES = ["to-do", "in-progress", "done"];
const TIMESTAMP_REGEX = /^\d{10}$/;

const taskSchema = new Schema(
  {
    // timestamp
    startAt: {
      type: Number,
      match: TIMESTAMP_REGEX,
      required: [true, "Set a start time to a task"],
    },
    // timestamp
    endAt: {
      type: Number,
      match: TIMESTAMP_REGEX,
      required: [true, "Set an end time to a task"],
    },
    title: {
      type: String,
      maxLength: 200,
      trim: true,
      required: [true, "Set a title to a task"],
    },

    assignedUser: {
      userId: {
        type: Schema.Types.ObjectId,
        ref: "user",
        required: true,
      },
      userName: {
        type: String,
        required: true,
      },
      userAvatar: {
        type: String,
        default: null,
      },
    },
    priority: {
      type: String,
      enum: PRIORITY_VALUES,
      required: [true, "Set a priority to a task"],
    },
    category: {
      type: String,
      enum: CATEGORY_VALUES,
      required: [true, "Set a category to a task"],
    },
  },
  {
    // removes "_v" and adds creation and changing timestamps to document
    versionKey: false,
    timestamps: true,
  }
);

// if during saving we have an error, this middleware is set, otherwise mongoose error doesn't set error.status
taskSchema.post("save", handleMongooseError);

// Joi schema for adding a task
const addTaskSchema = Joi.object({
  startAt: Joi.number().required(),
  endAt: Joi.number().required(),
  title: Joi.string().required(),
  priority: Joi.string()
    .valid(...PRIORITY_VALUES)
    .required(),
  category: Joi.string()
    .valid(...CATEGORY_VALUES)
    .required(),
});

const updateTaskSchema = Joi.object({
  startAt: Joi.number(),
  endAt: Joi.number(),
  title: Joi.string(),
  priority: Joi.string().valid(...PRIORITY_VALUES),
  category: Joi.string().valid(...CATEGORY_VALUES),
});

const taskSchemas = {
  addTaskSchema,
  updateTaskSchema,
};
// model() method creates a model of the Schema. It is a Class, so we use capital letter. 1st argument - name of the collection of DB in a ❗single form, 2nd - schema
const Task = model("task", taskSchema);

module.exports = {
  Task,
  taskSchemas,
};
