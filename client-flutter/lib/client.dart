import 'dart:convert';
import 'dart:typed_data';
import 'package:familia/auth/auth.dart';
import 'package:familia/models/list.dart';
import 'package:flutter/cupertino.dart';
import 'package:http/http.dart' as http;
import 'package:http_interceptor/http_interceptor.dart';
import 'package:logging/logging.dart';

import 'models/family.dart';

final logger = Logger('Client');

class ClientException {
  final String msg;

  const ClientException(this.msg);

  @override
  String toString() {
    return msg;
  }
}

const baseUrl = 'https://api.familia.clotet.dev';
const jsonHeader = {'Content-Type': 'application/json'};

class AnonymousClient {
  static Future<http.Response> login({
    required String email,
    required String password,
  }) async {
    final res = await http.post(
      Uri.parse('$baseUrl/token/'),
      body: {'email': email, 'password': password},
    );

    if (res.statusCode != 200) {
      logger.warning('Login: ${res.body}');
      throw const ClientException('Comprova el teu email i contrasenya');
    }

    return res;
  }

  static Future<http.Response> refresh({required token}) async {
    return http.post(
      Uri.parse('$baseUrl/token/refresh/'),
      body: {'refresh': token},
    );
  }
}

class AuthInterceptor extends InterceptorContract {
  Auth auth;

  AuthInterceptor(this.auth);

  @override
  Future<RequestData> interceptRequest({required RequestData data}) async {
    data.headers['Authorization'] = 'Bearer ${auth.token}';
    return data;
  }

  @override
  Future<ResponseData> interceptResponse({required ResponseData data}) async {
    return data;
  }
}

class ExpiredTokenRetryPolicy extends RetryPolicy {
  Auth auth;

  ExpiredTokenRetryPolicy(this.auth);

  @override
  Future<bool> shouldAttemptRetryOnResponse(ResponseData response) async {
    if (response.statusCode != 401) {
      return false;
    }

    await auth.refresh();

    return auth.isLoggedIn;
  }
}

List<T> parseJsonList<T>(Uint8List encoded, Function factory) {
  final decodedBody = jsonDecode(
    utf8.decode(encoded),
  );

  return List<T>.from(
    decodedBody.map(
      (decodedModel) => factory(decodedModel),
    ),
  );
}

T parseJsonObject<T>(Uint8List encoded, Function factory) {
  final decodedBody = jsonDecode(
    utf8.decode(encoded),
  );

  return factory(decodedBody);
}

class AuthClient with ChangeNotifier {
  Auth auth;
  late http.Client client;

  AuthClient(this.auth) {
    client = InterceptedClient.build(
      interceptors: [AuthInterceptor(auth)],
      retryPolicy: ExpiredTokenRetryPolicy(auth),
    );
  }

  Future<List<Family>> families() async {
    final res = await client.get(
      Uri.parse('$baseUrl/families/'),
    );

    return parseJsonList<Family>(res.bodyBytes, Family.fromJson);
  }

  Future<Family> family(int familyId) async {
    final res = await client.get(
      Uri.parse('$baseUrl/families/$familyId/'),
    );

    return parseJsonObject<Family>(res.bodyBytes, Family.fromJson);
  }

  Future<List<FamilyList>> lists(int familyId) async {
    final res = await client.get(
      Uri.parse('$baseUrl/families/$familyId/lists/'),
    );

    return parseJsonList<FamilyList>(res.bodyBytes, FamilyList.fromJson);
  }

  Future<FamilyList> createList(int familyId, FamilyList list) async {
    final res = await client.post(
      Uri.parse('$baseUrl/families/$familyId/lists/'),
      headers: jsonHeader,
      body: jsonEncode({
        "name": list.name,
        "description": list.description,
        "is_template": list.isTemplate,
        "items": list.items.map((item) {
          return {
            "name": item.name,
            "category": item.category,
          };
        }).toList(),
      }),
    );

    if (res.statusCode != 201) {
      throw const ClientException("No s'ha pogut crear la llista");
    }

    return parseJsonObject(res.bodyBytes, FamilyList.fromJson);
  }

  Future<FamilyList> patchList(int familyId, int listId, Object object) async {
    final res = await client.patch(
      Uri.parse('$baseUrl/families/$familyId/lists/$listId/'),
      headers: jsonHeader,
      body: jsonEncode(object),
    );

    if (res.statusCode != 200) {
      throw const ClientException("No s'ha pogut actualitzar la llista");
    }

    return parseJsonObject(res.bodyBytes, FamilyList.fromJson);
  }

  Future<void> deleteList(int familyId, int listId) async {
    final res = await client.delete(
      Uri.parse('$baseUrl/families/$familyId/lists/$listId/'),
    );

    if (res.statusCode != 204) {
      throw const ClientException("No s'ha pogut eliminar la llista");
    }
  }
}
