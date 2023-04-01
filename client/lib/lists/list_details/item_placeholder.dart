import 'package:flutter/material.dart';

class ItemPlaceholder extends StatelessWidget {
  const ItemPlaceholder({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        // color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(4),
      ),
      width: MediaQuery.of(context).size.width,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Text('', style: Theme.of(context).textTheme.bodyLarge),
      ),
    );
  }
}
