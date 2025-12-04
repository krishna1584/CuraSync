#!/usr/bin/env node

/**
 * Test script to validate the Medical Report Extraction System
 * Run this before deploying to ensure everything works
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { runSystemCheck } = require('./src/utils/systemCheck');

// Connect to database first
async function main() {
  try {
    console.log('Connecting to MongoDB...\n');
    
    await mongoose.connect(process.env.MONGODB_URI);
    
    console.log('MongoDB connected!\n');
    
    // Load models to ensure they're registered
    require('./src/models/Report');
    
    // Run system check
    const success = await runSystemCheck();
    
    // Cleanup
    await mongoose.connection.close();
    
    // Exit with appropriate code
    process.exit(success ? 0 : 1);
    
  } catch (error) {
    console.error('Failed to run system check:', error);
    process.exit(1);
  }
}

main();
