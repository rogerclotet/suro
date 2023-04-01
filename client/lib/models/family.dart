import 'family_member.dart';

class Family {
  int id;
  String name;
  List<FamilyMember> members;

  Family({
    required this.id,
    required this.name,
    required this.members,
  });

  factory Family.fromJson(Map<String, dynamic> json) {
    return Family(
      id: json['id'],
      name: json['name'],
      members: List<Map<String, dynamic>>.from(json['members'])
          .map(
            (member) => FamilyMember.fromJson(member),
          )
          .toList(),
    );
  }
}
