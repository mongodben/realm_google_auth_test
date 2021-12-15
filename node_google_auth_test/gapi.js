// based on: https://dev.to/aidanlovelace/how-to-setup-google-oauth2-login-with-express-2d30

const express = require("express");
const Realm = require("realm");
const { google } = require("googleapis");
const jwt = require("jsonwebtoken");
const path = require("path");
require("dotenv").config();

const OAuth2 = google.auth.OAuth2;
const PORT = 5500;
const REALM_APP_ID = process.env.REALM_APP_ID;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const BASE_URL = `http://localhost:${PORT}`;
const GOOGLE_PROJECT_ID = "boreal-depth-304822";

const oauthConfig = {
  client_id: GOOGLE_CLIENT_ID,
  project_id: GOOGLE_PROJECT_ID, // The name of your project
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_secret: GOOGLE_CLIENT_SECRET,
  redirect_uris: [`${BASE_URL}/auth/google/callback`],
  JWTsecret: "secret",
  scopes: [
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
  ],
};

const realmApp = new Realm.App({
  id: REALM_APP_ID,
});
// Creating our express application
const app = express();
// Allowing ourselves to use cookies
// NOTE: not sure if this is strictly necessary, but in a guide, so including
const cookieParser = require("cookie-parser");
app.use(cookieParser());

// serve static files
app.use("/public/", express.static(path.join(__dirname, "public")));

// Setting up EJS Views
app.set("view engine", "ejs");
app.set("views", __dirname);
const oauth2Client = new OAuth2(
  oauthConfig.client_id,
  oauthConfig.client_secret,
  oauthConfig.redirect_uris[0]
);
app.get("/", function (req, res) {
  const loginLink = oauth2Client.generateAuthUrl({
    access_type: "offline", // Indicates that we need to be able to access data continously without the user constantly giving us consent
    scope: oauthConfig.scopes, // Using the access scopes from our config file
  });
  loginLink.replace("&scope=", "&scope=profile,email");
  console.log({ loginLink });
  res.render("views/gapi_index", { loginLink });
});
app.get("/auth/google/callback", function (req, res) {
  // Create an OAuth2 client object from the credentials in our config file
  if (req.query.error) {
    // The user did not give us permission.
    return res.redirect("/public/fail.html");
  } else {
    oauth2Client.getToken(req.query.code, async function (err, token) {
      const { access_token } = token;
      console.log(access_token);
      if (err) return res.redirect("/public/fail.html");
      const creds = Realm.Credentials.google(access_token);
      const user = await realmApp.logIn(creds);
      // Store the credentials given by google into a jsonwebtoken in a cookie called 'jwt'
      res.cookie("jwt", jwt.sign(token, oauthConfig.JWTsecret));
      return res.redirect("/public/success.html");
    });
  }
});

app.post("/logout", (req, res) => {
  res.redirect("/");
  console.log(`-------> User Logged out`);
});

// Listen on the port defined in the config file
app.listen(PORT, function () {
  console.log(`Listening on port ${PORT}`);
});
