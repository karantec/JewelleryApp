const admin = require("firebase-admin");

// Load Firebase credentials from service account
const serviceAccount = require("../config/jewellery-fdeea-firebase-adminsdk-fbsvc-475b80990f.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

module.exports = admin;
