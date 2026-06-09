import mongoose from 'mongoose';
import { Question } from './server/src/models/Question';
import { Category } from './server/src/models/Category';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, 'server/.env') });

const checkDB = async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/samagama');
  
  const questions = await Question.find({}).lean();
  console.log(`Total questions: ${questions.length}`);
  
  const cats = await Category.find({}).lean();
  console.log(`Total categories: ${cats.length}`);
  
  if (questions.length > 0) {
    console.log('First question tags:', questions[0].tags);
  }
  
  process.exit(0);
};

checkDB().catch(console.error);
