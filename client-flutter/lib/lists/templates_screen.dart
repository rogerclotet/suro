import 'package:animations/animations.dart';
import 'package:familia/lists/lists.dart';
import 'package:familia/lists/lists_state.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'edit_list_screen.dart';

class TemplatesScreen extends StatelessWidget {
  const TemplatesScreen({super.key});

  static const routeName = '/templates';

  @override
  Widget build(BuildContext context) {
    final listsState = Provider.of<ListsState>(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Plantilles'),
      ),
      floatingActionButton: OpenContainer(
        transitionType: ContainerTransitionType.fade,
        openBuilder: (BuildContext context, VoidCallback close) {
          return EditListScreen(
            isTemplate: true,
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
      body: listsState.isLoading
          ? const Center(
              child: CircularProgressIndicator(),
            )
          : RefreshIndicator(
              onRefresh: () => listsState.refresh(),
              triggerMode: RefreshIndicatorTriggerMode.onEdge,
              child: Padding(
                padding: const EdgeInsets.all(8.0),
                child: Lists(lists: listsState.templates),
              ),
            ),
    );
  }
}
