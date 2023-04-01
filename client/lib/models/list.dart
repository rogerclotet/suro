import 'package:familia/models/list_item.dart';

class FamilyList {
  final int id;
  final String name;
  final String description;
  final bool isTemplate;
  final bool isFavorite;
  final List<ListItem> items;
  final DateTime? updatedAt;

  const FamilyList({
    required this.id,
    required this.name,
    required this.description,
    this.isTemplate = false,
    this.isFavorite = false,
    required this.items,
    this.updatedAt,
  });

  FamilyList copyWith({
    int? id,
    String? name,
    String? description,
    bool? isTemplate,
    bool? isFavorite,
    List<ListItem>? items,
    DateTime? updatedAt,
  }) {
    return FamilyList(
      id: id ?? this.id,
      name: name ?? this.name,
      description: description ?? this.description,
      isTemplate: isTemplate ?? this.isTemplate,
      isFavorite: isFavorite ?? this.isFavorite,
      items: items ?? this.items,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  factory FamilyList.fromMap(Map<String, dynamic> json) {
    return FamilyList(
      id: json['id'],
      name: json['name'],
      description: json['description'],
      isTemplate: json['is_template'],
      isFavorite: json['is_favorite'],
      items: List<Map<String, dynamic>>.from(json['items'])
          .map(
            (item) => ListItem.fromMap(item),
          )
          .toList(),
      updatedAt: DateTime.parse(json['updated_at']),
    );
  }

  void sortItems() {
    items.sort((a, b) {
      if (a.isComplete && !b.isComplete) {
        return 1;
      }
      if (b.isComplete && !a.isComplete) {
        return -1;
      }

      var orderScore = b.order - a.order;
      if (orderScore != 0) {
        return orderScore;
      }

      return a.id - b.id;
    });
  }
}
