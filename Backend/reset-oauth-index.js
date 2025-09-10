const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function resetOAuthIndex() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('users');

    // List all current indexes
    console.log('📋 Current indexes:');
    const indexes = await collection.listIndexes().toArray();
    indexes.forEach(index => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
      if (index.partialFilterExpression) {
        console.log(`    Partial filter: ${JSON.stringify(index.partialFilterExpression)}`);
      }
    });

    // Drop ALL OAuth-related indexes
    const oauthIndexes = indexes.filter(index => 
      index.name.includes('oauth') || 
      JSON.stringify(index.key).includes('oauth')
    );

    for (const index of oauthIndexes) {
      try {
        await collection.dropIndex(index.name);
        console.log(`✅ Dropped index: ${index.name}`);
      } catch (error) {
        console.log(`⚠️  Could not drop ${index.name}:`, error.message);
      }
    }

    // Remove null/undefined OAuth fields from all users
    console.log('🧹 Cleaning up OAuth fields...');
    const cleanupResult = await collection.updateMany(
      {},
      {
        $unset: {
          oauthProvider: "",
          oauthId: ""
        }
      }
    );
    console.log(`✅ Cleaned OAuth fields from ${cleanupResult.modifiedCount} users`);

    // Create the new index with proper partial filter
    console.log('🔧 Creating new OAuth index...');
    await collection.createIndex(
      { oauthProvider: 1, oauthId: 1 },
      { 
        unique: true,
        partialFilterExpression: {
          oauthProvider: { $exists: true },
          oauthId: { $exists: true }
        },
        name: 'oauth_compound_unique'
      }
    );
    console.log('✅ Created new OAuth compound index');

    // List indexes again to verify
    console.log('📋 Final indexes:');
    const finalIndexes = await collection.listIndexes().toArray();
    finalIndexes.forEach(index => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
      if (index.partialFilterExpression) {
        console.log(`    Partial filter: ${JSON.stringify(index.partialFilterExpression)}`);
      }
    });

    await mongoose.disconnect();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error resetting OAuth index:', error);
    process.exit(1);
  }
}

resetOAuthIndex();
