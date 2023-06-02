/* eslint-disable no-undef */
const mongoose = require("mongoose");
const request = require("supertest");
const bcrypt = require("bcrypt");
const gravatar = require("gravatar");
const app = require("../app");
const { DB_HOST } = process.env;
const { User } = require("../models/user");

describe("Login", () => {
  let user;
  const avatarURL = gravatar.url("testuser@email.com");

  beforeAll(async () => {
    await mongoose.connect(DB_HOST);

    user = await User.create({
      email: "testuser@email.com",
      password: await bcrypt.hash("password", 10),
      avatarURL: gravatar.url(avatarURL),
    });
  });

  afterAll(async () => {
    await User.deleteOne({ _id: user._id });
    await mongoose.disconnect();
  });

  test("Response must have status code 200", async () => {
    await request(app)
      .post("/api/users/login")
      .send({ email: user.email, password: "password" })
      .expect(200);
  });

  test("The token must be returned in the response", async () => {
    const response = await request(app)
      .post("/api/users/login")
      .send({ email: user.email, password: "password" })
      .expect(200);

    expect(response.body).toHaveProperty("token");
    expect(response.body.token).toBeTruthy();
  });

  test("The response should return a user object with 2 fields email and subscription, having the data type String", async () => {
    const response = await request(app)
      .post("/api/users/login")
      .send({ email: user.email, password: "password" })
      .expect(200);

    expect(response.body.user).toHaveProperty("email");
    expect(response.body.user.email).toBe(user.email);
    expect(typeof response.body.user.email).toBe("string");

    expect(response.body.user).toHaveProperty("subscription");
    expect(response.body.user.subscription).toBe(user.subscription);
    expect(typeof response.body.user.subscription).toBe("string");
  });
});
