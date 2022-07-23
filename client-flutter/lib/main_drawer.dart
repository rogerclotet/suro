import 'package:familia/auth/auth.dart';
import 'package:familia/families/families_state.dart';
import 'package:familia/families/family_settings_screen.dart';
import 'package:familia/lists/lists_screen.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

class MainDrawer extends StatelessWidget {
  const MainDrawer({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<Auth>(context, listen: false);

    return Drawer(
      child: ListView(
        padding: EdgeInsets.zero,
        children: <Widget>[
          DrawerHeader(
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.primary,
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
                          familiesState.selectFamily(id);
                          Navigator.pop(context);
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
              Navigator.pop(context);
              Navigator.of(context).pushReplacementNamed(
                ListsScreen.routeName,
              );
            },
          ),
          ListTile(
            leading: const Icon(Icons.settings),
            title: const Text('Preferències'),
            onTap: () {
              Navigator.pop(context);
              Navigator.of(context).pushReplacementNamed(
                FamilySettingsScreen.routeName,
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
