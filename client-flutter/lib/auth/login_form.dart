import 'package:email_validator/email_validator.dart';
import 'package:flutter/material.dart';

class LoginForm extends StatefulWidget {
  final void Function(String email, String password) onLogin;

  const LoginForm({
    required this.onLogin,
    super.key,
  });

  @override
  State<LoginForm> createState() => _LoginFormState();
}

class _LoginFormState extends State<LoginForm> {
  final _formKey = GlobalKey<FormState>();

  final emailController = TextEditingController();
  final passwordController = TextEditingController();

  @override
  Widget build(BuildContext context) {
    return Form(
      key: _formKey,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            'Iniciar sessió',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 16),
          AutofillGroup(
            child: Column(
              children: [
                TextFormField(
                  controller: emailController,
                  autofocus: true,
                  autofillHints: const [AutofillHints.email],
                  decoration: const InputDecoration(
                    border: OutlineInputBorder(),
                    labelText: 'Email',
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Entra el teu email, sisplau';
                    }
                    value = value.trim();
                    if (!EmailValidator.validate(value)) {
                      return 'Introdueix un email vàlid, sisplau';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 8),
                TextFormField(
                  controller: passwordController,
                  obscureText: true,
                  autofillHints: const [AutofillHints.password],
                  decoration: const InputDecoration(
                    border: OutlineInputBorder(),
                    labelText: 'Contrasenya',
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Entra la contrasenya, sisplau';
                    }
                    return null;
                  },
                  onFieldSubmitted: (value) {
                    if (_formKey.currentState!.validate()) {
                      widget.onLogin(
                        emailController.text,
                        passwordController.text,
                      );
                    }
                  },
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),
          ElevatedButton(
            onPressed: () {
              if (_formKey.currentState!.validate()) {
                widget.onLogin(
                  emailController.text.trim(),
                  passwordController.text,
                );
              }
            },
            child: const Text('Iniciar sessió'),
          ),
        ],
      ),
    );
  }
}
