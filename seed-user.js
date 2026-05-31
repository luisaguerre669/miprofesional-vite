// Seed script to create test user in MongoDB
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User');

async function seedUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/miprofesional');
    console.log('Connected to MongoDB');

    // Check if test user already exists
    const existingUser = await User.findOne({ email: 'test@demo.com' });
    if (existingUser) {
      console.log('Test user already exists');
      await mongoose.disconnect();
      return;
    }

    // Create test user
    const testUser = new User({
      name: 'Test User',
      email: 'test@demo.com',
      phone: '+5491123456789',
      password: '123456', // Will be hashed by pre-save middleware
      location: 'Buenos Aires, Argentina',
      coordinates: {
        type: 'Point',
        coordinates: [-58.3816, -34.6037] // Buenos Aires coordinates
      },
      isVerified: true,
      isActive: true
    });

    await testUser.save();
    console.log('✅ Test user created successfully');
    console.log('Email: test@demo.com');
    console.log('Password: 123456');

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');

  } catch (error) {
    console.error('Error seeding user:', error);
    process.exit(1);
  }
}

seedUser();
