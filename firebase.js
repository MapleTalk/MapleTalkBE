const admin = require('firebase-admin');
const serviceAccount = require('./config/serviceAccountKey.json');

let firebaseAdmin;
const FieldValue = admin.firestore.FieldValue;

async function initFirebase() {
  if (!firebaseAdmin) {
    firebaseAdmin = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
}

function getFirestore() {
  if (!firebaseAdmin) {
    throw new Error('Firestore has not been initialized yet. Call initFirebase first.');
  }

  return firebaseAdmin.firestore();
}

module.exports = { initFirebase, getFirestore, FieldValue };
