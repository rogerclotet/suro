import 'package:flutter/material.dart';

class LoadingScreen extends StatelessWidget {
  const LoadingScreen({super.key});

  static const routeName = 'loading';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Família'),
      ),
      body: const Center(
        child: CircularProgressIndicator(),
      ),
    );
  }
}
