import 'package:familia/auth/auth.dart';
import 'package:familia/auth/login_screen.dart';
import 'package:familia/client.dart';
import 'package:familia/families/global_state.dart';
import 'package:familia/lists/lists_screen.dart';
import 'package:familia/lists/lists_state.dart';
import 'package:familia/routes.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:go_router/go_router.dart';
import 'package:logging/logging.dart';
import 'package:provider/provider.dart';
import 'package:flutter_web_plugins/url_strategy.dart';

import 'families/families_state.dart';

void main() {
  Logger.root.level = Level.ALL; // defaults to Level.INFO
  Logger.root.onRecord.listen((record) {
    print('${record.level.name}: ${record.time}: ${record.message}');
  });

  usePathUrlStrategy();

  runApp(const FamilyApp());
}

const storage = FlutterSecureStorage(
  aOptions: AndroidOptions(
    encryptedSharedPreferences: true,
  ),
);

class FamilyApp extends StatefulWidget {
  const FamilyApp({super.key});

  @override
  State<FamilyApp> createState() => _FamilyAppState();
}

const primaryColor = Colors.teal;
final defaultColorScheme = ColorScheme.fromSwatch(
  primarySwatch: primaryColor,
  brightness: PlatformDispatcher.instance.platformBrightness,
);

class _FamilyAppState extends State<FamilyApp> {
  final globalState = GlobalState();
  final auth = Auth(storage);
  late final authClient = AuthClient(auth);
  late final familiesState = FamiliesState(authClient);
  late final listsState = ListsState(authClient, familiesState);
  late final router = GoRouter(
    debugLogDiagnostics: true,
    routes: routes(auth, familiesState, globalState),
    initialLocation: '/loading',
  );
  bool? wasLoggedIn;

  @override
  void initState() {
    super.initState();

    auth.addListener(onAuthChanged);
    familiesState.addListener(listsState.familiesStateChanged);

    auth.initialize();
  }

  void onAuthChanged() {
    if (auth.isLoggedIn == wasLoggedIn) {
      return;
    }

    wasLoggedIn = auth.isLoggedIn;

    if (auth.isLoggedIn) {
      familiesState.initialize().then((_) {
        if (globalState.initialRoute != null) {
          router.pushReplacement(globalState.initialRoute!);
        } else {
          router.pushReplacementNamed(
            ListsScreen.routeName,
            pathParameters: {
              'fid': familiesState.currentFamily!.id.toString(),
            },
          );
        }
      });
    } else {
      Map<String, dynamic> queryParams = {};
      if (GoRouterState.of(context).fullPath != '/') {
        queryParams['to'] = GoRouterState.of(context).fullPath;
      }
      router.pushReplacementNamed(
        LoginScreen.routeName,
        queryParameters: queryParams,
      );
    }
  }

  @override
  void dispose() {
    auth.removeListener(onAuthChanged);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
        providers: [
          ChangeNotifierProvider(create: (_) => auth),
          ListenableProvider(create: (_) => authClient),
          ChangeNotifierProvider(create: (_) => familiesState),
          ChangeNotifierProvider(create: (_) => listsState),
        ],
        child: MaterialApp.router(
          routeInformationParser: router.routeInformationParser,
          routeInformationProvider: router.routeInformationProvider,
          routerDelegate: router.routerDelegate,
          title: 'Família',
          theme: ThemeData(
            colorScheme: ColorScheme.fromSeed(seedColor: Colors.teal),
            brightness: PlatformDispatcher.instance.platformBrightness,
          ),
        ));
  }
}
