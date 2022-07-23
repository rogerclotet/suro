import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/list.dart';
import 'lists_state.dart';

class TemplateSelect extends StatefulWidget {
  const TemplateSelect({super.key});

  @override
  State<TemplateSelect> createState() => _TemplateSelectState();
}

class _TemplateSelectState extends State<TemplateSelect> {
  bool initialized = false;

  List<FamilyList> templates = [];
  List<FamilyList> includedTemplates = [];

  void includeTemplate(FamilyList template) {
    setState(() {
      templates.remove(template);
      includedTemplates.add(template);
    });
  }

  void excludeTemplate(FamilyList template) {
    setState(() {
      templates.add(template);
      includedTemplates.remove(template);
    });
  }

  @override
  Widget build(BuildContext context) {
    if (!initialized) {
      setState(() {
        templates = Provider.of<ListsState>(context).templates;
        initialized = true;
      });
    }

    if (includedTemplates.isEmpty && templates.isEmpty) {
      return Container();
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 8),
          child: Padding(
            padding: const EdgeInsets.only(left: 16, bottom: 8),
            child: Row(
              children: [
                Text(
                  "Importar plantilles",
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(width: 16),
                const Tooltip(
                  message:
                      'Pots incloure elements de les teves plantilles al crear una nova llista.',
                  child: Icon(
                    Icons.info,
                  ),
                ),
              ],
            ),
          ),
        ),
        includedTemplates.isEmpty
            ? Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
                child: Text(
                  "No s'importaran plantilles.",
                  style: TextStyle(
                      color: Theme.of(context)
                          .textTheme
                          .subtitle1!
                          .color!
                          .withOpacity(0.4)),
                ),
              )
            : Wrap(
                spacing: 8,
                children: includedTemplates.map(
                  (template) {
                    return InputChip(
                      label: Text(template.name),
                      onDeleted: () => excludeTemplate(template),
                    );
                  },
                ).toList(),
              ),
        templates.isEmpty
            ? Container()
            : Card(
                margin: const EdgeInsets.only(top: 8),
                clipBehavior: Clip.antiAlias,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Padding(
                      padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
                      child: Text(
                        'Plantilles disponibles',
                        style: Theme.of(context).textTheme.subtitle2,
                      ),
                    ),
                    const Divider(),
                    ...templates.map((template) {
                      return ListTile(
                        title: Text(
                          '${template.name} (${template.items.length} elements)',
                        ),
                        onTap: () => includeTemplate(template),
                      );
                    }).toList(),
                  ],
                ),
              ),
      ],
    );
  }
}
