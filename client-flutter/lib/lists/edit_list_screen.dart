import 'package:familia/lists/template_select.dart';
import 'package:familia/models/list_item.dart';
import 'package:flutter/material.dart';

import '../models/list.dart';

class EditListForm extends StatefulWidget {
  final FamilyList? list;
  final void Function(FamilyList list) onChange;

  const EditListForm({this.list, required this.onChange, super.key});

  @override
  State<EditListForm> createState() => _EditListFormState();
}

class _EditListFormState extends State<EditListForm> {
  final _formKey = GlobalKey<FormState>();

  final nameController = TextEditingController();
  final descriptionController = TextEditingController();
  late bool isTemplate;
  final List<FamilyList> importedTemplates = [];

  @override
  void initState() {
    super.initState();

    isTemplate = widget.list?.isTemplate ?? false;
  }

  void submit(NavigatorState navigator) {
    if (_formKey.currentState!.validate()) {
      final list = FamilyList(
        id: -1,
        name: nameController.text.trim(),
        description: descriptionController.text.trim(),
        isTemplate: isTemplate,
        items: importedTemplates.fold<List<ListItem>>(
          [],
          (previous, template) => [...previous, ...template.items],
        ).map((item) {
          return ListItem(id: -1, name: item.name, category: item.category);
        }).toList(),
      );

      widget.onChange(list);

      navigator.pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Crear llista'),
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => submit(Navigator.of(context)),
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
              minLines: 3,
            ),
            const SizedBox(height: 32),
            SwitchListTile(
              title: const Text('És una plantilla'),
              value: isTemplate,
              onChanged: (value) {
                setState(() {
                  isTemplate = value;
                });
              },
            ),
            isTemplate
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
