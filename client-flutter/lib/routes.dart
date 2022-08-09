import 'package:familia/auth/login_screen.dart';
import 'package:familia/families/families_state.dart';
import 'package:familia/families/family_settings_screen.dart';
import 'package:familia/lists/list_details/list_detail_screen.dart';
import 'package:familia/lists/lists_screen.dart';
import 'package:familia/lists/templates_screen.dart';
import 'package:familia/loading_screen.dart';
import 'package:go_router/go_router.dart';

List<GoRoute> routes(FamiliesState familiesState) {
  return [
    GoRoute(
      name: 'home',
      path: '/',
      redirect: (state) {
        if (familiesState.currentFamily != null) {
          return '/f/${familiesState.currentFamily!.id}/l';
        }

        return '/login';
      },
      routes: [
        GoRoute(
          name: FamilySettingsScreen.routeName,
          path: 'f/:fid',
          builder: (context, state) => FamilySettingsScreen(
            familyId: int.parse(state.params['fid']!),
          ),
          routes: [
            GoRoute(
              name: ListsScreen.routeName,
              path: 'l',
              builder: (context, state) => const ListsScreen(),
              routes: [
                GoRoute(
                  name: ListDetailScreen.listRouteName,
                  path: ':lid',
                  builder: (context, state) => ListDetailScreen(
                    listId: int.parse(state.params['lid']!),
                  ),
                ),
              ],
            ),
            GoRoute(
              name: TemplatesScreen.routeName,
              path: 't',
              builder: (context, state) => const TemplatesScreen(),
              routes: [
                GoRoute(
                  name: ListDetailScreen.templateRouteName,
                  path: ':lid',
                  builder: (context, state) => ListDetailScreen(
                    listId: int.parse(state.params['lid']!),
                  ),
                ),
              ],
            ),
          ],
        ),
      ],
    ),
    GoRoute(
      name: LoginScreen.routeName,
      path: '/login',
      builder: (context, state) => const LoginScreen(),
    ),
    GoRoute(
      name: LoadingScreen.routeName,
      path: '/loading',
      builder: (context, state) => const LoadingScreen(),
    ),
  ];
}
