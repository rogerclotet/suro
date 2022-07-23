import 'package:familia/lists/edit_list_screen.dart';
import 'package:familia/lists/lists.dart';
import 'package:familia/lists/lists_state.dart';
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

    return DefaultTabController(
      length: 2,
      child: Scaffold(
        drawer: const MainDrawer(),
        body: NestedScrollView(
          headerSliverBuilder: (context, innerBoxIsScrolled) {
            return [
              SliverOverlapAbsorber(
                handle:
                    NestedScrollView.sliverOverlapAbsorberHandleFor(context),
                sliver: SliverAppBar(
                  pinned: true,
                  floating: true,
                  forceElevated: innerBoxIsScrolled,
                  title: const Text('Llistes'),
                  bottom: const TabBar(
                    tabs: [
                      Tab(
                        text: 'Llistes',
                      ),
                      Tab(
                        text: 'Plantilles',
                      ),
                    ],
                  ),
                ),
              ),
            ];
          },
          body: TabBarView(
            children: [
              listsState.lists,
              listsState.templates,
            ].asMap().entries.map(
              (tab) {
                return SafeArea(
                  top: false,
                  bottom: false,
                  child: Builder(
                    builder: ((context) {
                      return CustomScrollView(
                        key: PageStorageKey('${tab.key}'),
                        slivers: [
                          SliverOverlapInjector(
                            handle:
                                NestedScrollView.sliverOverlapAbsorberHandleFor(
                              context,
                            ),
                          ),
                          SliverPadding(
                            padding: const EdgeInsets.only(
                              left: 2,
                              right: 2,
                              top: 4,
                              bottom: 84,
                            ),
                            sliver: Lists(
                              lists: tab.value,
                            ),
                          ),
                        ],
                      );
                    }),
                  ),
                );
              },
            ).toList(),
          ),
        ),
        floatingActionButton: FloatingActionButton(
          onPressed: () {
            Navigator.of(context).push(
              MaterialPageRoute(
                builder: (_) => EditListForm(onChange: handleCreate),
              ),
            );
          },
          tooltip: 'Crear llista',
          child: const Icon(Icons.add),
        ),
      ),
    );
  }
}
