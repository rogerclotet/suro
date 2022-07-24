import 'package:familia/lists/edit_list_screen.dart';
import 'package:familia/lists/lists.dart';
import 'package:familia/lists/lists_state.dart';
import 'package:familia/lists/templates_screen.dart';
import 'package:familia/main_drawer.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/list.dart';

class ListsScreen extends StatelessWidget {
  const ListsScreen({Key? key}) : super(key: key);

  static const routeName = '/lists';

  @override
  Widget build(BuildContext context) {
    final listsState = Provider.of<ListsState>(context);

    void handleCreate(FamilyList list) {
      listsState.createList(list);
    }

    if (listsState.isLoading) {
      return Scaffold(
        appBar: AppBar(
          title: const Text('Llistes'),
        ),
        drawer: const MainDrawer(),
        body: const Center(
          child: CircularProgressIndicator(),
        ),
      );
    }

    return Scaffold(
      drawer: const MainDrawer(),
      appBar: AppBar(
        title: const Text('Llistes'),
        actions: [
          Tooltip(
            message: 'Plantilles',
            child: IconButton(
              onPressed: () {
                Navigator.of(context).pushNamed(TemplatesScreen.routeName);
              },
              icon: const Icon(Icons.library_books),
            ),
          )
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          Navigator.of(context).push(
            MaterialPageRoute(
              builder: (_) =>
                  EditListForm(isTemplate: false, onChange: handleCreate),
            ),
          );
        },
        tooltip: 'Crear llista',
        child: const Icon(Icons.add),
      ),
      body: RefreshIndicator(
        onRefresh: () => listsState.refresh(),
        triggerMode: RefreshIndicatorTriggerMode.onEdge,
        child: Padding(
          padding: const EdgeInsets.all(8.0),
          child: Lists(lists: listsState.lists),
        ),
      ),
    );
  }
}
