import 'package:familia/families/families_state.dart';
import 'package:familia/main_drawer.dart';
import 'package:familia/models/family.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

class FamilySettingsScreen extends StatefulWidget {
  final int familyId;

  const FamilySettingsScreen({required this.familyId, super.key});

  static const routeName = 'family_settings';

  @override
  State<FamilySettingsScreen> createState() => _FamilySettingsScreenState();
}

class _FamilySettingsScreenState extends State<FamilySettingsScreen> {
  FamiliesState? familiesState;

  Family? family;

  @override
  Widget build(BuildContext context) {
    familiesState ??= Provider.of<FamiliesState>(context);

    if (familiesState!.currentFamily?.id != widget.familyId) {
      familiesState!.selectFamily(widget.familyId);
    }

    family = familiesState!.currentFamily;

    if (family == null) {
      return Scaffold(
        appBar: AppBar(
          title: const Text('Família'),
        ),
        drawer: MainDrawer(),
        body: const Center(
          child: CircularProgressIndicator(),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(title: Text(family!.name)),
      drawer: MainDrawer(),
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
                    style: Theme.of(context).textTheme.titleSmall,
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
