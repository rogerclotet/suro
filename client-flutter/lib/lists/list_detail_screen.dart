import 'package:familia/models/list.dart';
import 'package:flutter/material.dart';

import '../models/list_item.dart';

class ListDetailScreen extends StatefulWidget {
  final FamilyList list;

  const ListDetailScreen({required this.list, super.key});

  @override
  State<ListDetailScreen> createState() => _ListDetailScreenState();
}

class _ListDetailScreenState extends State<ListDetailScreen> {
  late FamilyList list;
  late Map<String, List<ListItem>> itemsByCategory;

  @override
  void initState() {
    super.initState();

    list = widget.list;

    itemsByCategory = {};
    for (var item in list.items) {
      if (!itemsByCategory.containsKey(item.category)) {
        itemsByCategory[item.category] = [];
      }
      itemsByCategory[item.category]!.add(item);
    }
  }

  void toggleCheckbox(int id, bool value) {
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Hero(
          tag: "title_${widget.list.id}",
          child: Text(
            widget.list.name,
            style: Theme.of(context).textTheme.titleLarge,
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ),
      floatingActionButton: FloatingActionButton(
        child: const Icon(Icons.edit),
        onPressed: () => {},
      ),
      body: ListView(
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
                    key == ''
                        ? Container()
                        : ListTile(
                            title: Text(
                              key == '' ? 'Sense categoria' : key,
                              style: Theme.of(context).textTheme.subtitle2,
                            ),
                            dense: true,
                            tileColor: Theme.of(context).colorScheme.surface,
                          ),
                    ...items.map((item) {
                      return Dismissible(
                        key: Key('${item.id}'),
                        onDismissed: (direction) => deleteItem(item.id),
                        background: Container(color: Colors.deepOrange[900]),
                        child: ListTile(
                          contentPadding:
                              const EdgeInsets.only(left: 16, right: 2),
                          title: Text(
                            item.name,
                            style: item.isComplete
                                ? TextStyle(
                                    decoration: TextDecoration.lineThrough,
                                    color: Theme.of(context)
                                        .textTheme
                                        .bodyText1!
                                        .color!
                                        .withOpacity(0.4),
                                  )
                                : null,
                          ),
                          trailing: Checkbox(
                            value: item.isComplete,
                            onChanged: (value) {
                              toggleCheckbox(item.id, value != false);
                            },
                          ),
                        ),
                      );
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
    );
  }
}
