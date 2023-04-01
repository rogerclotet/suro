import 'dart:developer';

import 'package:familia/lists/list_details/editable_category_item.dart';
import 'package:familia/lists/list_details/item_placeholder.dart';
import 'package:flutter/material.dart';

import '../../models/list_item.dart';

class CategoryItem extends StatefulWidget {
  final ListItem item;
  final void Function(int id) onDelete;
  final void Function(int id, Map<String, dynamic> toUpdate) onChange;
  final bool canBeCompleted;
  final bool isEditing;
  final void Function(ListItem item) onItemDropped;

  const CategoryItem({
    required this.item,
    required this.onDelete,
    required this.onChange,
    required this.canBeCompleted,
    required this.isEditing,
    required this.onItemDropped,
    super.key,
  });

  @override
  State<CategoryItem> createState() => _CategoryItemState();
}

class _CategoryItemState extends State<CategoryItem> {
  bool isDraggingOver = false;

  void handleItemNameChange(ListItem item, String newName) {
    widget.onChange(item.id, {'name': newName});
  }

  @override
  Widget build(BuildContext context) {
    if (widget.isEditing) {
      return EditableCategoryItem(
        item: widget.item,
        onChange: (String newName) =>
            handleItemNameChange(widget.item, newName),
      );
    } else {
      return DragTarget<ListItem>(
        builder: (context, candidateData, rejectedData) {
          return Column(
            children: [
              LongPressDraggable(
                dragAnchorStrategy: childDragAnchorStrategy,
                axis: Axis.vertical,
                feedbackOffset: const Offset(0, -16),
                feedback: Container(
                  decoration: BoxDecoration(
                    color: Theme.of(context).cardColor,
                    borderRadius: BorderRadius.circular(4),
                  ),
                  width: MediaQuery.of(context).size.width,
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Text(
                      widget.item.name,
                      style: Theme.of(context).textTheme.bodyLarge,
                    ),
                  ),
                ),
                data: widget.item,
                childWhenDragging: Container(),
                child: Dismissible(
                  key: Key('${widget.item.id}'),
                  onDismissed: (direction) => widget.onDelete(widget.item.id),
                  background: Container(color: Colors.deepOrange[900]),
                  child: ListTile(
                    contentPadding: const EdgeInsets.only(left: 16, right: 2),
                    title: Text(
                      widget.item.name,
                      style: widget.item.isComplete
                          ? TextStyle(
                              decoration: TextDecoration.lineThrough,
                              decorationColor: Theme.of(context)
                                  .textTheme
                                  .bodyLarge!
                                  .color!
                                  .withOpacity(0.4),
                              color: Theme.of(context)
                                  .textTheme
                                  .bodyLarge!
                                  .color!
                                  .withOpacity(0.5),
                            )
                          : null,
                    ),
                    trailing: widget.canBeCompleted
                        ? Checkbox(
                            value: widget.item.isComplete,
                            onChanged: (value) {
                              widget.onChange(widget.item.id,
                                  {'is_complete': value != false});
                            },
                          )
                        : const SizedBox(
                            height: 0,
                            width: 0,
                          ),
                  ),
                ),
              ),
              ...isDraggingOver ? [const ItemPlaceholder()] : [],
            ],
          );
        },
        onAccept: (item) {
          setState(() {
            isDraggingOver = false;
          });
          if (item.id != widget.item.id) {
            widget.onItemDropped(item);
          }
        },
        onMove: (details) {
          setState(() {
            isDraggingOver = true;
          });
        },
        onLeave: (item) {
          setState(() {
            isDraggingOver = false;
          });
        },
      );
    }
  }
}
