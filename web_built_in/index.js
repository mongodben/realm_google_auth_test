const app = new Realm.App({
  id: "myapp-zufnj",
});

const authButton = document.getElementById("google-auth");
authButton.addEventListener("click", async (e) => {
  e.preventDefault();
  try {
    // The redirect URI should be on the same domain as this app and
    // specified in the auth provider configuration.
    const redirectUri = "http://localhost:5501/auth.html";
    const credentials = Realm.Credentials.google(redirectUri);
    // Calling logIn() opens a Google authentication screen in a new window.
    app.logIn(credentials).then((user) => {
      // The logIn() promise will not resolve until you call `handleAuthRedirect()`
      // from the new window after the user has successfully authenticated.
      console.log(`Logged in with id: ${user.id}`);
    });
  } catch (err) {
    console.error("error::", err);
  }
});
