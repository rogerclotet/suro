import 'package:familia/lists/list_detail_screen.dart';
import 'package:familia/lists/lists_state.dart';
import 'package:familia/models/list.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

class ListPreview extends StatelessWidget {
  final FamilyList list;

  const ListPreview({required this.list, super.key});

  void navigateToList(BuildContext context) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => ListDetailScreen(
          listId: list.id,
        ),
      ),
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
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding:
                  const EdgeInsets.only(left: 12, right: 8, top: 8, bottom: 8),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Padding(
                    padding: const EdgeInsets.only(bottom: 4),
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
                  Text(
                    list.description,
                    style: Theme.of(context).textTheme.subtitle2?.copyWith(
                          color: Theme.of(context)
                              .textTheme
                              .bodySmall
                              ?.color
                              ?.withOpacity(0.7),
                        ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                IconButton(
                  onPressed: () => listsState.toggleFavorite(list),
                  icon: const Icon(Icons.favorite),
                  color: list.isFavorite
                      ? Theme.of(context).colorScheme.secondary
                      : null,
                ),
                IconButton(
                  onPressed: () {},
                  icon: const Icon(Icons.share),
                ),
                IconButton(
                  onPressed: () {},
                  icon: const Icon(Icons.copy),
                ),
              ],
            )
          ],
        ),
      ),
    );
  }
}
