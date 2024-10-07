import 'package:flutter/material.dart';
import 'package:orbit/colors.dart';
import '../mongodb.dart'; // MongoDB helper file

class MainScreen extends StatefulWidget {
  const MainScreen({super.key});

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  List<Map<String, dynamic>> verifiedAlerts = []; // To hold verified/completed alerts
  bool isLoading = true; // To show loading state

  @override
  void initState() {
    super.initState();
    fetchVerifiedAlerts();
  }

  // Fetch verified and completed alerts from MongoDB
  Future<void> fetchVerifiedAlerts() async {
    var alerts = await MongoDatabase.getVerifiedAndCompletedAlerts(); // Fetch alerts
    setState(() {
      verifiedAlerts = alerts; // Update the state with fetched alerts
      isLoading = false; // Stop loading when data is fetched
    });
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Scaffold(
        backgroundColor: Colors.white,

        body: isLoading
            ? Center(child: CircularProgressIndicator(color: AppColors.primaryColor,)) // Show loading indicator
            : verifiedAlerts.isEmpty
            ? Center(child: Text('No verified or completed alerts found.')) // Show message if no alerts
            : ListView.builder(
          itemCount: verifiedAlerts.length,
          itemBuilder: (context, index) {
            var alert = verifiedAlerts[index];
            String status = alert['Verification']; // Get verification status

            // Color coding based on status
            Color cardColor;
            if (status == 'verified') {
              cardColor = Colors.green.shade300; // Verified status
            } else if (status == 'completed') {
              cardColor = Colors.blue.shade300; // Completed status
            } else {
              cardColor = Colors.grey.shade300; // Default fallback
            }

            return Card(
              color: cardColor,
              margin: EdgeInsets.symmetric(vertical: 10, horizontal: 15),
              child: ListTile(

                title: Text(
                  '${alert['Type']} Detected',
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
                subtitle: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Floor: ${alert['FloorNo']}'),
                    Text('Camera: ${alert['CameraNo']}'),
                    Text('Timestamp: ${alert['TimeStamp']}'),
                  ],
                ),
                trailing: Icon(Icons.arrow_forward_ios),
                onTap: () {
                  // Action when an alert is tapped (Optional: Navigate to detail screen)
                },
              ),
            );
          },
        ),
      ),
    );
  }
}
