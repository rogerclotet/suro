import 'dart:developer';

import 'package:familia/auth/auth.dart';
import 'package:familia/auth/login_screen.dart';
import 'package:familia/families/families_state.dart';
import 'package:familia/families/family_settings_screen.dart';
import 'package:familia/lists/list_details/list_detail_screen.dart';
import 'package:familia/lists/lists_screen.dart';
import 'package:familia/lists/templates_screen.dart';
import 'package:familia/loading_screen.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

List<GoRoute> routes(Auth auth, FamiliesState familiesState) {
  return [
    GoRoute(
      name: 'home',
      path: '/',
      redirect: (BuildContext context, GoRouterState state) async {
        if (!auth.isLoggedIn) {
          if (state.subloc != '/login') {
            log("Redirecting to login");
            return '/login';
          }
        }

        log("Not redirecting");
        return null;

        // if (familiesState.currentFamily != null) {
        //   final expectedRoute = '/f/${familiesState.currentFamily!.id}/l';
        //   if (state.subloc != expectedRoute) {
        //     log("Redirecting to family $expectedRoute ${state.subloc}");
        //     return expectedRoute;
        //   }
        // }

        // log("Not redirecting while logged in");
        // return null;
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
