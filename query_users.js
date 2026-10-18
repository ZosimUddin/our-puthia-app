import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';

async function run() {
  try {
    const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
    const app = initializeApp(config);
    const db = getFirestore(app);

    console.log("Fetching users...");
    const snap = await getDocs(collection(db, 'users'));

    console.log(`Found ${snap.size} users:`);
    snap.forEach(docSnap => {
      const data = docSnap.data();
      console.log(`\nUser ID: ${docSnap.id}`);
      console.log(`Name: ${data.name}`);
      console.log(`Username: ${data.username}`);
      console.log(`Email: ${data.email}`);
      console.log(`Phone: ${data.phone}`);
      console.log(`Bio: ${data.bio || 'none'}`);
      console.log(`photoURL length: ${data.photoURL ? data.photoURL.length : 'none'}`);
      console.log(`coverURL length: ${data.coverURL ? data.coverURL.length : 'none'}`);
      console.log(`Friends length: ${Array.isArray(data.friends) ? data.friends.length : 'none'}`);
    });
  } catch (err) {
    console.error("Error in query_users:", err);
  }
}

run();
