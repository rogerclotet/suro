import 'package:flutter/material.dart';

class NewCategory extends StatefulWidget {
  final void Function(String name) onAdd;

  const NewCategory({
    required this.onAdd,
    super.key,
  });

  @override
  State<NewCategory> createState() => _NewCategoryState();
}

class _NewCategoryState extends State<NewCategory> {
  String editingName = '';
  FocusNode focusNode = FocusNode();

  @override
  void initState() {
    super.initState();
    focusNode.addListener(() {
      if (!focusNode.hasFocus) {
        handleSubmit();
      }
    });
  }

  void handleSubmit() {
    setState(() {
      editingName = editingName.trim();
    });
    if (editingName.isNotEmpty) {
      widget.onAdd(editingName);
    }
  }

  @override
  Widget build(BuildContext context) {
    return ListTile(
      title: TextFormField(
        onChanged: (value) => setState(() {
          editingName = value;
        }),
        focusNode: focusNode,
        decoration: const InputDecoration(
          border: InputBorder.none,
          labelText: 'Afegir categoria',
        ),
      ),
      dense: true,
      tileColor: Theme.of(context).colorScheme.surfaceVariant,
      trailing: IconButton(
        icon: const Icon(Icons.add),
        onPressed: handleSubmit,
      ),
    );
  }
}
