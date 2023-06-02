// Mongoose model - is a noun in a single form, so we name the file contact.js
const { Schema, model } = require("mongoose");
const Joi = require("joi");
const { handleMongooseError } = require("../helpers");

const taskSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Set name for a task"],
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

// model() method creates a model of the Schema. It is a Class, so we use capital letter. 1st argument - name of the collection of DB in a single form, 2nd - schema
const Task = model("task", taskSchema);

module.exports = {
  Task,
};
