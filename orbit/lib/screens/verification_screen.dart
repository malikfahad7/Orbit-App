import 'dart:math';
import 'package:flutter/material.dart';
import '../UserData.dart';
import '../colors.dart';
import '../responsive.dart';
import '../mongodb.dart'; // Import your MongoDB file
import 'package:mongo_dart/mongo_dart.dart' as mongo;

class VerificationScreen extends StatefulWidget {
  final Map<String, dynamic> alert; // Accept alert data

  VerificationScreen({required this.alert}); // Constructor

  @override
  _VerificationScreenState createState() => _VerificationScreenState();
}

class _VerificationScreenState extends State<VerificationScreen> {
  bool isAlertValid = false; // Switch state to control form visibility
  final _descriptionController = TextEditingController();
  final _evidenceController = TextEditingController();
  final _notesController = TextEditingController();
  String? userEmail = UserData().email;

  // Method to update alert status in the database
  Future<void> updateAlertStatus(String id, bool isValid) async {
    await MongoDatabase.updateAlertStatus(id, isValid ? 'verified' : 'unverified'); // Update verification status in MongoDB
  }

  // Method to submit the action report
  Future<void> submitActionReport() async {
    // Get userId from the logged-in user as a unique ObjectId
    var userObjectId = await MongoDatabase.getUserId(userEmail!); // Implement this method to fetch the current user's unique _id

    // Fetch the SuspiciousActivityId from the alert
    String suspiciousActivityId = widget.alert['SuspiciousActivityId'];

    // Create a random floor number
    String location = "Floor ${Random().nextInt(10) + 1}"; // Random floor between 1 and 10

    // Prepare the action report data
    var actionReportData = {
      '_id': mongo.ObjectId(), // Generate a new ObjectId for the action report
      'userId': userObjectId, // Use the user's unique ObjectId
      'SuspiciousActivityId': suspiciousActivityId, // Use SuspiciousActivityId from the alert data
      'SubmissionDate': DateTime.now(),
      'location': location,
      'IncidentDescription': _descriptionController.text,
      'Evidence': _evidenceController.text,
      'AdditionalNotes': _notesController.text,
    };

    // Insert into ActionReport collection
    await MongoDatabase.insertActionReport(actionReportData); // Insert the action report data

    // Optionally, show a success message and navigate back
    Navigator.pop(context); // Or navigate to another screen
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Scaffold(
        backgroundColor: Colors.white,
        appBar: AppBar(
          leading: IconButton(
            icon: Icon(Icons.arrow_back_ios, color: Colors.white),
            onPressed: () {
              Navigator.pop(context); // Go back to the previous screen
            },
          ),
          backgroundColor: AppColors.primaryColor,
          title: Image.asset(
            'assets/Logo.png',
            height: getwidth(context) * 0.04,
          ),
          toolbarHeight: MediaQuery.of(context).size.height * 0.1,
          centerTitle: true,
          elevation: 0,
        ),
        body: SingleChildScrollView(
          child: Padding(
            padding: const EdgeInsets.only(left: 20, right: 20, top: 35),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Verification',
                  style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                ),
                SizedBox(height: 10),
                Text(
                  'Verify the alert. Upon verification, you have to submit the action report.',
                  style: TextStyle(fontSize: 16),
                ),
                SizedBox(height: 20),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Valid Alert',
                      style: TextStyle(fontSize: 18),
                    ),
                    Switch(
                      value: isAlertValid,
                      onChanged: (value) {
                        setState(() {
                          isAlertValid = value;
                          // Convert ObjectId to String before updating
                          String alertId = widget.alert['_id'].toHexString();
                          updateAlertStatus(alertId, isAlertValid); // Update alert status
                        });
                      },
                      activeColor: AppColors.primaryColor,
                    ),
                  ],
                ),
                if (isAlertValid) ...[
                  SizedBox(height: getheight(context) * 0.03),
                  Text(
                    'Action Report',
                    style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                  ),
                  SizedBox(height: 20),
                  Text('Description'),
                  SizedBox(height: 10),
                  TextField(
                    controller: _descriptionController,
                    cursorColor: AppColors.primaryColor,
                    maxLines: 3,
                    decoration: InputDecoration(
                      focusedBorder: OutlineInputBorder(
                        borderSide: BorderSide(color: AppColors.primaryColor),
                      ),
                      border: OutlineInputBorder(),
                      hintText: 'Enter Description',
                    ),
                  ),
                  SizedBox(height: 20),
                  Text('Evidence'),
                  SizedBox(height: 10),
                  TextField(
                    controller: _evidenceController,
                    cursorColor: AppColors.primaryColor,
                    maxLines: 2,
                    decoration: InputDecoration(
                      focusedBorder: OutlineInputBorder(
                        borderSide: BorderSide(color: AppColors.primaryColor),
                      ),
                      border: OutlineInputBorder(),
                      hintText: 'Enter Evidence',
                    ),
                  ),
                  SizedBox(height: 20),
                  Text('Additional Notes'),
                  SizedBox(height: 10),
                  TextField(
                    controller: _notesController,
                    cursorColor: AppColors.primaryColor,
                    maxLines: 2,
                    decoration: InputDecoration(
                      focusedBorder: OutlineInputBorder(
                        borderSide: BorderSide(color: AppColors.primaryColor),
                      ),
                      border: OutlineInputBorder(),
                      hintText: 'Enter Additional Notes',
                    ),
                  ),
                  SizedBox(height: 30),
                  ElevatedButton(
                    onPressed: () {
                      submitActionReport(); // Call the submit method
                    },
                    child: Text('Submit', style: TextStyle(color: Colors.white)),
                    style: ElevatedButton.styleFrom(
                      padding: EdgeInsets.symmetric(horizontal: 40, vertical: 15),
                      backgroundColor: AppColors.primaryColor,
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}
