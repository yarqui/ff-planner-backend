require("dotenv").config(); /** config() method searches .env file in the project, reads variables and adds them to process.env */
const express = require("express");
const logger = require("morgan");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger.json");
const tasksRouter = require("./routes/api/tasks");
const authRouter = require("./routes/api/auth");
const reviewsRouter = require("./routes/api/reviews");
const app = express();

const formatsLogger = app.get("env") === "development" ? "dev" : "short";

app.use(logger(formatsLogger));
app.use(cors());
// Checks if request has a body, and if it has, it checks content type from Header, if it's json, it converts the string to an object using JSON.parse()
app.use(express.json());

app.use("/api/tasks", tasksRouter);
app.use("/api/users", authRouter);
app.use("/api/reviews", reviewsRouter);

app.use("/api-docs", swaggerUi.serve);
app.get("/api-docs", swaggerUi.setup(swaggerDocument));

app.use((req, res) => {
  res.status(404).json({ message: "Not found" });
});

app.use((err, req, res, next) => {
  const { status = 500, message = "Server error" } = err;

  res.status(status).json({ message });
});

module.exports = app;
