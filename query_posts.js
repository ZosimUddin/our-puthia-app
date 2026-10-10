import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, limit, orderBy } from 'firebase/firestore';
import fs from 'fs';

async function run() {
  try {
    const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
    const app = initializeApp(config);
    const db = getFirestore(app);

    console.log("Fetching discussions...");
    const q = query(collection(db, 'discussions'), orderBy('createdAt', 'desc'), limit(15));
    const snap = await getDocs(q);

    console.log(`Found ${snap.size} posts:`);
    snap.forEach(docSnap => {
      const data = docSnap.data();
      console.log(`\nDoc ID: ${docSnap.id}`);
      console.log(`Author: ${data.author}`);
      console.log(`Content: ${data.content?.slice(0, 50)}`);
      console.log(`CreatedAt: ${data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate().toISOString() : data.createdAt) : 'none'}`);
      console.log(`videoUrl: ${data.videoUrl ? (data.videoUrl.slice(0, 100) + '...') : 'none'}`);
      console.log(`videoPreview: ${data.videoPreview ? (data.videoPreview.slice(0, 100) + '...') : 'none'}`);
    });
  } catch (err) {
    console.error("Error in query_posts:", err);
  }
}

run();
