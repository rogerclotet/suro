import 'package:familia/lists/list_details/category_item.dart';
import 'package:familia/lists/lists_state.dart';
import 'package:familia/models/list.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../models/list_item.dart';
import 'category_name.dart';

class ListDetailScreen extends StatefulWidget {
  final int listId;

  static const listRouteName = 'list_detail';
  static const templateRouteName = 'template_detail';

  const ListDetailScreen({required this.listId, super.key});

  @override
  State<ListDetailScreen> createState() => _ListDetailScreenState();
}

class _ListDetailScreenState extends State<ListDetailScreen> {
  late FamilyList list;
  late Map<String, List<ListItem>> itemsByCategory;
  bool isEditing = false;

  void setIsComplete(int id, bool value) {
    setState(() {
      final item = list.items.firstWhere((item) => item.id == id);
      item.isComplete = value;
    });
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
    final listsState = Provider.of<ListsState>(context);
    final router = GoRouter.of(context);
    final theme = Theme.of(context);

    list = listsState.list(widget.listId);
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
          tag: "title_${list.id}",
          child: Text(
            list.name,
            style: Theme.of(context).textTheme.titleLarge,
            overflow: TextOverflow.ellipsis,
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.delete),
            onPressed: () => showDialog(
              context: context,
              builder: (BuildContext context) => AlertDialog(
                title: const Text('Confirmació'),
                content: Text(
                  'Estàs segur que vols eliminar la llista ${list.name}?',
                ),
                actions: [
                  TextButton(
                    onPressed: () => Navigator.pop(context, false),
                    autofocus: true,
                    child: const Text('Canceŀlar'),
                  ),
                  TextButton(
                    onPressed: () {
                      Navigator.pop(context, true);
                      Provider.of<ListsState>(
                        context,
                        listen: false,
                      ).delete(list);
                    },
                    child: const Text('Eliminar'),
                  ),
                ],
              ),
            ).then((confirmed) {
              if (confirmed) {
                router.pop();
              }
            }),
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
                children: itemsByCategory
                    .map(
                      (key, items) {
                        if (items.isEmpty) {
                          return MapEntry(key, []);
                        }

                        return MapEntry(
                          key,
                          [
                            CategoryName(name: key),
                            ...items.map((item) {
                              return CategoryItem(
                                  item: item,
                                  onDelete: deleteItem,
                                  onChange: setIsComplete);
                            }).toList(),
                          ],
                        );
                      },
                    )
                    .values
                    .fold<List<Widget>>(
                      [],
                      (previousValue, element) {
                        return [...previousValue, ...element];
                      },
                    )
                    .toList(),
              ),
      ),
    );
  }
}
