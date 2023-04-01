import 'package:familia/models/list.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'lists_state.dart';

Future showDeleteListDialog({
  required BuildContext context,
  required FamilyList list,
  VoidCallback? onDeleted,
}) {
  return showDialog(
    context: context,
    builder: (BuildContext context) => AlertDialog(
      title: const Text('Confirmació'),
      content: Text(
        'Estàs segur que vols eliminar la llista ${list.name}?',
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          autofocus: true,
          child: const Text('Canceŀlar'),
        ),
        TextButton(
          onPressed: () {
            if (onDeleted != null) {
              onDeleted();
            }

            Provider.of<ListsState>(
              context,
              listen: false,
            ).delete(list);
          },
          child: const Text('Eliminar'),
        ),
      ],
    ),
  );
}
