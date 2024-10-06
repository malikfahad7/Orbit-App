import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:orbit/colors.dart';
import 'package:orbit/responsive.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Scaffold(
        backgroundColor: Colors.white,
        body: Padding(
          padding: const EdgeInsets.only(left: 20, right: 20, top: 50),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              // Circle Avatar for the profile picture
              CircleAvatar(
                radius: getheight(context)*0.08,  // Adjust the radius as needed
                backgroundImage: AssetImage('assets/dummy.jpg'), // Replace with your image path
                backgroundColor: Colors.grey[200],
              ),
              SizedBox(height: getheight(context)*0.02),  // Space between image and text

              // Name and description
              Text(
                'Fahad Malik',  // Replace with dynamic name if needed
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
              ),
              SizedBox(height: getheight(context)*0.01),
              Text(
                'Floor 2 Manager',  // You can replace this with your desired text
                style: TextStyle(
                  fontSize: 16,
                  color: Colors.grey[600],
                ),
              ),



              SizedBox(height: getheight(context)*0.04), // Vertical space

              // First ListTile: Personal Information
              Container(
                decoration: BoxDecoration(
                  color: Colors.white54,  // Change this to your desired background color
                  borderRadius: BorderRadius.circular(10),  // Optional: Add rounded corners
                ),
                child: ListTile(
                  leading: Icon(Icons.person, color: Colors.black87),
                  title: Text(
                    'Personal Information',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w500,
                      color: Colors.black87
                    ),
                  ),
                  trailing: Icon(Icons.arrow_forward_ios, color: AppColors.primaryColor,),
                  onTap: () {
                    // Navigate to personal information page or perform any action
                  },
                ),
              ),

              // Second ListTile: Logout
              Container(
                decoration: BoxDecoration(
                  color: Colors.white54,  // Change this to your desired background color
                  borderRadius: BorderRadius.circular(10),  // Optional: Add rounded corners
                ),
                child: ListTile(
                  leading: Icon(Icons.logout, color: Colors.black87),
                  title: Text(
                    'Logout',
                    style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w500,
                        color: Colors.black87
                    ),
                  ),
                  trailing: Icon(Icons.arrow_forward_ios, color: AppColors.primaryColor,),
                  onTap: () {
                    // Navigate to personal information page or perform any action
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
