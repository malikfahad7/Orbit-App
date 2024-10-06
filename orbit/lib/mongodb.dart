import 'dart:developer';
import 'package:mongo_dart/mongo_dart.dart';
import 'package:bcrypt/bcrypt.dart'; // Add bcrypt

import 'constants.dart'; // Ensure constants contain MONGO_URL and COLLECTION_NAME

class MongoDatabase {
  static connect() async {
    var db = await Db.create(MONGO_URL);
    await db.open();
    return db;
  }

  // Fetch the user by email and compare the password using bcrypt
  static Future<Map<String, dynamic>?> getUser(String email, String password) async {
    try {
      var db = await connect();
      var collection = db.collection(COLLECTION_NAME);

      // Fetch the user by email
      var user = await collection.findOne({
        'email': email,
        'role': 'Floor Manager' // Check the role of Floor Manager
      });

      if (user != null) {
        // Compare hashed password using bcrypt
        bool passwordMatch = BCrypt.checkpw(password, user['password']);

        if (passwordMatch) {
          await db.close();
          return user; // Return user details if password matches
        }
      }
      await db.close();
      return null; // Return null if password doesn't match or user not found
    } catch (e) {
      log('Error in getUser: $e');
      return null;
    }
  }
}
