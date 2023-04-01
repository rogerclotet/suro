import 'package:familia/lists/list_details/editable_category_item.dart';
import 'package:flutter/material.dart';

import '../../models/list_item.dart';

class CategoryItem extends StatelessWidget {
  final ListItem item;
  final void Function(int id) onDelete;
  final void Function(int id, Map<String, dynamic> toUpdate) onChange;
  final bool canBeCompleted;
  final bool isEditing;

  const CategoryItem({
    required this.item,
    required this.onDelete,
    required this.onChange,
    required this.canBeCompleted,
    required this.isEditing,
    super.key,
  });

  void handleItemNameChange(ListItem item, String newName) {
    onChange(item.id, {'name': newName});
  }

  @override
  Widget build(BuildContext context) {
    if (isEditing) {
      return EditableCategoryItem(
        item: item,
        onChange: (String newName) => handleItemNameChange(item, newName),
      );
    } else {
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
                    decorationColor: Theme.of(context)
                        .textTheme
                        .bodyLarge!
                        .color!
                        .withOpacity(0.4),
                    color: Theme.of(context)
                        .textTheme
                        .bodyLarge!
                        .color!
                        .withOpacity(0.5),
                  )
                : null,
          ),
          trailing: canBeCompleted
              ? Checkbox(
                  value: item.isComplete,
                  onChanged: (value) {
                    onChange(item.id, {'is_complete': value != false});
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
}
