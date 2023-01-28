class ListItem {
  final int id;
  final String name;
  final String category;
  final int order;
  bool isComplete;

  ListItem({
    required this.id,
    required this.name,
    required this.category,
    required this.order,
    this.isComplete = false,
  });

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
