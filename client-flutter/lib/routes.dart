import 'package:familia/auth/login_screen.dart';
import 'package:familia/families/families_state.dart';
import 'package:familia/families/family_settings_screen.dart';
import 'package:familia/lists/edit_list_screen.dart';
import 'package:familia/lists/list_detail_screen.dart';
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
                  name: EditListScreen.newListRouteName,
                  path: 'new',
                  builder: (context, state) => const EditListScreen(
                    isTemplate: false,
                  ),
                ),
                GoRoute(
                  name: ListDetailScreen.listRouteName,
                  path: ':lid',
                  builder: (context, state) => ListDetailScreen(
                    listId: int.parse(state.params['lid']!),
                  ),
                  routes: [
                    GoRoute(
                      name: EditListScreen.listRouteName,
                      path: 'edit',
                      builder: (context, state) => EditListScreen(
                        listId: int.parse(state.params['lid']!),
                        isTemplate: false,
                      ),
                    ),
                  ],
                ),
              ],
            ),
            GoRoute(
              name: TemplatesScreen.routeName,
              path: 't',
              builder: (context, state) => const TemplatesScreen(),
              routes: [
                GoRoute(
                  name: EditListScreen.newTemplateRouteName,
                  path: 'new',
                  builder: (context, state) => const EditListScreen(
                    isTemplate: true,
                  ),
                ),
                GoRoute(
                  name: ListDetailScreen.templateRouteName,
                  path: ':lid',
                  builder: (context, state) => ListDetailScreen(
                    listId: int.parse(state.params['lid']!),
                  ),
                  routes: [
                    GoRoute(
                      name: EditListScreen.templateRouteName,
                      path: 'edit',
                      builder: (context, state) => EditListScreen(
                        listId: int.parse(state.params['lid']!),
                        isTemplate: true,
                      ),
                    ),
                  ],
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
