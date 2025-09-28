const fs = require('fs');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config({ path: '../.env' });

const pomosPath = './pomos (1).json';
const usersPath = './users.json';
const pomoCategoryPath = './pomoCategory.json';

const outputTimoriasPath = './timorias_transformed.json';

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection failed', err);
    process.exit(1);
  }
};

// Timoria Schema
const timoriaSchema = new mongoose.Schema({
  subject: { type: String, required: true },
  topic: { type: String, required: true },
  tag: { type: String },
  task: { type: String },
  duration: { type: Number, required: true },
  status: {
    type: String,
    enum: ['planned', 'ongoing', 'done'],
    default: 'done'
  },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  finishedAt: { type: Date }
});

const Timoria = mongoose.model('Timoria', timoriaSchema);

// User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['regular', 'paid', 'admin'],
    default: 'regular',
  },
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model('User', userSchema);

// Function to process users
const processUsers = async (users) => {
  const userMap = {};

  for (const user of users) {
    const { userid, username, email, password, createdat } = user;

    if (!email || !username || !password) {
      console.warn(`User data is missing essential fields: ${JSON.stringify(user)}`);
      continue;
    }

    let existingUser = await User.findOne({ username });

    if (!existingUser) {
      const createdAtDate = createdat ? new Date(createdat.replace(' ', 'T')) : new Date();
      // Handle $2y$ to $2b$ conversion for bcrypt compatibility in Node.js
      let updatedPassword = password;
      if (password.startsWith("$2y$")) {
        updatedPassword = "$2b$" + password.slice(4);
      }
      const newUser = new User({
        email,
        username,
        password: updatedPassword, // Already bcrypt hashed in the old DB, do not hash again
        role: 'regular',
        createdAt: createdAtDate,
      });

      try {
        existingUser = await newUser.save();
        console.log(`Created user: ${username} with ID ${existingUser._id}`);
      } catch (err) {
        console.error(`Error creating user ${username}:`, err.message);
        continue;
      }
    } else {
      console.log(`User ${username} already exists with ID ${existingUser._id}`);
    }

    userMap[userid] = existingUser._id;
  }

  return userMap;
};

// Extraction Logic for Categories
const extractCategories = (jsonData) => {
  const tableEntry = jsonData.find(entry => entry.type === "table" && entry.name === "pomoCategory");
  const categories = tableEntry && tableEntry.data ? tableEntry.data : [];

  const categoryMap = {};
  categories.forEach(category => {
    categoryMap[category.id] = category.name;
  });

  return categoryMap;
};


// Function to process pomos

// Function to process pomos
const processPomos = async (pomos, userMap, categoryMap) => {
  const timorias = await Promise.all(
    pomos.map(async (pomo) => {
      const { user_id, topic, category_id, duration, started_at, date } = pomo;

      if (!user_id || !userMap[user_id]) {
        console.warn(`Skipping pomo with missing or unmatched user_id: ${JSON.stringify(pomo)}`);
        return null;
      }

      const startedAt = new Date(started_at.replace(' ', 'T'));
      const finishedAt = new Date(date.replace(' ', 'T'));
      const durationNum = isNaN(parseFloat(duration)) ? 0 : parseFloat(duration);

      // Resolve subject using category_id
      const subject = categoryMap[category_id] || `Unknown (${category_id})`;

      const newTimoria = new Timoria({
        subject,
        topic,
        tag: '',
        task: '',
        duration: durationNum,
        status: durationNum > 0 ? 'done' : 'planned',
        user: userMap[user_id],
        createdAt: startedAt,
        finishedAt: finishedAt,
      });

      try {
        const savedTimoria = await newTimoria.save();
        console.log(`Saved Timoria with ID ${savedTimoria._id}`);
        return savedTimoria;
      } catch (err) {
        console.error(`Error saving Timoria for pomo ${pomo.pomo_id}:`, err.message);
        return null;
      }
    })
  );

  return timorias.filter(Boolean);
};



// Function to process pomos
// const processPomos = async (pomos, userMap) => {
//   const timorias = await Promise.all(
//     pomos.map(async (pomo) => {
//       const { user_id, topic, category_id, duration, started_at, date } = pomo;

//       if (!user_id || !userMap[user_id]) {
//         console.warn(`Skipping pomo with missing or unmatched user_id: ${JSON.stringify(pomo)}`);
//         return null;
//       }

//       const startedAt = new Date(started_at.replace(' ', 'T'));
//       const finishedAt = new Date(date.replace(' ', 'T'));
//       const durationNum = isNaN(parseFloat(duration)) ? 0 : parseFloat(duration);

//       const newTimoria = new Timoria({
//         subject: category_id,
//         topic,
//         tag: '',
//         task: '',
//         duration: durationNum,
//         status: durationNum > 0 ? 'done' : 'planned',
//         user: userMap[user_id],
//         createdAt: startedAt,
//         finishedAt: finishedAt,
//       });

//       try {
//         const savedTimoria = await newTimoria.save();
//         console.log(`Saved Timoria with ID ${savedTimoria._id}`);
//         return savedTimoria;
//       } catch (err) {
//         console.error(`Error saving Timoria for pomo ${pomo.pomo_id}:`, err.message);
//         return null;
//       }
//     })
//   );

//   return timorias.filter(Boolean); // Exclude null entries
// };


// Extraction Logic
const extractDataArray = (jsonData, tableName) => {
  const tableEntry = jsonData.find(entry => entry.type === "table" && entry.name === tableName);
  return tableEntry && tableEntry.data ? tableEntry.data : [];
};


const main = async () => {
  try {
    await connectDB();

    const usersDataRaw = fs.readFileSync(usersPath, 'utf8');
    const pomosDataRaw = fs.readFileSync(pomosPath, 'utf8');
    const categoryDataRaw = fs.readFileSync(pomoCategoryPath, 'utf8');

    const usersData = JSON.parse(usersDataRaw);
    const pomosData = JSON.parse(pomosDataRaw);
    const categoryData = JSON.parse(categoryDataRaw);

    // Extract data arrays
    const users = extractDataArray(usersData, "users");
    const pomos = extractDataArray(pomosData, "pomos");
    const categoryMap = extractCategories(categoryData);

    console.log('Processing users...');
    const userMap = await processUsers(users);

    console.log('Processing pomos...');
    const timorias = await processPomos(pomos, userMap, categoryMap);

    // Write the transformed timorias to file
    fs.writeFileSync(outputTimoriasPath, JSON.stringify(timorias, null, 2));
    console.log(`Successfully written ${timorias.length} timorias to file.`);

    mongoose.connection.close();
  } catch (err) {
    console.error('Error during migration:', err);
    //mongoose.connection.close();
  }
};

main();



// Main function
// const main = async () => {
//   try {
//     await connectDB();

//     const usersDataRaw = fs.readFileSync(usersPath, 'utf8');
//     const pomosDataRaw = fs.readFileSync(pomosPath, 'utf8');

//     const usersData = JSON.parse(usersDataRaw);
//     const pomosData = JSON.parse(pomosDataRaw);

//     // Extract data arrays
//     const users = extractDataArray(usersData, "users");
//     const pomos = extractDataArray(pomosData, "pomos");

//     console.log('Processing users...');
//     const userMap = await processUsers(users);

//     console.log('Processing pomos...');
//     const timorias = await processPomos(pomos, userMap);

//     // Write the transformed timorias to file
//     fs.writeFileSync(outputTimoriasPath, JSON.stringify(timorias, null, 2));
//     console.log(`Successfully written ${timorias.length} timorias to file.`);

//     mongoose.connection.close();
//   } catch (err) {
//     console.error('Error during migration:', err);
//     mongoose.connection.close();
//   }
// };

main();

