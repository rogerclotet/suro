import 'package:flutter/material.dart';

class CategoryName extends StatefulWidget {
  final String name;
  final bool isExpanded;
  final bool isEditing;
  final void Function()? onToggleExpand;
  final void Function(String name) onChange;

  const CategoryName({
    required this.name,
    required this.isExpanded,
    required this.isEditing,
    required this.onChange,
    this.onToggleExpand,
    super.key,
  });

  @override
  State<CategoryName> createState() => _CategoryNameState();
}

class _CategoryNameState extends State<CategoryName> {
  String editingName = '';
  FocusNode focusNode = FocusNode();

  @override
  void initState() {
    super.initState();
    editingName = widget.name;
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
    if (editingName != widget.name) {
      widget.onChange(editingName);
    }
  }

  @override
  Widget build(BuildContext context) {
    return ListTile(
      title: widget.isEditing
          ? TextFormField(
              initialValue: widget.name,
              onChanged: (value) => setState(() {
                editingName = value;
              }),
              focusNode: focusNode,
              decoration: const InputDecoration(
                border: InputBorder.none,
                labelText: 'Nom de la categoria',
              ),
            )
          : Text(
              widget.name == '' ? 'Sense categoria' : widget.name,
              style: Theme.of(context).textTheme.titleSmall,
            ),
      dense: true,
      tileColor: Theme.of(context).colorScheme.surfaceVariant,
      trailing: widget.isEditing
          ? null
          : IconButton(
              icon: Icon(
                  widget.isExpanded ? Icons.expand_less : Icons.expand_more),
              onPressed: widget.onToggleExpand,
            ),
    );
  }
}
