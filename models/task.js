// Mongoose model - is a noun in a single form, so we name the file task.js
const { Schema, model } = require("mongoose");
const Joi = require("joi");
Joi.objectId = require("joi-objectid")(Joi);

const { handleMongooseError } = require("../helpers");
// const { userSchema } = require("./user");

const priorityValues = ["low", "medium", "high"];
const categoryValues = ["to-do", "in-progress", "done"];
const timestampRegex =
  /(\b(\d{4})\-(\d{2})(\-(\d{2})))(T| )((\d{2}):(\d{2}))(?:(:(\d{2}))?(((\.)\d+))?([Zz]|((\-|\+)\d{2}(:(\d{2}))?))?)/g;

const taskSchema = new Schema(
  {
    // timestamp
    startAt: {
      type: Number,
      match: timestampRegex,
      required: [true, "Set a start time to a task"],
    },
    // timestamp
    endAt: {
      type: Number,
      match: timestampRegex,
      required: [true, "Set an end time to a task"],
    },
    title: {
      type: String,
      maxLength: 200,
      trim: true,
      required: [true, "Set a title to a task"],
    },
    // assignedUser: {
    //   // TODO: we will try to set the userSchema from user.js to match the exact object
    //   // will it work?
    //   // type: userSchema,
    //   type: Object,
    //   required: [true, "Assign a user to a task"],
    // },
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
        required: true,
      },
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

// Joi schema for adding a task
const addTaskSchema = Joi.object({
  startAt: Joi.number().required(),
  endAt: Joi.number().required(),
  title: Joi.string().required(),
  assignedUser: {
    userId: Joi.objectId().required(),
    userName: Joi.string().required(),
    userAvatar: Joi.string().required(),
  },
  priority: Joi.string()
    .valid(...priorityValues)
    .required(),
  category: Joi.string()
    .valid(...categoryValues)
    .required(),
});

const updateTaskSchema = Joi.object({
  startAt: Joi.number(),
  endAt: Joi.number(),
  title: Joi.string(),
  assignedUser: {
    userId: Joi.objectId().required(),
    userName: Joi.string().required(),
    userAvatar: Joi.string().required(),
  },
  priority: Joi.string().valid(...priorityValues),
  category: Joi.string().valid(...categoryValues),
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
