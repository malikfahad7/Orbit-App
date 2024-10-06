import 'package:flutter/material.dart';

import '../colors.dart';
import '../responsive.dart';

class VerificationScreen extends StatefulWidget {
  @override
  _VerificationScreenState createState() => _VerificationScreenState();
}

class _VerificationScreenState extends State<VerificationScreen> {
  bool isAlertValid = false; // Switch state to control form visibility

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Scaffold(
        backgroundColor: Colors.white,
        appBar: AppBar(
          leading: IconButton(
            icon: Icon(Icons.arrow_back_ios, color: Colors.white), // Replace with your desired icon
            onPressed: () {
              Navigator.pop(context); // Go back to the previous screen
            },
          ),
          backgroundColor: AppColors.primaryColor,
          title: Image.asset(
            'assets/Logo.png', // Replace with your logo image path
            height: getwidth(context)*0.04,
          ),
          toolbarHeight: MediaQuery.of(context).size.height * 0.1, // Custom height
          centerTitle: true,
          elevation: 0,
        ),
        body: SingleChildScrollView( // Prevent overflow
          child: Padding(
            padding: const EdgeInsets.only(left: 20,right: 20,top: 35),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Verification Section
                Text(
                  'Verification',
                  style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                ),
                SizedBox(height: 10),
                Text(
                  'Verify the alert, Upon verification you have to submit the action report',
                  style: TextStyle(fontSize: 16),
                ),
                SizedBox(height: 20),

                // Switch for Valid Alert
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
                        });
                      },
                      activeColor: AppColors.primaryColor,
                    ),
                  ],
                ),

                // Conditionally show the form
                if (isAlertValid) ...[
                  SizedBox(height: getheight(context)*0.03),
                  // Form Section
                  Text(
                    'Action Report',
                    style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                  ),
                  SizedBox(height: 20),

                  // Description Field
                  Text('Description'),
                  SizedBox(height: 10),
                  TextField(
                    cursorColor: AppColors.primaryColor,
                    maxLines: 3,
                    decoration: InputDecoration(

                      focusedBorder: OutlineInputBorder(
                        borderSide: BorderSide(color: AppColors.primaryColor), // Focused border color
                      ),
                      border: OutlineInputBorder(),
                      hintText: 'Enter Description',
                    ),
                  ),
                  SizedBox(height: 20),

                  // Evidence Field
                  Text('Evidence'),
                  SizedBox(height: 10),
                  TextField(
                    cursorColor: AppColors.primaryColor,
                    maxLines: 2,
                    decoration: InputDecoration(
                      focusedBorder: OutlineInputBorder(
                        borderSide: BorderSide(color: AppColors.primaryColor), // Focused border color
                      ),
                      border: OutlineInputBorder(),
                      hintText: 'Enter Evidence',
                    ),
                  ),
                  SizedBox(height: 20),

                  // Additional Notes Field
                  Text('Additional Notes'),
                  SizedBox(height: 10),
                  TextField(
                    cursorColor: AppColors.primaryColor,
                    maxLines: 2,
                    decoration: InputDecoration(
                      focusedBorder: OutlineInputBorder(
                        borderSide: BorderSide(color: AppColors.primaryColor), // Focused border color
                      ),
                      border: OutlineInputBorder(),
                      hintText: 'Enter Additional Notes',
                    ),
                  ),
                  SizedBox(height: 30),

                  // Submit Button
                  ElevatedButton(
                    onPressed: () {
                      // Handle submit action
                    },
                    child: Text('Submit', style: TextStyle(color: Colors.white),),
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
