import express from "express";
import mongoose from "mongoose";
import { configDotenv } from "dotenv";
import userModel from "./models/UserModel.js";
import path from "path";


configDotenv();

const app = express();
const PORT = process.env.PORT || 5000;
app.use(express.json());
app.use(express.static(path.join(process.cwd(), "public")));
app.use(express.urlencoded({ extended: true }));



const db = mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((e) => {
    console.log(`Error connecting to MongoDB: ${e.message}`);
  });

app.get("/signup", (req, res) => {
  res.sendFile(path.join(process.cwd(), "public", "signup.html"));
});
app.post("/signup", async (req, res) => {
  const { name, username, password } = req.body;
  try {
    if (!name || !username || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (userModel.find({ username }))
      return res.status(400).json({ message: "Username already exists" });
    const newUser = new userModel({ name, username, password });
    await newUser.save();
    res.status(201).json({ message: "User created successfully" });
  } catch (e) {
    console.log(`Error creating user: ${e.message}`);
  }
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(PORT, () => {
  console.log(`Server is running at  http://localhost:${PORT}`);
});
