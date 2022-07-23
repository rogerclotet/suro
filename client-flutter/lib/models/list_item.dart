class ListItem {
  final int id;
  final String name;
  final String category;
  bool isComplete;

  ListItem({
    required this.id,
    required this.name,
    required this.category,
    this.isComplete = false,
  });

  factory ListItem.fromJson(Map<String, dynamic> json) {
    return ListItem(
      id: json['id'],
      name: json['name'],
      category: json['category'],
      isComplete: json['is_complete'],
    );
  }
}
