import 'dart:developer';

class ListItem {
  final int id;
  String name;
  String category;
  int order;
  bool isComplete;

  ListItem({
    required this.id,
    required this.name,
    required this.category,
    required this.order,
    this.isComplete = false,
  });

  void patch(Map<String, dynamic> toUpdate) {
    for (final entry in toUpdate.entries) {
      switch (entry.key) {
        case 'name':
          name = entry.value;
          break;
        case 'category':
          category = entry.value;
          break;
        case 'order':
          order = entry.value;
          break;
        case 'isComplete':
          isComplete = entry.value;
          break;
        default:
          log('Patching item with unknown field: ${entry.key}');
      }
    }
  }

  factory ListItem.fromJson(Map<String, dynamic> json) {
    return ListItem(
      id: json['id'],
      name: json['name'],
      category: json['category'],
      order: json['order'],
      isComplete: json['is_complete'],
    );
  }
}
