import 'package:familia/models/list.dart';
import 'package:flutter/material.dart';

import 'list_preview.dart';

class Lists extends StatelessWidget {
  final List<FamilyList> lists;

  const Lists({required this.lists, super.key});

  @override
  Widget build(BuildContext context) {
    return SliverGrid.extent(
      maxCrossAxisExtent: 200,
      childAspectRatio: 1.4,
      crossAxisSpacing: 4,
      mainAxisSpacing: 4,
      children: lists.map((list) => ListPreview(list: list)).toList(),
    );
  }
}
