const mongoose = require('mongoose');

async function run() {
  await mongoose.connect('mongodb://localhost:27017/samagama');
  const db = mongoose.connection.db;
  
  const qCount = await db.collection('questions').countDocuments();
  console.log('Total questions:', qCount);
  
  if (qCount > 0) {
    const q = await db.collection('questions').findOne();
    console.log('Sample question tags:', q.tags);
    console.log('Sample question category:', q.category);
  }
  
  const cCount = await db.collection('categories').countDocuments();
  console.log('Total categories:', cCount);
  
  process.exit(0);
}

run().catch(console.error);
