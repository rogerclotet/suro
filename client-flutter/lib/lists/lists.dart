import 'package:familia/models/list.dart';
import 'package:flutter/material.dart';

import 'list_preview.dart';

class Lists extends StatelessWidget {
  final List<FamilyList> lists;

  const Lists({required this.lists, super.key});

  @override
  Widget build(BuildContext context) {
    final screenWidth = MediaQuery.of(context).size.width;
    final descriptionLines =
        ((((screenWidth - 8) / (screenWidth / (320 + 8)).ceil()) / 1.4 - 68) /
                30)
            .floor();

    return GridView.extent(
      padding: const EdgeInsets.fromLTRB(4, 8, 4, 84),
      maxCrossAxisExtent: 320,
      childAspectRatio: 1.4,
      crossAxisSpacing: 4,
      mainAxisSpacing: 4,
      children: lists
          .map(
            (list) => ListPreview(
              list: list,
              descriptionLines: descriptionLines,
            ),
          )
          .toList(),
    );
  }
}
