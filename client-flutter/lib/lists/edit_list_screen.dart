import 'package:familia/lists/template_select.dart';
import 'package:familia/models/list_item.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/list.dart';
import 'lists_state.dart';

const defaultId = -1;

class EditListScreen extends StatefulWidget {
  final int? listId;
  final bool isTemplate;
  final List<ListItem>? initialItems;
  final VoidCallback onClose;

  const EditListScreen({
    this.listId,
    required this.isTemplate,
    this.initialItems,
    required this.onClose,
    super.key,
  });

  @override
  State<EditListScreen> createState() => _EditListScreenState();
}

class _EditListScreenState extends State<EditListScreen> {
  final _formKey = GlobalKey<FormState>();

  late final String title;
  final nameController = TextEditingController();
  final descriptionController = TextEditingController();

  List<FamilyList> importedTemplates = [];

  @override
  void initState() {
    super.initState();

    final actionText = widget.listId != null
        ? "Editar"
        : widget.initialItems != null
            ? "Duplicar"
            : "Crear";

    title = '$actionText ${widget.isTemplate ? "plantilla" : "llista"}';
  }

  void handleChange(FamilyList list) {
    final listsState = Provider.of<ListsState>(context, listen: false);

    if (widget.listId != null) {
      // TODO editing
    } else {
      listsState.createList(list);
    }
  }

  void submit() {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    final items = (widget.initialItems ?? []) +
        importedTemplates.fold<List<ListItem>>(
          [],
          (previous, template) => [...previous, ...template.items],
        ).map((item) {
          return ListItem(
            id: defaultId,
            name: item.name,
            category: item.category,
          );
        }).toList();

    final list = FamilyList(
      id: widget.listId ?? defaultId,
      name: nameController.text.trim(),
      description: descriptionController.text.trim(),
      isTemplate: widget.isTemplate,
      items: items,
    );

    handleChange(list);

    widget.onClose();
  }

  void setIncludedTemplates(List<FamilyList> templates) {
    setState(() {
      importedTemplates = templates;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(title),
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: widget.onClose,
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => submit(),
        child: const Icon(Icons.done),
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 32, 16, 84),
          children: [
            TextFormField(
              controller: nameController,
              autofocus: true,
              decoration: const InputDecoration(
                border: OutlineInputBorder(),
                labelText: 'Nom',
              ),
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Introdueix un nom, sisplau';
                }
                return null;
              },
            ),
            const SizedBox(height: 32),
            TextFormField(
              controller: descriptionController,
              decoration: const InputDecoration(
                border: OutlineInputBorder(),
                labelText: 'Descripció',
              ),
              maxLines: 3,
              minLines: 1,
            ),
            widget.initialItems != null && widget.initialItems!.isNotEmpty
                ? Padding(
                    padding: const EdgeInsets.fromLTRB(16, 24, 16, 0),
                    child: Text(
                      'Es duplicaran ${widget.initialItems!.length} elements de la llista',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            color: Theme.of(context).colorScheme.primary,
                          ),
                    ),
                  )
                : Container(),
            widget.isTemplate
                ? Container()
                : Padding(
                    padding: const EdgeInsets.only(top: 16),
                    child: TemplateSelect(
                      onChange: setIncludedTemplates,
                    ),
                  )
          ],
        ),
      ),
    );
  }
}
