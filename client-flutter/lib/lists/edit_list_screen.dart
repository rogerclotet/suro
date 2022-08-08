import 'package:familia/lists/template_select.dart';
import 'package:familia/models/list_item.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../models/list.dart';
import 'lists_state.dart';

class EditListScreen extends StatefulWidget {
  final int? listId;
  final bool isTemplate;

  static const listRouteName = 'edit_list';
  static const newListRouteName = 'new_list';
  static const templateRouteName = 'edit_template';
  static const newTemplateRouteName = 'new_template';

  const EditListScreen({required this.isTemplate, this.listId, super.key});

  @override
  State<EditListScreen> createState() => _EditListScreenState();
}

class _EditListScreenState extends State<EditListScreen> {
  final _formKey = GlobalKey<FormState>();

  final nameController = TextEditingController();
  final descriptionController = TextEditingController();
  final List<FamilyList> importedTemplates = [];

  @override
  void initState() {
    super.initState();
  }

  void handleChange(FamilyList list) {
    final listsState = Provider.of<ListsState>(context, listen: false);

    if (widget.listId != null) {
      // TODO editing
    } else {
      listsState.createList(list);
    }
  }

  void submit(GoRouter router) {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    final list = FamilyList(
      id: -1,
      name: nameController.text.trim(),
      description: descriptionController.text.trim(),
      isTemplate: widget.isTemplate,
      items: importedTemplates.fold<List<ListItem>>(
        [],
        (previous, template) => [...previous, ...template.items],
      ).map((item) {
        return ListItem(id: -1, name: item.name, category: item.category);
      }).toList(),
    );

    handleChange(list);

    router.pop();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: widget.isTemplate
            ? const Text('Crear plantilla')
            : const Text('Crear llista'),
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () => GoRouter.of(context).pop(),
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => submit(GoRouter.of(context)),
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
            widget.isTemplate
                ? Container()
                : const Padding(
                    padding: EdgeInsets.only(top: 16),
                    child: TemplateSelect(),
                  )
          ],
        ),
      ),
    );
  }
}
