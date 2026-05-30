import express from "express";
import mongoose from "mongoose";
import { configDotenv } from "dotenv";
import userModel from "./models/UserModel.js";
import path from "path";
import { fileURLToPath } from "url";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";

passport.use(new LocalStrategy(
  async (username, password, done) => {
    try {
      const user = await userModel.findOne({ username });
      if (!user) {
        return done(null, false, { message: 'Incorrect username.' });
      }
      if (user.password !== password) {
        return done(null, false, { message: 'Incorrect password.' });
      }
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }
)); 

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
app.use(
  session({
    secret: "mysecretkey",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());

mongoose
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
      return res.status(400).render("signup", {
        error: "All fields are required",
      });
    }
    const existingUser = await userModel.findOne({ username });
    if (existingUser) {
      return res.status(400).render("signup", {
        error: "Username already exists",
      });
    }
    const newUser = new userModel({ name, username, password });
    await newUser.save();

    return res.redirect("/user");
  } catch (e) {
    console.log(`Error creating user: ${e.message}`);
    return res.status(500).render("signup", {
      error: "Something went wrong while creating your account",
    });
  }
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {

    if (err) {
      return res.status(500).render("login", {
        error: "Something went wrong"
      });
    }

    if (!user) {
      return res.status(401).render("login", {
        error: info?.message || "Invalid credentials"
      });
    }

    // save user in session
    req.session.user = user;

    return res.redirect("/user");

  })(req, res, next);
});
app.get("/user", (req, res) => {
  res.render("afterUser");
});
app.get("/session", (req, res) => {
  if(req.session.user) {
    res.send(`Welcome, ${req.session.user.name}!`);
  } else {
    res.status(401).json({ error: "Not authenticated" });
  }
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(PORT, () => {
  console.log(`Server is running at  http://localhost:${PORT}`);
});
