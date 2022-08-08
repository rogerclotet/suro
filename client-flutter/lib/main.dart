import 'package:dynamic_color/dynamic_color.dart';
import 'package:familia/auth/auth.dart';
import 'package:familia/auth/login_screen.dart';
import 'package:familia/client.dart';
import 'package:familia/lists/lists_screen.dart';
import 'package:familia/lists/lists_state.dart';
import 'package:familia/routes.dart';
import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:go_router/go_router.dart';
import 'package:logging/logging.dart';
import 'package:provider/provider.dart';

import 'families/families_state.dart';

void main() {
  Logger.root.level = Level.ALL; // defaults to Level.INFO
  Logger.root.onRecord.listen((record) {
    print('${record.level.name}: ${record.time}: ${record.message}');
  });

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
  final auth = Auth(storage);
  late final authClient = AuthClient(auth);
  late final familiesState = FamiliesState(authClient);
  late final listsState = ListsState(authClient, familiesState);
  late final router = GoRouter(
    debugLogDiagnostics: true,
    routes: routes(familiesState),
    initialLocation: '/loading',
    urlPathStrategy: UrlPathStrategy.path,
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
        router.replaceNamed(
          ListsScreen.routeName,
          params: {
            'fid': familiesState.currentFamily!.id.toString(),
          },
        );
      });
    } else {
      router.replaceNamed(LoginScreen.routeName);
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
        builder: (lightColorScheme, darkColorScheme) {
          return Consumer<Auth>(
            builder: (context, auth, child) {
              final lColorScheme =
                  lightColorScheme?.harmonized() ?? defaultColorScheme;
              final dColorScheme =
                  darkColorScheme?.harmonized() ?? defaultColorScheme;

              return MaterialApp.router(
                routeInformationParser: router.routeInformationParser,
                routeInformationProvider: router.routeInformationProvider,
                routerDelegate: router.routerDelegate,
                title: 'Família',
                themeMode: ThemeMode.system,
                theme: ThemeData(
                  colorScheme: lightColorScheme ?? defaultColorScheme,
                  checkboxTheme: CheckboxThemeData(
                    checkColor: null,
                    fillColor:
                        MaterialStateProperty.all(lColorScheme.secondary),
                  ),
                  useMaterial3: true,
                ),
                darkTheme: ThemeData(
                  colorScheme: darkColorScheme ?? defaultColorScheme,
                  checkboxTheme: CheckboxThemeData(
                    checkColor:
                        MaterialStateProperty.all(dColorScheme.inversePrimary),
                    fillColor: MaterialStateProperty.all(dColorScheme.primary),
                  ),
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
