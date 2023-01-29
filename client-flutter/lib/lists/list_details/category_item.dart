import 'package:flutter/material.dart';

import '../../models/list_item.dart';

class CategoryItem extends StatelessWidget {
  final ListItem item;
  final void Function(int id) onDelete;
  final void Function(int id, bool newValue) onChangeIsComplete;
  final bool canBeCompleted;
  final bool isEditing;

  const CategoryItem({
    required this.item,
    required this.onDelete,
    required this.onChangeIsComplete,
    required this.canBeCompleted,
    required this.isEditing,
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
                      .bodyLarge!
                      .color!
                      .withOpacity(0.4),
                )
              : null,
        ),
        trailing: canBeCompleted
            ? Checkbox(
                value: item.isComplete,
                onChanged: (value) {
                  onChangeIsComplete(item.id, value != false);
                },
              )
            : const SizedBox(
                height: 0,
                width: 0,
              ),
      ),
    );
  }
}
