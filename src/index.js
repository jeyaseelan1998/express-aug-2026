require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');
// const seedRoles = require('./utils/seed-roles');

const PORT = process.env.PORT || 3000;

async function start() {
  await connectDB();
  // await seedRoles();
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
