if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

// Express / EJS / NODE PACKAGES
const express = require("express");
const flash = require("connect-flash");
const ejsMate = require("ejs-mate");
const path = require("path");
const methodOverride = require("method-override");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const helmet = require("helmet");
const crypto = require("crypto");
const mongoose = require("mongoose");
const MongoStore = require("connect-mongo");
const mongoSanatize = require("express-mongo-sanitize");
const morgan = require("morgan");


// MODELS, MIDDLEWARE & UTILITIES
const { User } = require("./models/users");
const ExpressError = require("./utils/ExpressError");
const Sanitize = require('./utils/Sanitize');


// APP
const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.engine("ejs", ejsMate);
app.disable("x-powered-by"); // HIDES EXPRESS IDENTIFIER TO CONCEAL EXPRESS USAGE


// MONGO / MONGOOSE CONNECTION
const uri = process.env.MONGODB_URI;
mongoose.set("strictQuery", true);
mongoose.connect(uri)
  .catch((error) =>
  { console.log("Database NOT connected, error:", error) }
);

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
  console.log("-> 3/3 Database connected");
});


// MIDDLEWARE
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));
app.use(mongoSanatize());
app.use(flash());
app.use(helmet());
app.use( //cookies
  session({
    name: "sessid",
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({ mongoUrl: uri }),
    cookie: {
      httpOnly: true,
      SameSite: "Strict",
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  })
);

if (app.get('env') === 'production') {
  app.set('trust proxy', 1) // trust first proxy
  sessid.cookie.secure = true // serve secure cookies
}

// PASSPORT
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


// LOCALS
app.use((req, res, next) => {
  res.locals.signedInUser = req.user;
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.nonce = crypto.randomBytes(16).toString("hex");
  next();
});

// HELMENT CONFIGURATION
const scriptSrcUrls = [
  "https://cdn.jsdelivr.net"
];
const styleSrcUrls = [
  "https://fonts.googleapis.com",
  "https://fonts.gstatic.com",
];
const connectSrcUrls = [];
const fontSrcUrls = [
  "https://fonts.googleapis.com",
  "https://fonts.gstatic.com",
];

app.use((req, res, next) => {
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: [],
      connectSrc: ["'self'", ...connectSrcUrls],
      scriptSrc: ["'self'", `'nonce-${res.locals.nonce}'`, ...scriptSrcUrls],
      styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
      workerSrc: ["'self'", "blob:"],
      objectSrc: [],
      imgSrc: ["'self'", "blob:", "data:", "https://images.unsplash.com/"],
      fontSrc: ["'self'", ...fontSrcUrls],
    },
  })(req, res, next);
});

//ROUTERS
const appRoutes = require("./routes/appRouter");
const userRoutes = require("./routes/userRouter");
const conjugatorRoutes = require("./routes/conjugatorRouter");
const dictionaryRoutes = require("./routes/dictionaryRouter");
const articlesRoutes = require("./routes/articlesRouter");

// ROUTES
app.use("/", appRoutes);
app.use("/", userRoutes);
app.use("/conjugator", conjugatorRoutes);
app.use("/d", dictionaryRoutes);
app.use("/a", articlesRoutes);


app.use(morgan('dev'));


// custom error handling
// custom 404
app.all("*", (req, res, next) => {
  next(new ExpressError("Page Not Found!!!", 404));
});

app.use((err, req, res, next) => {
  const { statusCode = 500 } = err;
  const { message = "Oh No, Something Went Wrong!" } = err;
  const title = "Page Not Found";
  res
    .status(statusCode)
    .render("app/pagenotfound", { title, statusCode });
  if (app.get('env') === "development") console.log(statusCode, err.message, err);
});


// APPLICATION PORT
const port = process.env.PORT;
app.listen(port, () => {
  console.log(`-> 1/3 LISTENING ON ${port}`);
  console.log(`-> 2/3 app env ${app.get('env')}`);
});
