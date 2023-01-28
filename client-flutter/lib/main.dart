import 'package:dynamic_color/dynamic_color.dart';
import 'package:familia/auth/auth.dart';
import 'package:familia/auth/login_screen.dart';
import 'package:familia/client.dart';
import 'package:familia/families/global_state.dart';
import 'package:familia/lists/lists_screen.dart';
import 'package:familia/lists/lists_state.dart';
import 'package:familia/routes.dart';
import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:go_router/go_router.dart';
import 'package:logging/logging.dart';
import 'package:provider/provider.dart';
import 'package:flutter_web_plugins/url_strategy.dart';

import 'families/families_state.dart';

const _defaultColor = Color.fromARGB(255, 61, 195, 126);

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
  brightness: WidgetsBinding.instance.window.platformBrightness,
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
        } else if (GoRouterState.of(context).queryParams.containsKey("to")) {
          router.pushReplacement(GoRouterState.of(context).queryParams["to"]!);
        } else {
          router.pushReplacementNamed(
            ListsScreen.routeName,
            params: {
              'fid': familiesState.currentFamily!.id.toString(),
            },
          );
        }
      });
    } else {
      router.pushReplacementNamed(
        LoginScreen.routeName,
        queryParams: {"to": router.location},
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
      child: DynamicColorBuilder(
        builder: (ColorScheme? lightDynamic, ColorScheme? darkDynamic) {
          ColorScheme lightColorScheme;
          ColorScheme darkColorScheme;

          if (lightDynamic != null && darkDynamic != null) {
            // On Android S+ devices, use the provided dynamic color scheme.
            // Harmonize the dynamic color scheme' built-in semantic colors.
            lightColorScheme = lightDynamic.harmonized();
            darkColorScheme = darkDynamic.harmonized();
          } else {
            // Otherwise, use fallback schemes.
            lightColorScheme = ColorScheme.fromSeed(
              seedColor: _defaultColor,
            );
            darkColorScheme = ColorScheme.fromSeed(
              seedColor: _defaultColor,
              brightness: Brightness.dark,
            );
          }
          return Consumer<Auth>(
            builder: (context, auth, child) {
              return MaterialApp.router(
                routeInformationParser: router.routeInformationParser,
                routeInformationProvider: router.routeInformationProvider,
                routerDelegate: router.routerDelegate,
                title: 'Família',
                themeMode: ThemeMode.system,
                theme: ThemeData(
                  colorScheme: lightColorScheme,
                  useMaterial3: true,
                ),
                darkTheme: ThemeData(
                  colorScheme: darkColorScheme,
                  useMaterial3: true,
                ),
              );
            },
          );
        },
      ),
    );
  }
}
