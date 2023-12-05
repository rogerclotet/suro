import 'package:familia/auth/auth.dart';
import 'package:familia/auth/login_form.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  static const routeName = 'login';

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  bool loading = false;

  Future<void> handleLogin(
    ScaffoldMessengerState messenger,
    Auth auth,
    String email,
    String password,
  ) async {
    setState(() {
      loading = true;
    });

    try {
      auth.login(email, password).timeout(const Duration(seconds: 5));
    } catch (e) {
      messenger.showSnackBar(
        SnackBar(
          backgroundColor: Colors.deepOrange,
          content: Text(
            'Error iniciant sessió: $e',
            style: const TextStyle(color: Colors.white),
          ),
        ),
      );
    } finally {
      setState(() {
        loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Familia'),
      ),
      body: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 8),
        child: Center(
          child: loading
              ? const CircularProgressIndicator()
              : LoginForm(
                  onLogin: (email, password) => handleLogin(
                    ScaffoldMessenger.of(context),
                    Provider.of<Auth>(context, listen: false),
                    email,
                    password,
                  ),
                ),
        ),
      ),
    );
  }
}
