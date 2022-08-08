import 'package:familia/lists/lists.dart';
import 'package:familia/lists/lists_state.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../families/families_state.dart';
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
      floatingActionButton: FloatingActionButton(
        onPressed: () => GoRouter.of(context).pushNamed(
          EditListScreen.newTemplateRouteName,
          params: {
            'fid': Provider.of<FamiliesState>(context, listen: false)
                .currentFamily!
                .id
                .toString()
          },
        ),
        tooltip: 'Crear plantilla',
        child: const Icon(Icons.add),
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
