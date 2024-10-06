import 'package:flutter/material.dart';
import 'package:orbit/colors.dart';
import 'package:orbit/screens/verification_screen.dart';

import '../responsive.dart';

class AlertScreen extends StatefulWidget {
  const AlertScreen({super.key});

  @override
  State<AlertScreen> createState() => _AlertScreenState();
}

class _AlertScreenState extends State<AlertScreen> {
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
        body: Padding(
          padding: const EdgeInsets.only(left: 20,right: 20,top: 35),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Alerts title
              Text(
                'Alerts',
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                  color: Colors.black,
                ),
              ),
              SizedBox(height: 8),
              // Subtitle with the number of new alerts
              Text.rich(
                TextSpan(
                  text: 'You have ',
                  style: TextStyle(fontSize: 16),
                  children: <TextSpan>[
                    TextSpan(
                      text: '2 new alerts',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Colors.blueAccent,
                      ),
                    ),
                  ],
                ),
              ),
              SizedBox(height: getheight(context)*0.03),

              // First Alert Card - Fight Detected
              InkWell(
                onTap: (){
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (context) => VerificationScreen()), // Navigate to AlertScreen
                  );
                },
                child: Card(
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                  elevation: 4,
                  child: ListTile(
                    contentPadding: EdgeInsets.only(left: 25,top: 15,bottom: 15,right: 25),
                    title: Text(
                      'Knife Detected',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    subtitle: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        SizedBox(height: 4),
                        Text(
                          '#id123981276',
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.grey,
                          ),
                        ),
                        SizedBox(height: 4),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              'Just Now',
                              style: TextStyle(
                                fontSize: 14,
                                color: Colors.grey,
                              ),
                            ),
                            Row(
                              children: [
                                Icon(Icons.camera_alt, color: Colors.blueAccent, size: 20),
                                SizedBox(width: 4),
                                Text(
                                  'Cam 2',
                                  style: TextStyle(
                                    fontSize: 14,
                                    color: Colors.blueAccent,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ),

              SizedBox(height: getheight(context)*0.01),

              // Second Alert Card - Gun Detected
              Card(
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10),
                ),
                elevation: 4,
                child: ListTile(
                  contentPadding: EdgeInsets.only(left: 25,top: 15,bottom: 15,right: 25),
                  title: Text(
                    'Gun Detected',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  subtitle: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      SizedBox(height: 4),
                      Text(
                        '#id123486299',
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.grey,
                        ),
                      ),
                      SizedBox(height: 4),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            '5 min ago',
                            style: TextStyle(
                              fontSize: 14,
                              color: Colors.grey,
                            ),
                          ),
                          Row(
                            children: [
                              Icon(Icons.camera_alt, color: Colors.blueAccent, size: 20),
                              SizedBox(width: 4),
                              Text(
                                'Cam 1',
                                style: TextStyle(
                                  fontSize: 14,
                                  color: Colors.blueAccent,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
