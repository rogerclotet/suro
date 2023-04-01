import 'package:familia/lists/list_details/category_item.dart';
import 'package:familia/lists/list_details/category_name.dart';
import 'package:familia/lists/list_details/item_placeholder.dart';
import 'package:familia/lists/list_details/new_category_item.dart';
import 'package:familia/models/list_item.dart';
import 'package:flutter/material.dart';

class CategoryList extends StatefulWidget {
  final String category;
  final List<ListItem> items;
  final bool isTemplate;
  final bool isEditing;
  final void Function(int id) onDelete;
  final void Function(int id, Map<String, dynamic> toUpdate) onChange;
  final void Function(String name) onChangeCategoryName;
  final void Function(String name, String category) onAddItem;
  final void Function(ListItem item, {int indexInCategory}) onItemDropped;

  const CategoryList({
    super.key,
    required this.category,
    required this.items,
    required this.isTemplate,
    required this.isEditing,
    required this.onDelete,
    required this.onChange,
    required this.onChangeCategoryName,
    required this.onAddItem,
    required this.onItemDropped,
  });

  @override
  State<CategoryList> createState() => _CategoryListState();
}

class _CategoryListState extends State<CategoryList> {
  bool isExpanded = true;
  late String categoryName;
  bool isDraggingOver = false;

  @override
  void initState() {
    super.initState();
    categoryName = widget.category;
  }

  void toggleExpanded() {
    setState(() {
      isExpanded = !isExpanded;
    });
  }

  void handleCategoryNameChange(String name) {
    setState(() {
      categoryName = name;
    });
    widget.onChangeCategoryName(name);
  }

  @override
  Widget build(BuildContext context) {
    if (widget.items.isEmpty && !widget.isEditing) {
      return Container();
    }

    final List<Widget> displayedItems = [];

    if (widget.isEditing) {
      final newItemPlaceholder = NewCategoryItem(
        onAdd: (name) => widget.onAddItem(name, widget.category),
      );
      displayedItems.add(newItemPlaceholder);
    }

    if (isDraggingOver) {
      displayedItems.add(const ItemPlaceholder());
    }

    if (isExpanded || widget.isEditing) {
      displayedItems.addAll(
        widget.items.asMap().map(
          (index, item) {
            return MapEntry(
              index,
              CategoryItem(
                key: Key(item.id.toString()),
                item: item,
                onDelete: widget.onDelete,
                onChange: widget.onChange,
                canBeCompleted: !widget.isTemplate,
                isEditing: widget.isEditing,
                onItemDropped: (item) => widget.onItemDropped(
                  item,
                  indexInCategory: index,
                ),
              ),
            );
          },
        ).values,
      );
    }

    return DragTarget<ListItem>(
      builder: (context, candidateData, rejectedData) {
        return Column(
          children: [
            CategoryName(
              name: categoryName,
              isExpanded: isExpanded,
              isEditing: categoryName.isNotEmpty ? widget.isEditing : false,
              onToggleExpand: toggleExpanded,
              onChange: handleCategoryNameChange,
            ),
            ...displayedItems,
          ],
        );
      },
      onAccept: (item) {
        setState(() {
          isDraggingOver = false;
        });
        widget.onItemDropped(item);
      },
      onMove: (details) => setState(() {
        isDraggingOver = true;
      }),
      onLeave: (item) => setState(() {
        isDraggingOver = false;
      }),
    );
  }
}
