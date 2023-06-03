// Mongoose model - is a noun in a single form, so we name the file task.js
const { Schema, model } = require("mongoose");
const Joi = require("joi");
const { handleMongooseError } = require("../helpers");
const { userSchema } = require("./user");

const priorityValues = ["low", "medium", "high"];
const categoryValues = ["to-do", "in-progress", "done"];

const taskSchema = new Schema(
  {
    // timestamp
    startAt: {
      type: Number,
      required: [true, "Set a start time to a task"],
    },
    // timestamp
    endAt: {
      type: Number,
      required: [true, "Set an end time to a task"],
    },
    title: {
      type: String,
      maxLength: 200,
      trim: true,
      required: [true, "Set a title to a task"],
    },
    assignedUser: {
      // TODO: we will try to set the userSchema from user.js to match the exact object
      // will it work?
      // type: userSchema,
      type: Object,
      required: [true, "Assign a user to a task"],
    },
    priority: {
      type: String,
      enum: priorityValues,
      required: [true, "Set a priority to a task"],
    },
    category: {
      type: String,
      enum: categoryValues,
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

// model() method creates a model of the Schema. It is a Class, so we use capital letter. 1st argument - name of the collection of DB in a ❗single form, 2nd - schema
const Task = model("task", taskSchema);

module.exports = {
  Task,
};
