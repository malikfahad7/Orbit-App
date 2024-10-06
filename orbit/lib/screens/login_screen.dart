import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:orbit/colors.dart';
import 'package:orbit/screens/home_screen.dart';
import 'package:orbit/screens/verify_otp.dart';
import '../mongodb.dart';
import '../responsive.dart';
import '../utils.dart';
import 'package:orbit/mongodb.dart'; // Import your MongoDB connection

class login_screen extends StatefulWidget {
  const login_screen({super.key});

  @override
  State<login_screen> createState() => _login_screenState();
}

class _login_screenState extends State<login_screen> {
  final _formkey = GlobalKey<FormState>();
  final emailcontroller = TextEditingController();
  final passcontroller = TextEditingController();
  bool loading = false;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Scaffold(
        backgroundColor: Colors.white,
        body: SingleChildScrollView(
          child: Container(
            height: getheight(context),
            width: getwidth(context),
            child: Form(
              key: _formkey,
              child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    Text(
                      "Login To Your Account",
                      style: TextStyle(
                          fontWeight: FontWeight.bold,
                          color: Colors.black87,
                          fontSize: 26),
                    ),
                    SizedBox(
                      height: getheight(context) * 0.02,
                    ),
                    Text(
                      "Provide email and password to continue",
                      style: TextStyle(
                          fontWeight: FontWeight.w400,
                          color: Colors.black87,
                          fontSize: 16),
                    ),
                    SizedBox(
                      height: getheight(context) * 0.05,
                    ),
                    Padding(
                      padding: EdgeInsets.only(
                          left: getwidth(context) * 0.05,
                          right: getwidth(context) * 0.05),
                      child: TextFormField(
                        validator: (value) {
                          if (value!.isEmpty) {
                            return 'Field required';
                          } else if (!value.contains('@')) {
                            return 'Invalid email format';
                          }
                          return null;
                        },
                        style: TextStyle(color: Colors.black),
                        controller: emailcontroller,
                        cursorColor: AppColors.primaryColor,
                        key: ValueKey('Email'),
                        decoration: InputDecoration(
                          prefixIcon: Icon(Icons.mail_outline_rounded),
                          errorStyle: TextStyle(color: Colors.red),
                          border: OutlineInputBorder(borderSide: BorderSide()),
                          label: Text(
                            "Email Address",
                            style: TextStyle(color: Colors.black87, fontSize: 16),
                          ),
                          enabledBorder: OutlineInputBorder(
                              borderSide: BorderSide(color: Colors.black87),
                              borderRadius: BorderRadius.circular(15)),
                          focusedBorder: OutlineInputBorder(
                              borderSide: BorderSide(color: Colors.black87),
                              borderRadius: BorderRadius.circular(15)),
                        ),
                      ),
                    ),
                    SizedBox(
                      height: getheight(context) * 0.02,
                    ),
                    Padding(
                      padding: EdgeInsets.only(
                          left: getwidth(context) * 0.05,
                          right: getwidth(context) * 0.05),
                      child: TextFormField(
                        validator: (value) {
                          if (value!.isEmpty) {
                            return 'Field required';
                          }
                          return null;
                        },
                        style: TextStyle(color: Colors.black),
                        controller: passcontroller,
                        cursorColor: AppColors.primaryColor,
                        obscureText: true,
                        key: ValueKey('Password'),
                        decoration: InputDecoration(
                          prefixIcon: Icon(Icons.lock_open_rounded),
                          errorStyle: TextStyle(color: Colors.red),
                          border: OutlineInputBorder(
                              borderSide: BorderSide(),
                              borderRadius: BorderRadius.circular(10)),
                          label: Text(
                            "Password",
                            style: TextStyle(color: Colors.black87),
                          ),
                          enabledBorder: OutlineInputBorder(
                              borderSide: BorderSide(color: Colors.black87),
                              borderRadius: BorderRadius.circular(15)),
                          focusedBorder: OutlineInputBorder(
                              borderSide: BorderSide(color: Colors.black87),
                              borderRadius: BorderRadius.circular(15)),
                        ),
                      ),
                    ),
                    SizedBox(
                      height: getheight(context) * 0.05,
                    ),
                    InkWell(
                      onTap: () async {
                        if (_formkey.currentState!.validate()) {
                          setState(() {
                            loading = true;
                          });

                          // Check user login details from MongoDB
                          var user = await MongoDatabase.getUser(
                            emailcontroller.text.trim(),
                            passcontroller.text.trim(),
                          );

                          if (user != null) {
                            // If user exists and role is Floor Manager
                            setState(() {
                              loading = false;
                              toastMessage("Login successful!");
                              emailcontroller.clear();
                              passcontroller.clear();
                              Navigator.pushReplacement(
                                  context,
                                  MaterialPageRoute(
                                      builder: (context) => homeScreen())); // Navigate to the next screen
                            });
                          } else {
                            setState(() {
                              loading = false;
                              toastMessage("Invalid credentials or role is not Floor Manager");
                            });
                          }
                        } else {
                          setState(() {
                            loading = false;
                          });
                        }
                      },
                      child: Container(
                        height: getheight(context) * 0.055,
                        width: getwidth(context) * 0.55,
                        decoration: BoxDecoration(
                            color: AppColors.primaryColor,
                            borderRadius: BorderRadius.circular(18)),
                        child: Center(
                            child: loading
                                ? CircularProgressIndicator(
                              color: Colors.white,
                            )
                                : Text(
                              "Verify",
                              style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold),
                            )),
                      ),
                    ),
                    SizedBox(
                      height: getheight(context) * 0.01,
                    ),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          "Don't have an account?",
                          style: TextStyle(color: Colors.white),
                        ),
                        TextButton(
                            onPressed: () {},
                            child: Text(
                              "SignUp",
                              style: TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.bold),
                            ))
                      ],
                    )
                  ]),
            ),
          ),
        ),
      ),
    );
  }
}
