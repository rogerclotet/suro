class FamilyMember {
  int id;
  String firstName;
  String lastName;

  FamilyMember({
    required this.id,
    required this.firstName,
    required this.lastName,
  });

  factory FamilyMember.fromJson(Map<String, dynamic> json) {
    return FamilyMember(
      id: json['id'],
      firstName: json['first_name'],
      lastName: json['last_name'],
    );
  }
}
