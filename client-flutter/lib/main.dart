import 'package:familia/auth/auth.dart';
import 'package:familia/auth/login_screen.dart';
import 'package:familia/families/family_settings_screen.dart';
import 'package:familia/lists/lists_screen.dart';
import 'package:familia/client.dart';
import 'package:familia/lists/lists_state.dart';
import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
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

Map<String, WidgetBuilder> authRoutes = {
  ListsScreen.routeName: (_) => const ListsScreen(),
  FamilySettingsScreen.routeName: (_) => const FamilySettingsScreen(),
};

class FamilyApp extends StatefulWidget {
  const FamilyApp({super.key});

  @override
  State<FamilyApp> createState() => _FamilyAppState();
}

class _FamilyAppState extends State<FamilyApp> {
  bool isInitializing = true;

  final auth = Auth(storage);
  late final authClient = AuthClient(auth);
  late final familiesState = FamiliesState(authClient);
  late final listsState = ListsState(authClient, familiesState);

  @override
  void initState() {
    super.initState();

    auth.initialize().then(
      (value) {
        if (auth.isLoggedIn) {
          familiesState.initialize();
        }

        setState(() {
          isInitializing = false;
        });
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    const primaryColor = Colors.teal;

    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => auth),
        ListenableProvider(create: (_) => authClient),
        ChangeNotifierProvider(create: (_) => familiesState),
        ChangeNotifierProvider(create: (_) => listsState),
      ],
      child: Consumer<Auth>(
        builder: (context, auth, child) {
          return MaterialApp(
            title: 'Família',
            theme: ThemeData(
              colorScheme: ColorScheme.fromSwatch(
                primarySwatch: primaryColor,
                brightness: WidgetsBinding.instance.window.platformBrightness,
              ),
              appBarTheme: const AppBarTheme(
                backgroundColor: primaryColor,
              ),
              useMaterial3: true,
            ),
            home: isInitializing
                ? Scaffold(
                    appBar: AppBar(
                      title: const Text('Família'),
                    ),
                    body: const Center(
                      child: CircularProgressIndicator(),
                    ),
                  )
                : auth.isLoggedIn
                    ? const ListsScreen()
                    : const LoginScreen(),
            routes: isInitializing
                ? {}
                : auth.isLoggedIn
                    ? authRoutes
                    : {},
          );
        },
      ),
    );
  }
}
