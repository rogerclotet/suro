import 'dart:developer';

import 'package:flutter/material.dart';

class NewCategoryItem extends StatefulWidget {
  final void Function(String name) onAdd;

  const NewCategoryItem({
    required this.onAdd,
    super.key,
  });

  @override
  State<NewCategoryItem> createState() => _NewCategoryItemState();
}

class _NewCategoryItemState extends State<NewCategoryItem> {
  String editingName = '';
  FocusNode focusNode = FocusNode();
  late TextEditingController nameController;

  @override
  void initState() {
    super.initState();
    nameController = TextEditingController();
    focusNode.addListener(() {
      if (!focusNode.hasFocus) {
        handleSubmit();
      }
    });
  }

  void handleSubmit() {
    final name = editingName.trim();
    nameController.clear();
    setState(() {
      editingName = '';
    });
    if (name != '') {
      widget.onAdd(name);
    }
  }

  @override
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding: const EdgeInsets.only(left: 16, right: 16),
      title: TextFormField(
        controller: nameController,
        onChanged: (value) => setState(() {
          editingName = value;
        }),
        focusNode: focusNode,
        decoration: InputDecoration(
          border: InputBorder.none,
          hintText: "Afegir element",
          hintStyle: TextStyle(
            color:
                Theme.of(context).textTheme.bodyLarge!.color!.withOpacity(0.5),
          ),
        ),
      ),
      dense: true,
      trailing: IconButton(
        icon: const Icon(Icons.add),
        onPressed: () => handleSubmit(),
      ),
    );
  }
}
