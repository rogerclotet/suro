import 'package:familia/families/families_state.dart';
import 'package:familia/lists/delete_list_dialog.dart';
import 'package:familia/lists/list_details/list_detail_screen.dart';
import 'package:familia/lists/lists_state.dart';
import 'package:familia/models/list.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import 'edit_list_screen.dart';

class ListPreview extends StatelessWidget {
  final FamilyList list;
  final int descriptionLines;

  const ListPreview({
    required this.list,
    required this.descriptionLines,
    super.key,
  });

  void navigateToList(BuildContext context) {
    GoRouter.of(context).pushNamed(
      ListDetailScreen.listRouteName,
      params: {
        'fid': Provider.of<FamiliesState>(context, listen: false)
            .currentFamily!
            .id
            .toString(),
        'lid': list.id.toString()
      },
    );
  }

  get itemCount {
    return list.items.length;
  }

  @override
  Widget build(BuildContext context) {
    final listsState = Provider.of<ListsState>(context, listen: false);

    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () => navigateToList(context),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding:
                  const EdgeInsets.only(left: 12, right: 8, top: 8, bottom: 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Hero(
                      tag: "title_${list.id}",
                      child: Text(
                        list.name,
                        style: Theme.of(context)
                            .textTheme
                            .titleLarge
                            ?.copyWith(fontSize: 16),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ),
                  Container(
                    decoration: BoxDecoration(
                      color: Theme.of(context).colorScheme.background,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 6),
                      child: Text('${list.items.length}'),
                    ),
                  )
                ],
              ),
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.only(left: 12, right: 12),
                child: Text(
                  list.description,
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        color: Theme.of(context)
                            .textTheme
                            .bodySmall
                            ?.color
                            ?.withOpacity(0.7),
                      ),
                  maxLines: descriptionLines,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                IconButton(
                  onPressed: () => listsState.toggleFavorite(list),
                  icon: const Icon(Icons.favorite),
                  color: list.isFavorite
                      ? Theme.of(context).colorScheme.primary
                      : null,
                ),
                IconButton(
                  onPressed: () {
                    Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (context) {
                          return EditListScreen(
                            isTemplate: list.isTemplate,
                            initialItems: list.items,
                            onClose: () =>
                                Navigator.of(context).pop(), // TODO save list?
                          );
                        },
                      ),
                    );
                  },
                  icon: const Icon(Icons.copy),
                ),
                IconButton(
                  onPressed: () {
                    showDeleteListDialog(context: context, list: list);
                  },
                  icon: const Icon(Icons.delete),
                )
              ],
            ),
          ],
        ),
      ),
    );
  }
}
