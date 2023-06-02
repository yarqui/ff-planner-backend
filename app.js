require("dotenv").config(); /** config() method searches .env file in the project, reads variables and adds them to process.env */
const express = require("express");
const logger = require("morgan");
const cors = require("cors");

const authRouter = require("./routes/api/auth");
const contactsRouter = require("./routes/api/contacts");

const app = express();

const formatsLogger = app.get("env") === "development" ? "dev" : "short";

app.use(logger(formatsLogger));
app.use(cors());
// Checks if request has a body, and if it has, it checks content type from Header, if it's json, it converts the string to an object using JSON.parse()
app.use(express.json());
// If there is a query for static file, it tells to search for it in "public" folder
app.use(express.static("public"));

app.use("/api/users", authRouter);
app.use("/api/contacts", contactsRouter);

app.use((req, res) => {
  res.status(404).json({ message: "Not found" });
});

app.use((err, req, res, next) => {
  const { status = 500, message = "Server error" } = err;

  res.status(status).json({ message });
});

module.exports = app;
