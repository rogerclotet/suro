import 'dart:developer';

import 'package:flutter/material.dart';

import '../../models/list_item.dart';

class EditableCategoryItem extends StatefulWidget {
  final ListItem item;
  final void Function(String name) onChange;

  const EditableCategoryItem({
    required this.item,
    required this.onChange,
    super.key,
  });

  @override
  State<EditableCategoryItem> createState() => _EditableCategoryItemState();
}

class _EditableCategoryItemState extends State<EditableCategoryItem> {
  String editingName = '';
  FocusNode focusNode = FocusNode();

  @override
  void initState() {
    super.initState();
    editingName = widget.item.name;
    focusNode.addListener(() {
      if (!focusNode.hasFocus) {
        handleSubmit();
      }
    });
  }

  void handleSubmit() {
    // TODO handle empty values to delete item (with confirmation?)
    setState(() {
      editingName = editingName.trim();
    });
    if (editingName != widget.item.name) {
      widget.onChange(editingName);
    }
  }

  @override
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding: const EdgeInsets.only(left: 16, right: 16),
      title: TextFormField(
        initialValue: editingName,
        style: widget.item.isComplete
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
        onChanged: (value) => setState(() {
          editingName = value;
        }),
        focusNode: focusNode,
        decoration: const InputDecoration(
          border: InputBorder.none,
        ),
      ),
      dense: true,
    );
  }
}
