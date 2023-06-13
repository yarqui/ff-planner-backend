const { Schema, model } = require("mongoose");
const Joi = require("joi");
const { handleMongooseError } = require("../helpers");

const EMAIL_REGEX =
  /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/; // eslint-disable-line
const THEME_VALUES = ["light", "dark"];
const LANG_VALUES = ["uk", "en"];

const userSchema = new Schema(
  {
    theme: {
      type: String,
      enum: THEME_VALUES,
      default: THEME_VALUES[0],
    },
    language: {
      type: String,
      enum: LANG_VALUES,
      default: LANG_VALUES[1],
    },
    name: {
      type: String,
      maxLength: 40,
      required: [true, "Name is required"],
    },
    email: {
      type: String,
      match: EMAIL_REGEX,
      unique: true, // prevents from adding a duplicate email to the database
      required: [true, "Email is required"],
    },
    phone: {
      type: String,
      maxLength: 20,
      default: null,
    },
    password: {
      type: String,
      minLength: 6,
      required: [true, "Password is required"],
    },
    // timestamp
    birthday: {
      type: Number,
      default: null,
    },
    skype: {
      type: String,
      default: null,
    },
    token: {
      type: String,
      // we don't have a token, until the user logs in
      default: null,
    },
    avatarURL: {
      type: String,
      default: null,
    },
    avatarPublicId: {
      type: String,
      default: null,
    },
    verified: {
      // this field is responsible for whether the user has verified his email
      type: Boolean,
      default: false,
    },
    verificationToken: {
      // verification token sent to verify user's email
      type: String,
      required: [true, "Verification token is required"],
    },
  },
  // removes "_v" and adds creation and changing timestamps to document
  { versionKey: false, timestamps: true }
);

// if during saving we have an error, this middleware is set, otherwise mongoose error doesn't set error.status
userSchema.post("save", handleMongooseError);

const signupSchema = Joi.object({
  name: Joi.string().max(40).required(),
  email: Joi.string().pattern(EMAIL_REGEX).required(),
  password: Joi.string().min(6).required(),
}).unknown(true);

const loginSchema = Joi.object({
  email: Joi.string().pattern(EMAIL_REGEX).required(),
  password: Joi.string().min(6).required(),
}).unknown(true);

const emailSchema = Joi.object({
  email: Joi.string().pattern(EMAIL_REGEX).required().messages({
    "string.empty": `"email" cannot be an empty field`,
    "any.required": `missing required field: "email"`,
  }),
}).unknown(true);

const updateUserSchema = Joi.object({
  name: Joi.string().max(40),
  email: Joi.string().pattern(EMAIL_REGEX),
  phone: Joi.string().max(20).allow(""),
  skype: Joi.string().allow(""),
  birthday: Joi.number().allow(""),
  theme: Joi.string().valid(...THEME_VALUES),
  language: Joi.string().valid(...LANG_VALUES),
}).unknown(true);

const userPasswordSchema = Joi.object({
  oldPassword: Joi.string().min(6).required(),
  newPassword: Joi.string().min(6).required(),
}).unknown(true);

const schemas = {
  signupSchema,
  emailSchema,
  loginSchema,
  updateUserSchema,
  userPasswordSchema,
};

// model() method creates a model of the Schema. It is a Class, so we use capital letter. 1st argument - name of the collection of DB in a ❗single form, 2nd - schema
const User = model("user", userSchema);

module.exports = {
  User,
  userSchema,
  schemas,
};
