import 'package:familia/auth/auth.dart';
import 'package:familia/families/families_state.dart';
import 'package:familia/families/family_settings_screen.dart';
import 'package:familia/lists/lists_screen.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

class MainDrawer extends StatelessWidget {
  MainDrawer({super.key});

  final _key = GlobalKey<DrawerControllerState>();

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<Auth>(context, listen: false);
    final familiesState = Provider.of<FamiliesState>(context);

    return Drawer(
      key: _key,
      child: ListView(
        padding: EdgeInsets.zero,
        children: <Widget>[
          DrawerHeader(
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.primaryContainer,
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Família',
                  style: TextStyle(
                    fontSize: 24,
                  ),
                ),
                Consumer<FamiliesState>(
                  builder: (context, familiesState, child) {
                    final currentFamily = familiesState.currentFamily;

                    if (currentFamily == null) {
                      return Container();
                    }

                    return DropdownButton<int>(
                      value: familiesState.currentFamily!.id,
                      isExpanded: true,
                      items: familiesState.families
                          .map(
                            (family) => DropdownMenuItem(
                              value: family.id,
                              child: Row(
                                children: [
                                  const Icon(Icons.groups),
                                  const SizedBox(width: 8),
                                  SizedBox(
                                    width: 215,
                                    child: Text(
                                      family.name,
                                      softWrap: true,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          )
                          .toList(),
                      onChanged: (id) {
                        if (id != null) {
                          _key.currentState?.close();
                          familiesState.selectFamily(id);
                          // Navigator.pop(context);
                        }
                      },
                    );
                  },
                ),
              ],
            ),
          ),
          ListTile(
            leading: const Icon(Icons.list_alt),
            title: const Text('Llistes'),
            onTap: () {
              // Navigator.pop(context);
              _key.currentState?.close();
              GoRouter.of(context).pushReplacementNamed(
                ListsScreen.routeName,
                params: {'fid': familiesState.currentFamily!.id.toString()},
              );
            },
          ),
          ListTile(
            leading: const Icon(Icons.settings),
            title: const Text('Preferències'),
            onTap: () {
              // Navigator.pop(context);
              _key.currentState?.close();
              GoRouter.of(context).pushReplacementNamed(
                FamilySettingsScreen.routeName,
                params: {'fid': familiesState.currentFamily!.id.toString()},
              );
            },
          ),
          ListTile(
            leading: const Icon(Icons.logout),
            title: const Text('Tancar sessió'),
            onTap: auth.logout,
          ),
        ],
      ),
    );
  }
}
