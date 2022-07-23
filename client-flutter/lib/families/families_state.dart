import 'package:familia/client.dart';
import 'package:familia/models/family.dart';
import 'package:flutter/cupertino.dart';
import 'package:shared_preferences/shared_preferences.dart';

const currentFamilyIdKey = 'currentFamilyId';

class FamiliesState with ChangeNotifier {
  final AuthClient _client;

  FamiliesState(this._client);

  List<Family>? _families;
  int? _currentFamilyId;

  Future<void> initialize() async {
    final prefs = await SharedPreferences.getInstance();

    _currentFamilyId = prefs.getInt(currentFamilyIdKey);

    await refresh();
  }

  List<Family> get families {
    if (_families == null) {
      return [];
    }

    return [..._families!];
  }

  Family? get currentFamily {
    if (_currentFamilyId == null) {
      return null;
    }

    return _families?.firstWhere((family) => family.id == _currentFamilyId);
  }

  void selectFamily(int familyId) {
    if (_families?.indexWhere((family) => family.id == familyId) != -1) {
      _currentFamilyId = familyId;
      _storeCurrentFamilyId();

      notifyListeners();
    }
  }

  void _storeCurrentFamilyId() async {
    final prefs = await SharedPreferences.getInstance();

    if (_currentFamilyId == null) {
      prefs.remove(currentFamilyIdKey);
    } else {
      prefs.setInt(currentFamilyIdKey, _currentFamilyId!);
    }
  }

  Future<void> refresh() async {
    final families = await _client.families();

    _families = families;

    if (families.isEmpty) {
      _currentFamilyId = null;
    } else if (_currentFamilyId == null ||
        families.indexWhere((family) => family.id == _currentFamilyId) == -1) {
      _currentFamilyId = families[0].id;
      _storeCurrentFamilyId();
    }

    notifyListeners();
  }
}
