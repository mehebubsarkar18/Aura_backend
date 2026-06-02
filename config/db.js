const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const isProduction = process.env.NODE_ENV === 'production';
    const connUri = process.env.MONGO_URI;
    
    if (!connUri) {
      if (isProduction) {
        throw new Error('MONGO_URI is missing in production environment variables!');
      }
      console.log('Connecting to local MongoDB (Development)...');
    }

    const finalUri = connUri || 'mongodb://127.0.0.1:27017/aurafit';
    console.log(`Connection target: ${finalUri.split('@').pop()}`); // Log only host for security
    
    const conn = await mongoose.connect(finalUri);
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    console.log('Ensure MongoDB is installed and running locally, or verify your MONGO_URI.');
    process.exit(1);
  }
};

module.exports = connectDB;
