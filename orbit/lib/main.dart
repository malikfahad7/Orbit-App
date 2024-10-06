import 'package:flutter/material.dart';
import 'package:orbit/mongodb.dart';
import 'package:orbit/screens/login_screen.dart';
import 'package:mongo_dart/mongo_dart.dart' as mongo;

void main()async {
  WidgetsFlutterBinding.ensureInitialized();
  await MongoDatabase.connect();
  runApp(const MyApp());

}
class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      theme: ThemeData(brightness: Brightness.light),
      home: login_screen(),
    );
  }
}
