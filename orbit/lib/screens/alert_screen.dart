import 'package:flutter/material.dart';
import 'package:orbit/colors.dart';
import 'package:orbit/screens/verification_screen.dart';
import 'package:mongo_dart/mongo_dart.dart' as mongo;
import '../mongodb.dart'; // Import your MongoDB file
import '../responsive.dart';

class AlertScreen extends StatefulWidget {
  const AlertScreen({super.key});

  @override
  State<AlertScreen> createState() => _AlertScreenState();
}

class _AlertScreenState extends State<AlertScreen> {
  List<dynamic> alerts = [];

  @override
  void initState() {
    super.initState();
    fetchAlerts();
  }

  // Fetch alerts from MongoDB where Verification is 'unverified'
  Future<void> fetchAlerts() async {
    var data = await MongoDatabase.getUnverifiedAlerts(); // Fetch unverified alerts
    setState(() {
      alerts = data;
    });
  }

  // Delete alert both in UI and in MongoDB
  Future<void> deleteAlert(String id, int index) async {
    await MongoDatabase.deleteAlert(id); // Delete from MongoDB
    setState(() {
      alerts.removeAt(index); // Remove the alert from the list in the UI
    });
    // Optionally, show a snackbar or some confirmation
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Alert deleted')),
    );
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
              Navigator.pop(context);
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
        body: Padding(
          padding: const EdgeInsets.only(left: 20, right: 20, top: 35),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Alerts',
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                  color: Colors.black,
                ),
              ),
              SizedBox(height: 8),
              Text.rich(
                TextSpan(
                  text: 'You have ',
                  style: TextStyle(fontSize: 16),
                  children: <TextSpan>[
                    TextSpan(
                      text: '${alerts.length} new alerts',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Colors.blueAccent,
                      ),
                    ),
                  ],
                ),
              ),
              SizedBox(height: getheight(context) * 0.03),

              // List of alerts with Dismissible for swipe-to-delete
              Expanded(
                child: ListView.builder(
                  itemCount: alerts.length,
                  itemBuilder: (context, index) {
                    var alert = alerts[index];
                    return Dismissible(
                      key: Key(alert['_id'].toHexString()), // Convert ObjectId to String for key
                      direction: DismissDirection.endToStart,
                      background: Container(
                        color: Colors.red,
                        alignment: Alignment.centerRight,
                        padding: EdgeInsets.symmetric(horizontal: 20),
                        child: Icon(Icons.delete, color: Colors.white),
                      ),
                      onDismissed: (direction) {
                        deleteAlert(alert['_id'].toHexString(), index); // Convert ObjectId to String for delete
                      },
                      child: GestureDetector(
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => VerificationScreen(alert: alert), // Pass the alert data
                            ),
                          );
                        },
                        child: Card(
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                          elevation: 4,
                          child: ListTile(
                            contentPadding: EdgeInsets.only(left: 25, top: 15, bottom: 15, right: 25),
                            title: Text(
                              '${alert['Type'].toUpperCase()} Detected',
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
                                  '#id${alert['SuspiciousActivityId']}',
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
                                      '${alert['TimeStamp']}',
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
                                          'Cam ${alert['CameraNo']}',
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
                    );
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
