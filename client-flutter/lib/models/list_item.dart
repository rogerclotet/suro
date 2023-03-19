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
        case 'is_complete':
          isComplete = entry.value;
          break;
        default:
          log('Patching item with unknown field: ${entry.key}');
      }
    }
  }

  factory ListItem.fromMap(Map<String, dynamic> map) {
    return ListItem(
      id: map['id'],
      name: map['name'],
      category: map['category'],
      order: map['order'],
      isComplete: map['is_complete'],
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'name': name,
      'category': category,
      'order': order,
      'is_complete': isComplete,
    };
  }
}
