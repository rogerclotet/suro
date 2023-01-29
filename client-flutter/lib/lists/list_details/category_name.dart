import 'package:flutter/material.dart';

class CategoryName extends StatefulWidget {
  final String name;
  final bool isExpanded;
  final bool isEditing;
  final void Function() onToggleExpand;
  final void Function(String name) onChange;

  const CategoryName({
    required this.name,
    required this.isExpanded,
    required this.isEditing,
    required this.onToggleExpand,
    required this.onChange,
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
    editingName = widget.name;
    super.initState();
  }

  void handleSubmit(String newName) {
    setState(() {
      editingName = newName.trim();
    });
    widget.onChange(editingName);
  }

  void handleTapOutside() {
    focusNode.nextFocus();
    final newName = editingName.trim();
    setState(() {
      editingName = newName;
    });
    if (newName != widget.name) {
      widget.onChange(newName);
    }
  }

  @override
  Widget build(BuildContext context) {
    return ListTile(
      title: widget.isEditing
          ? TextFormField(
              initialValue: widget.name,
              onFieldSubmitted: handleSubmit,
              onChanged: (value) => setState(() {
                editingName = value;
              }),
              onTapOutside: (_) => handleTapOutside(),
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
      trailing: IconButton(
        icon: Icon(widget.isExpanded ? Icons.expand_less : Icons.expand_more),
        onPressed: widget.onToggleExpand,
      ),
    );
  }
}
