import 'package:familia/families/families_state.dart';
import 'package:familia/lists/edit_list_screen.dart';
import 'package:familia/lists/lists.dart';
import 'package:familia/lists/lists_state.dart';
import 'package:familia/lists/templates_screen.dart';
import 'package:familia/main_drawer.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

class ListsScreen extends StatelessWidget {
  const ListsScreen({Key? key}) : super(key: key);

  static const routeName = 'lists';

  @override
  Widget build(BuildContext context) {
    final listsState = Provider.of<ListsState>(context);

    if (listsState.isLoading) {
      return Scaffold(
        appBar: AppBar(
          title: const Text('Llistes'),
        ),
        drawer: MainDrawer(),
        body: const Center(
          child: CircularProgressIndicator(),
        ),
      );
    }

    return Scaffold(
      drawer: MainDrawer(),
      appBar: AppBar(
        title: const Text('Llistes'),
        actions: [
          Tooltip(
            message: 'Plantilles',
            child: IconButton(
              onPressed: () {
                GoRouter.of(context).pushNamed(
                  TemplatesScreen.routeName,
                  params: {
                    'fid': Provider.of<FamiliesState>(context, listen: false)
                        .currentFamily!
                        .id
                        .toString()
                  },
                );
              },
              icon: const Icon(Icons.library_books),
            ),
          )
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => GoRouter.of(context).pushNamed(
          EditListScreen.newListRouteName,
          params: {
            'fid': Provider.of<FamiliesState>(context, listen: false)
                .currentFamily!
                .id
                .toString()
          },
        ),
        tooltip: 'Crear llista',
        child: const Icon(Icons.add),
      ),
      body: RefreshIndicator(
        onRefresh: () => listsState.refresh(),
        triggerMode: RefreshIndicatorTriggerMode.onEdge,
        child: Lists(lists: listsState.lists),
      ),
    );
  }
}
