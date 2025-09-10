const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function fixOAuthIndex() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('users');

    // Drop the problematic index
    try {
      await collection.dropIndex('oauthProvider_1_oauthId_1');
      console.log('✅ Dropped old oauthProvider_1_oauthId_1 index');
    } catch (error) {
      console.log('ℹ️  Index may not exist:', error.message);
    }

    // Create the new partial index - only for documents that have both fields
    await collection.createIndex(
      { oauthProvider: 1, oauthId: 1 },
      {
        unique: true,
        partialFilterExpression: {
          oauthProvider: { $exists: true },
          oauthId: { $exists: true }
        },
        name: 'oauthProvider_1_oauthId_1'
      }
    );
    console.log('✅ Created new partial index for OAuth fields');

    // List all indexes to verify
    const indexes = await collection.listIndexes().toArray();
    console.log('📋 Current indexes:');
    indexes.forEach(index => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
    });

    await mongoose.disconnect();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error fixing OAuth index:', error);
    process.exit(1);
  }
}

fixOAuthIndex();
