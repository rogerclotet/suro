import 'package:familia/families/families_state.dart';
import 'package:familia/lists/delete_list_dialog.dart';
import 'package:familia/lists/list_details/category_item.dart';
import 'package:familia/lists/list_details/category_list.dart';
import 'package:familia/lists/lists_screen.dart';
import 'package:familia/lists/lists_state.dart';
import 'package:familia/models/list.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../models/list_item.dart';
import '../edit_list_screen.dart';
import 'category_name.dart';

enum Actions { delete, edit }

class ListDetailScreen extends StatefulWidget {
  final int listId;

  static const listRouteName = 'list_detail';
  static const templateRouteName = 'template_detail';

  const ListDetailScreen({required this.listId, super.key});

  @override
  State<ListDetailScreen> createState() => _ListDetailScreenState();
}

class _ListDetailScreenState extends State<ListDetailScreen> {
  late ListsState listsState;
  late FamilyList list;
  late Map<String, List<ListItem>> itemsByCategory;
  bool isEditing = false;

  void setIsComplete(int id, bool value) {
    setState(() {
      final item = list.items.firstWhere((item) => item.id == id);
      item.isComplete = value;
    });

    listsState.setIsComplete(list.id, id, value);
  }

  void deleteItem(int id) {
    final index = list.items.indexWhere((item) => item.id == id);
    final item = list.items[index];
    final categoryIndex = itemsByCategory[item.category]!.indexOf(item);

    setState(() {
      list.items.removeAt(index);
      itemsByCategory[item.category]?.remove(item);
    });

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('S\'ha esborrat ${item.name}'),
        action: SnackBarAction(
          label: 'Desfer',
          onPressed: () {
            setState(() {
              list.items.insert(index, item);

              if (itemsByCategory.containsKey(item.category)) {
                itemsByCategory[item.category]!.insert(categoryIndex, item);
              } else {
                itemsByCategory[item.category] = [item];
              }
            });
          },
        ),
      ),
    );
  }

  void toggleIsEditing() {
    setState(() {
      isEditing = !isEditing;
    });
  }

  @override
  Widget build(BuildContext context) {
    listsState = Provider.of<ListsState>(context);
    final theme = Theme.of(context);

    try {
      list = listsState.list(widget.listId);
    } on ListNotFoundException catch (_) {
      GoRouter.of(context).pushReplacementNamed(
        ListsScreen.routeName,
        params: {
          'fid': Provider.of<FamiliesState>(context, listen: false).toString()
        },
      );
    }

    itemsByCategory = {};
    for (var item in list.items) {
      if (!itemsByCategory.containsKey(item.category)) {
        itemsByCategory[item.category] = [];
      }
      itemsByCategory[item.category]!.add(item);
    }

    return Scaffold(
      appBar: AppBar(
        title: Hero(
          tag: 'title_${list.id}',
          child: Text(
            list.name,
            style: Theme.of(context).textTheme.titleLarge,
            overflow: TextOverflow.ellipsis,
          ),
        ),
        actions: [
          PopupMenuButton(
            onSelected: (value) {
              switch (value) {
                case Actions.edit:
                  Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (context) {
                        return EditListScreen(
                          listId: list.id,
                          isTemplate: list.isTemplate,
                          onClose: () =>
                              Navigator.of(context).pop(), // TODO save list?
                        );
                      },
                    ),
                  );
                  break;
                case Actions.delete:
                  showDeleteListDialog(
                    context: context,
                    list: list,
                    onDeleted: () {
                      GoRouter.of(context).pushReplacementNamed(
                        ListsScreen.routeName,
                        params: {
                          'fid':
                              Provider.of<FamiliesState>(context, listen: false)
                                  .toString()
                        },
                      );
                    },
                  );
                  break;
              }
            },
            itemBuilder: (context) {
              return [
                const PopupMenuItem(
                  value: Actions.edit,
                  child: ListTile(
                    leading: Icon(Icons.edit),
                    title: Text('Editar'),
                  ),
                ),
                const PopupMenuItem(
                  value: Actions.delete,
                  child: ListTile(
                    leading: Icon(Icons.delete),
                    title: Text('Eliminar'),
                  ),
                ),
              ];
            },
            position: PopupMenuPosition.under,
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: toggleIsEditing,
        child: AnimatedSwitcher(
          duration: const Duration(milliseconds: 200),
          transitionBuilder: (child, anim) =>
              ScaleTransition(scale: anim, child: child),
          child: isEditing
              ? const Icon(Icons.done, key: ValueKey('done'))
              : const Icon(
                  Icons.edit,
                  key: ValueKey('edit'),
                ),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: () => listsState.refresh(),
        triggerMode: RefreshIndicatorTriggerMode.onEdge,
        child: list.items.isEmpty
            ? Padding(
                padding: const EdgeInsets.all(16),
                child: Text(
                  'Aquesta llista no té elements',
                  style: theme.textTheme.bodyMedium!.copyWith(
                    fontStyle: FontStyle.italic,
                    color: theme.textTheme.bodyMedium!.color!.withOpacity(0.6),
                  ),
                ),
              )
            : ListView(
                padding: const EdgeInsets.only(bottom: 80),
                children: itemsByCategory.entries.map(
                  (e) {
                    return CategoryList(
                      category: e.key,
                      items: e.value,
                      isTemplate: list.isTemplate,
                      onDelete: deleteItem,
                      onChangeIsComplete: setIsComplete,
                    );
                  },
                ).toList(),
              ),
      ),
    );
  }
}
