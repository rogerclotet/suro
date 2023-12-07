import 'dart:async';
import 'dart:convert';
import 'package:familia/client.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

const refreshKey = 'refresh';

class Auth with ChangeNotifier {
  FlutterSecureStorage storage;
  bool isInitialized = false;

  String? _accessToken;
  String? _refreshToken;

  Auth(this.storage);

  bool get isLoggedIn {
    return _accessToken != null;
  }

  String get token {
    return _accessToken != null ? _accessToken! : '';
  }

  Future<void> initialize() async {
    String? storedRefreshToken = await storage.read(key: refreshKey);

    if (storedRefreshToken != null) {
      _refreshToken = storedRefreshToken;

      await refresh();
    }

    isInitialized = true;
    notifyListeners();
  }

  Future<void> login(String email, String password) async {
    final res = await AnonymousClient.login(email: email, password: password);
    final data = jsonDecode(res.body);
    _accessToken = data['access'];
    _refreshToken = data['refresh'];

    storage.write(key: refreshKey, value: _refreshToken);

    notifyListeners();
  }

  Future<void> refresh() async {
    final res = await AnonymousClient.refresh(token: _refreshToken);
    if (res.statusCode == 200) {
      final data = jsonDecode(res.body);
      _accessToken = data['access'];

      notifyListeners();
    }
  }

  Future<void> logout() async {
    _accessToken = null;
    _refreshToken = null;

    storage.delete(key: refreshKey);

    notifyListeners();
  }
}
