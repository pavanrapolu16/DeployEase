const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function fixOAuthData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('users');

    // Find users with null or undefined OAuth fields
    const usersWithNullOAuth = await collection.find({
      $or: [
        { oauthProvider: null },
        { oauthId: null },
        { oauthProvider: { $exists: false } },
        { oauthId: { $exists: false } }
      ]
    }).toArray();

    console.log(`Found ${usersWithNullOAuth.length} users with null OAuth fields`);

    // Remove the null OAuth fields from regular users
    const result = await collection.updateMany(
      {
        $or: [
          { oauthProvider: null },
          { oauthId: null }
        ]
      },
      {
        $unset: {
          oauthProvider: "",
          oauthId: ""
        }
      }
    );

    console.log(`✅ Updated ${result.modifiedCount} users - removed null OAuth fields`);

    // Verify the fix
    const remainingNullUsers = await collection.countDocuments({
      $or: [
        { oauthProvider: null },
        { oauthId: null }
      ]
    });

    console.log(`Remaining users with null OAuth fields: ${remainingNullUsers}`);

    if (remainingNullUsers > 0) {
      const remainingUsers = await collection.find({
        $or: [
          { oauthProvider: null },
          { oauthId: null }
        ]
      }).toArray();

      console.log('Users still with null OAuth fields:');
      remainingUsers.forEach(user => {
        console.log(`  - ${user.email}: oauthProvider=${user.oauthProvider}, oauthId=${user.oauthId}`);
      });
    }

    await mongoose.disconnect();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error fixing OAuth data:', error);
    process.exit(1);
  }
}

fixOAuthData();
