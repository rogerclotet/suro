import 'package:familia/families/families_state.dart';
import 'package:familia/main_drawer.dart';
import 'package:familia/models/family.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

class FamilySettingsScreen extends StatefulWidget {
  const FamilySettingsScreen({super.key});

  static const routeName = '/settings';

  @override
  State<FamilySettingsScreen> createState() => _FamilySettingsScreenState();
}

class _FamilySettingsScreenState extends State<FamilySettingsScreen> {
  FamiliesState? familiesState;

  Family? family;

  @override
  Widget build(BuildContext context) {
    familiesState ??= Provider.of<FamiliesState>(context);

    family = familiesState!.currentFamily;

    if (family == null) {
      return Scaffold(
        appBar: AppBar(
          title: const Text("Família"),
        ),
        drawer: const MainDrawer(),
        body: const Center(
          child: CircularProgressIndicator(),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(title: Text(family!.name)),
      drawer: const MainDrawer(),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Card(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Text(
                    'Membres',
                    style: Theme.of(context).textTheme.subtitle2,
                  ),
                ),
                ...family!.members.map((member) {
                  return ListTile(
                    title: Text('${member.firstName} ${member.lastName}'),
                    leading: const CircleAvatar(
                      child: Icon(Icons.person),
                    ),
                  );
                }).toList(),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
