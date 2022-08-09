import 'package:familia/families/families_state.dart';
import 'package:familia/lists/edit_list_screen.dart';
import 'package:familia/lists/lists.dart';
import 'package:familia/lists/lists_state.dart';
import 'package:familia/lists/templates_screen.dart';
import 'package:familia/main_drawer.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:animations/animations.dart';

class ListsScreen extends StatelessWidget {
  const ListsScreen({super.key});

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
      floatingActionButton: OpenContainer(
        transitionType: ContainerTransitionType.fade,
        openBuilder: (BuildContext context, VoidCallback close) {
          return EditListScreen(
            isTemplate: false,
            onClose: close,
          );
        },
        closedElevation: 6.0,
        closedShape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.all(
            Radius.circular(56 / 4),
          ),
        ),
        closedColor: Theme.of(context).colorScheme.primary,
        closedBuilder: (BuildContext context, VoidCallback openContainer) {
          return const SizedBox(
            height: 56,
            width: 56,
            child: Center(
              child: Icon(Icons.add),
            ),
          );
        },
      ),
      body: RefreshIndicator(
        onRefresh: () => listsState.refresh(),
        triggerMode: RefreshIndicatorTriggerMode.onEdge,
        child: Lists(lists: listsState.lists),
      ),
    );
  }
}
