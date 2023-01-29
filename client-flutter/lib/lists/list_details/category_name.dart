import 'package:flutter/material.dart';

class CategoryName extends StatelessWidget {
  final String name;
  final bool expanded;
  final void Function() onToggleExpand;

  const CategoryName({
    required this.name,
    required this.expanded,
    required this.onToggleExpand,
    super.key,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      title: Text(
        name == '' ? 'Sense categoria' : name,
        style: Theme.of(context).textTheme.titleSmall,
      ),
      dense: true,
      tileColor: Theme.of(context).colorScheme.surfaceVariant,
      trailing: IconButton(
        icon: Icon(expanded ? Icons.expand_less : Icons.expand_more),
        onPressed: onToggleExpand,
      ),
    );
  }
}
