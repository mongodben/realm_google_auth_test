const Realm = require("realm");
const express = require("express");
const passport = require("passport");
const session = require("express-session");
var GoogleStrategy = require("passport-google-oauth2").Strategy;
const path = require("path");
require("dotenv").config();

const PORT = 5500;
const REALM_APP_ID = process.env.REALM_APP_ID;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const BASE_URL = `http://localhost:${PORT}`;

const app = express();
const realmApp = new Realm.App({
  id: REALM_APP_ID,
});

// serve static assets from public directory
app.use("/", express.static(path.join(__dirname, "public")));

app.use(
  session({
    secret: "secret",
    resave: false,
    saveUninitialized: true,
  })
);

app.use(passport.initialize()); // init passport on every route call
app.use(passport.session()); //allow passport to use "express-session"

async function authUser(accessToken, refreshToken, profile, done) {
  console.log(accessToken);
  console.log(refreshToken);
  console.log(profile);
  const credentials = Realm.Credentials.google({ idToken: accessToken });
  try {
    const user = await realmApp.logIn(credentials);
    console.log(`Logged in with id: ${user.id}`);
  } catch (err) {
    console.error("err is::", err);
    return done(err, profile);
  }

  return done(null, profile);
}

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: `${BASE_URL}/auth/google/callback`,
    },
    authUser
  )
);

passport.serializeUser((user, done) => {
  console.log(`\n--------> Serialize User:`);
  console.log(user);
  // The USER object is the "authenticated user" from the done() in authUser function.
  // serializeUser() will attach this user to "req.session.passport.user.{user}", so that it is tied to the session object for each session.

  done(null, user);
});

passport.deserializeUser((user, done) => {
  console.log("\n--------- Deserialized User:");
  console.log(user);
  // This is the {user} that was saved in req.session.passport.user.{user} in the serializationUser()
  // deserializeUser will attach this {user} to the "req.user.{user}", so that it can be used anywhere in the App.

  done(null, user);
});

// GET /auth/google
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  The first step in Google authentication will involve
//   redirecting the user to google.com.  After authorization, Google
//   will redirect the user back to this application at /auth/google/callback
app.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["email", "profile"],
  })
);

// GET /auth/google/callback
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.
app.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    successRedirect: "/success.html",
    failureRedirect: "/fail.html",
    failureFlash: true,
  })
);

app.post("/logout", (req, res) => {
  req.logOut();
  res.redirect("/");
  console.log(`-------> User Logged out`);
});

app.listen(PORT, () => {
  console.log(`Example app listening at http://localhost:${PORT}`);
});
