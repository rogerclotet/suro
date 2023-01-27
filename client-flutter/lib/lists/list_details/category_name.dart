import 'package:flutter/material.dart';

class CategoryName extends StatelessWidget {
  final String name;

  const CategoryName({required this.name, super.key});

  @override
  Widget build(BuildContext context) {
    return ListTile(
      title: Text(
        name == '' ? 'Sense categoria' : name,
        style: Theme.of(context).textTheme.titleSmall,
      ),
      dense: true,
      tileColor: Theme.of(context).colorScheme.surface,
    );
  }
}
