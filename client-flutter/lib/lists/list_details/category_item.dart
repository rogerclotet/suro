import 'package:flutter/material.dart';

import '../../models/list_item.dart';

class CategoryItem extends StatelessWidget {
  final ListItem item;
  final void Function(int id) onDelete;
  final void Function(int id, bool newValue) onChange;

  const CategoryItem({
    required this.item,
    required this.onDelete,
    required this.onChange,
    super.key,
  });

  @override
  Widget build(BuildContext context) {
    return Dismissible(
      key: Key('${item.id}'),
      onDismissed: (direction) => onDelete(item.id),
      background: Container(color: Colors.deepOrange[900]),
      child: ListTile(
        contentPadding: const EdgeInsets.only(left: 16, right: 2),
        title: Text(
          item.name,
          style: item.isComplete
              ? TextStyle(
                  decoration: TextDecoration.lineThrough,
                  color: Theme.of(context)
                      .textTheme
                      .bodyText1!
                      .color!
                      .withOpacity(0.4),
                )
              : null,
        ),
        trailing: Checkbox(
          value: item.isComplete,
          onChanged: (value) {
            onChange(item.id, value != false);
          },
        ),
      ),
    );
  }
}
