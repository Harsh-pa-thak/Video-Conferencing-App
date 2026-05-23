import express from "express";
import mongoose from "mongoose";
import { configDotenv } from "dotenv";
import userModel from "./models/UserModel.js";
import path from "path";
import { fileURLToPath } from "url";


configDotenv();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");


const db = mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((e) => {
    console.log(`Error connecting to MongoDB: ${e.message}`);
  });

app.get("/signup", (req, res) => {
  res.render("signup");
});
app.post("/signup", async (req, res) => {
  const { name, username, password } = req.body;
  try {
    if (!name || !username || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const existingUser = await userModel.findOne({ username });
    if (existingUser)
      return res.status(400).json({ message: "Username already exists" });
    const newUser = new userModel({ name, username, password });
    await newUser.save();
    
    res.status(201).json({ message: "User created successfully" }).redirect("/user");
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
