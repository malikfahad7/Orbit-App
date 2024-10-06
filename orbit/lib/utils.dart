import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:orbit/colors.dart';

toastMessage(String m) {
  Fluttertoast.showToast(
      msg: m,
      timeInSecForIosWeb: 1,
      toastLength: Toast.LENGTH_LONG,
      gravity: ToastGravity.BOTTOM,
      backgroundColor: AppColors.primaryColor,
      textColor: Colors.white,
      fontSize: 16.0);
}
