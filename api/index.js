require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("./models/User.js");
const Place = require("./models/Place.js");
const Booking = require("./models/Booking.js");
const cookieParser = require("cookie-parser");
const imageDownloader = require("image-downloader");
const multer = require("multer");
const fs = require("fs");
const mime = require("mime-types");
const cloudinary = require("./middlewares/cloudinary");

const router = express.Router();

const app = express();

const bcryptSalt = bcrypt.genSaltSync(10);
const jwtSecret = process.env.JWT_SECRET_TOKEN;

console.log(process.env.MONGO_URL);

app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static(__dirname + "/uploads"));
const allowedOrigins = ["http://localhost:5173", "http://localhost:3000"];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

function getUserDataFromReq(req) {
  return new Promise((resolve, reject) => {
    jwt.verify(req.cookies.token, jwtSecret, {}, async (err, userData) => {
      if (err) throw err;
      resolve(userData);
    });
  });
}

app.get("/api/test", (req, res) => {
  //mongoose.connect(process.env.MONGO_URL);
  res.json("test ok");
});

app.post("/api/register", async (req, res) => {
  //mongoose.connect(process.env.MONGO_URL);
  const { name, email, password } = req.body;

  try {
    const userDoc = await User.create({
      name,
      email,
      password: bcrypt.hashSync(password, bcryptSalt),
    });
    res.json(userDoc);
  } catch (e) {
    res.status(422).json(e);
  }
});

app.post("/api/login", async (req, res) => {
  //mongoose.connect(process.env.MONGO_URL);
  const { email, password } = req.body;
  const userDoc = await User.findOne({ email });
  if (userDoc) {
    const passOk = bcrypt.compareSync(password, userDoc.password);
    if (passOk) {
      jwt.sign(
        {
          email: userDoc.email,
          id: userDoc._id,
        },
        jwtSecret,
        {},
        (err, token) => {
          if (err) throw err;
          res
            .cookie("token", token, {
              httpOnly: true,
              sameSite: "lax", // NOT "None" if you're on localhost
              secure: false, // true only if HTTPS
            })
            .json(userDoc);
        }
      );
    } else {
      res.status(422).json("pass not ok");
    }
  } else {
    res.json("not found");
  }
});

app.post("/api/profile", async (req, res) => {
  //mongoose.connect(process.env.MONGO_URL);
  const { token } = req.cookies;
  const { name, phone, location } = req.body;

  jwt.verify(token, jwtSecret, {}, async (err, userData) => {
    if (err) return res.status(401).json("Unauthorized");
    const userDoc = await User.findById(userData.id);
    userDoc.name = name || userDoc.name;
    userDoc.phone = phone || userDoc.phone;
    userDoc.location = location || userDoc.location;
    await userDoc.save();
    res.json(userDoc);
  });
});

app.get("/api/profile", (req, res) => {
  console.log("Cookies:", req.cookies);
  const { token } = req.cookies;

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  jwt.verify(token, jwtSecret, {}, async (err, userData) => {
    if (err) {
      return res.status(401).json({ message: "Invalid Token" });
    }
    try {
      const userDoc = await User.findById(userData.id);
      res.json({
        name: userDoc.name,
        email: userDoc.email,
        phone: userDoc.phone || "",
        location: userDoc.location || "",
        _id: userDoc._id,
      });
    } catch (e) {
      res.status(500).json({ message: "Server Error" });
    }
  });
});

app.post("/api/logout", (req, res) => {
  res
    .cookie("token", "", {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
    })
    .json(true);
});

app.post("/api/upload-by-link", async (req, res) => {
  const { link } = req.body;
  const newName = "photo" + Date.now() + ".jpg";
  await imageDownloader.image({
    url: link,
    dest: "/tmp/" + newName,
  });

  const result = await cloudinary.uploader.upload("/tmp/" + newName, {
    folder: "uploads",
  });

  fs.unlinkSync("/tmp/" + newName);
  res.json(result.secure_url);
});

const photosMiddleware = multer({ dest: "/tmp" });

app.post(
  "/api/upload",
  photosMiddleware.array("photos", 100),
  async (req, res) => {
    const uploadedFiles = [];
    try {
      for (let file of req.files) {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: "guestnest_uploads",
        });
        uploadedFiles.push(result.secure_url);
        fs.unlinkSync(file.path);
      }
      res.json(uploadedFiles);
    } catch (err) {
      res
        .status(500)
        .json({ error: "Cloudinary upload failed", details: err.message });
    }
  }
);

app.post("/api/places", (req, res) => {
  //mongoose.connect(process.env.MONGO_URL);
  const { token } = req.cookies;
  const {
    title,
    address,
    addedPhotos,
    description,
    price,
    perks,
    extraInfo,
    checkIn,
    checkOut,
    maxGuests,
  } = req.body;
  jwt.verify(token, jwtSecret, {}, async (err, userData) => {
    if (err) throw err;
    const placeDoc = await Place.create({
      owner: userData.id,
      price,
      title,
      address,
      photos: addedPhotos,
      description,
      perks,
      extraInfo,
      checkIn,
      checkOut,
      maxGuests,
    });
    res.json(placeDoc);
  });
});

app.get("/api/user-places", (req, res) => {
  //mongoose.connect(process.env.MONGO_URL);
  const { token } = req.cookies;
  jwt.verify(token, jwtSecret, {}, async (err, userData) => {
    const { id } = userData;
    res.json(await Place.find({ owner: id }));
  });
});

app.get("/api/places/:id", async (req, res) => {
  //mongoose.connect(process.env.MONGO_URL);
  const { id } = req.params;
  res.json(await Place.findById(id));
});

app.put("/api/places", async (req, res) => {
  //mongoose.connect(process.env.MONGO_URL);
  const { token } = req.cookies;
  const {
    id,
    title,
    address,
    addedPhotos,
    description,
    perks,
    extraInfo,
    checkIn,
    checkOut,
    maxGuests,
    price,
  } = req.body;
  jwt.verify(token, jwtSecret, {}, async (err, userData) => {
    if (err) throw err;
    const placeDoc = await Place.findById(id);
    if (userData.id === placeDoc.owner.toString()) {
      placeDoc.set({
        title,
        address,
        photos: addedPhotos,
        description,
        perks,
        extraInfo,
        checkIn,
        checkOut,
        maxGuests,
        price,
      });
      await placeDoc.save();
      res.json("ok");
    }
  });
});

app.get("/api/places", async (req, res) => {
  //mongoose.connect(process.env.MONGO_URL);
  res.json(await Place.find());
});

app.post("/api/bookings", async (req, res) => {
  try {
    //mongoose.connect(process.env.MONGO_URL);
    const userData = await getUserDataFromReq(req);
    const { place, checkIn, checkOut, numberOfGuests, name, phone, price } =
      req.body;

    if (!checkIn || !checkOut || !phone) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const booking = await Booking.create({
      place,
      checkIn,
      checkOut,
      numberOfGuests,
      name,
      phone,
      price,
      user: userData.id,
    });

    res.json(booking);
  } catch (err) {
    res.status(500).json({ error: "Booking failed", details: err });
  }
});

app.get("/api/bookings", async (req, res) => {
  //mongoose.connect(process.env.MONGO_URL);
  const userData = await getUserDataFromReq(req);
  res.json(await Booking.find({ user: userData.id }).populate("place"));
});

app.get("/api/search", async (req, res) => {
  //mongoose.connect(process.env.MONGO_URL);
  const { query } = req.query;

  try {
    let places;
    if (!query) {
      places = await Place.find(); // return all places if no search term
    } else {
      places = await Place.find({
        $or: [
          { title: { $regex: query, $options: "i" } },
          { address: { $regex: query, $options: "i" } },
          { description: { $regex: query, $options: "i" } },
        ],
      });
    }

    res.json(places);
  } catch (err) {
    res.status(500).json({ error: "Failed to search places" });
  }
});

mongoose.connect(process.env.MONGO_URL).then(() => {
  app.listen(process.env.PORT || 4000);
});
