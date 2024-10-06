import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:orbit/responsive.dart';

import '../colors.dart';
import 'home_screen.dart';

class VerifyOtp extends StatefulWidget {
  const VerifyOtp({super.key});

  @override
  State<VerifyOtp> createState() => _VerifyOtpState();
}

class _VerifyOtpState extends State<VerifyOtp> {
  bool loading = false;
  bool isChecked = false;
  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Scaffold(
      backgroundColor: Colors.white,
        body: SingleChildScrollView(
          child: Container(
            height: getheight(context),
            width: getwidth(context),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  "Enter Verification Code",
                  style: TextStyle(
                      fontWeight: FontWeight.bold,
                      color: Colors.black87,
                      fontSize: 26),
                ),
                SizedBox(
                  height: getheight(context) * 0.02,
                ),
                Text(
                  textAlign: TextAlign.center,
                  "We have sent 6 digits code to your email"
                      "\naddress",
                  style: TextStyle(
                      fontWeight: FontWeight.w400,
                      color: Colors.black87,
                      fontSize: 16),
                ),
                SizedBox(
                  height: getheight(context) * 0.2,
                ),
                InkWell(
                  onTap: (){

                    showDialog(
                      context: context,
                      builder: (BuildContext context) {
                        bool isChecked = false; // Local state for checkbox inside the dialog

                        return StatefulBuilder(
                          builder: (BuildContext context, StateSetter setState) {
                            return AlertDialog(
                              backgroundColor: Colors.white,
                              content: Container(
                                height: getheight(context) * 0.55,
                                width: getwidth(context) * 0.8,
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.center,
                                  children: [
                                    Padding(
                                      padding: const EdgeInsets.only(top: 20),
                                      child: Text(
                                        "Read Carefully",
                                        style: TextStyle(fontWeight: FontWeight.bold,
                                        fontSize: 20),
                                      ),
                                    ),
                                    SizedBox(height: getheight(context) * 0.05), // Adds some space between title and points
                                    Row(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Padding(
                                          padding: const EdgeInsets.only(top: 5.0),
                                          child: Icon(Icons.circle, size: 10, color: AppColors.primaryColor),
                                        ),
                                        SizedBox(width: getwidth(context) * 0.02),
                                        Expanded(
                                          child: Text(
                                            'Read the first bullet point carefully',
                                            style: TextStyle(fontSize: 14),
                                          ),
                                        ),
                                      ],
                                    ),
                                    SizedBox(height: getheight(context) * 0.02),
                                    Row(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Padding(
                                          padding: const EdgeInsets.only(top: 5.0),
                                          child: Icon(Icons.circle, size: 10, color: AppColors.primaryColor),
                                        ),
                                        SizedBox(width: getwidth(context) * 0.02),
                                        Expanded(
                                          child: Text(
                                            'Read the second bullet point carefully',
                                            style: TextStyle(fontSize: 14),
                                          ),
                                        ),
                                      ],
                                    ),
                                    SizedBox(height: getheight(context) * 0.02),
                                    Row(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Padding(
                                          padding: const EdgeInsets.only(top: 5.0),
                                          child: Icon(Icons.circle, size: 10, color: AppColors.primaryColor),
                                        ),
                                        SizedBox(width: getwidth(context) * 0.02),
                                        Expanded(
                                          child: Text(
                                            'Read the third bullet point carefully',
                                            style: TextStyle(fontSize: 14),
                                          ),
                                        ),
                                      ],
                                    ),
                                    SizedBox(height: getheight(context) * 0.02),
                                    Row(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Padding(
                                          padding: const EdgeInsets.only(top: 5.0),
                                          child: Icon(Icons.circle, size: 10, color: AppColors.primaryColor),
                                        ),
                                        SizedBox(width: getwidth(context) * 0.02),
                                        Expanded(
                                          child: Text(
                                            'Read the fourth bullet point carefully',
                                            style: TextStyle(fontSize: 14),
                                          ),
                                        ),
                                      ],
                                    ),
                                    SizedBox(height: getheight(context) * 0.05),
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.start,

                                      children: [
                                        Padding(
                                          padding: const EdgeInsets.only(top: 0),
                                          child: Checkbox(
                                            activeColor: AppColors.primaryColor,
                                            value: isChecked,
                                            onChanged: (bool? value) {
                                              setState(() {
                                                isChecked = value ?? false; // Update the checkbox state inside dialog
                                              });
                                            },
                                          ),
                                        ),
                                        SizedBox(width: getwidth(context) * 0.02),
                                        Expanded(
                                          child: Text(
                                            'I read all the instructions carefully',
                                            style: TextStyle(fontSize: 14),
                                          ),
                                        ),
                                      ],
                                    ),
                                    SizedBox(height: getheight(context)*0.1,),
                                    InkWell(
                                      onTap: (){
                                         isChecked?  Navigator.pushReplacement(
                                             context,
                                             MaterialPageRoute(
                                                 builder: (context) => homeScreen())): '';
                                      },
                                      child: isChecked?Container(
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
                                              "Continue",
                                              style: TextStyle(
                                                  color: Colors.white,
                                                  fontSize: 18,
                                                  fontWeight: FontWeight.bold),
                                            )),
                                      ):
                                      Container(
                                        height: getheight(context) * 0.055,
                                        width: getwidth(context) * 0.55,
                                        decoration: BoxDecoration(
                                            color: Colors.grey,
                                            borderRadius: BorderRadius.circular(18)),
                                        child: Center(
                                            child:Text(
                                              "Continue",
                                              style: TextStyle(
                                                  color: Colors.white,
                                                  fontSize: 18,
                                                  fontWeight: FontWeight.bold),
                                            )),
                                      )
                                    )
                                  ],
                                ),
                              ),
                            );
                          },
                        );
                      },
                    );


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
                          "Continue",
                          style: TextStyle(
                              color: Colors.white,
                              fontSize: 18,
                              fontWeight: FontWeight.bold),
                        )),
                  ),
                ),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      "Don't recieve the code?",
                      style: TextStyle(
                          color: Colors.black87,
                          fontSize: 15,
                          fontWeight: FontWeight.w500),
                    ),
                    TextButton(onPressed: (){}, child:
                    Text(
                      "Resend Otp",
                      style: TextStyle(
                          color: AppColors.primaryColor,
                          fontSize: 15,
                          fontWeight: FontWeight.w500),
                    ))
                  ],
                )
              ],
            ),
          ),
        ),
      ),
    );
  }
}
