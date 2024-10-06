import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:google_nav_bar/google_nav_bar.dart';
import 'package:orbit/colors.dart';
import 'package:orbit/responsive.dart';
import 'package:orbit/screens/main_screen.dart';
import 'package:orbit/screens/profile_screen.dart';
import 'package:orbit/screens/alert_screen.dart';

class homeScreen extends StatefulWidget {
  const homeScreen({super.key});

  @override
  State<homeScreen> createState() => _homeScreenState();
}

class _homeScreenState extends State<homeScreen> {
  int _selectedIndex = 0;
  List<Widget> _pages = [
    MainScreen(),
    Center(child: Text('Stats')),
    ProfileScreen()
  ];
  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Scaffold(
            backgroundColor: Colors.white,
        appBar: AppBar(
          backgroundColor: AppColors.primaryColor,
          automaticallyImplyLeading: false,// Replace with your primary color
          toolbarHeight: MediaQuery.of(context).size.height * 0.1, // Custom height
          centerTitle: true,
          title: Image.asset(
            'assets/Logo.png', // Replace with your logo image path
            height: getwidth(context)*0.04,
          ),
          actions: [
            Stack(
              children: [
                IconButton(
                  icon: Icon(Icons.notifications,size: getheight(context)*0.04,color: Colors.white,),

                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (context) => AlertScreen()), // Navigate to AlertScreen
                    );
                  },

                ),
                Positioned(
                  right: 11,
                  top: 11,
                  child: Container(
                    padding: EdgeInsets.all(2),
                    decoration: BoxDecoration(
                      color: Colors.red,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    constraints: BoxConstraints(
                      minWidth: 16,
                      minHeight: 16,
                    ),
                    child: Text(
                      '5', // Static number of notifications for now
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 12,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                )
              ],
            ),
          ],
        ),
    body: _pages[_selectedIndex],
    bottomNavigationBar: Container(
    color: Colors.white,
    padding: EdgeInsets.symmetric(horizontal: 0, vertical: 10),
    child: GNav(
    gap: 10,
    backgroundColor: Colors.white,
    color: Colors.black,
    activeColor: Colors.white,
    tabBackgroundColor: Colors.blueAccent,
    padding: EdgeInsets.all(15),
    tabBorderRadius: 16,
    selectedIndex: _selectedIndex,
    onTabChange: (index) {
    setState(() {
    _selectedIndex = index;
    });
    },
    tabs: [
    GButton(
    icon: Icons.home,
    text: 'Home',
    iconSize: 24,
    iconColor: Colors.black,
    ),
      GButton(
        icon: Icons.auto_graph_outlined,
        text: 'Stats',
        iconSize: 24,
        iconColor: Colors.black,
      ),
    GButton(
    icon: Icons.person,
    text: 'Profile',
    iconSize: 24,
    iconColor: Colors.black,
    ),
    ],
    tabActiveBorder: Border.all(color: Colors.blue, width: 1.5),  // Optional: Add a border around active tab
    mainAxisAlignment: MainAxisAlignment.spaceEvenly,  // Distribute tabs evenly
    ),
    ),
    ));
  }
}
