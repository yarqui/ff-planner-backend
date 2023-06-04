const mongoose = require("mongoose");
const app = require("./app");

const { DB_HOST, PORT } = process.env;

mongoose.set("strictQuery", true);

const connection = mongoose.connect(DB_HOST, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

connection
  .then(() => {
    app.listen(PORT, () => {
      console.log(
        `Database connection successful. \nServer running. Use our API on port: ${PORT}. \nhttp://localhost:${PORT}/api/ `
      );
    });
  })
  .catch((error) => {
    console.log(error.message);
    process.exit(1);
  });
