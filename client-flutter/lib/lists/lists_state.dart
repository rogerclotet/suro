import 'package:familia/client.dart';
import 'package:familia/families/families_state.dart';
import 'package:familia/models/list.dart';
import 'package:flutter/cupertino.dart';

const currentFamilyIdKey = 'currentFamilyId';

int favoriteSort(FamilyList a, FamilyList b) {
  if (a.isFavorite == b.isFavorite) {
    return 0;
  }

  return a.isFavorite ? -1 : 1;
}

int defaultSort(FamilyList a, FamilyList b) {
  int fSort = favoriteSort(a, b);

  if (fSort != 0) {
    return fSort;
  }

  if (a.updatedAt == null) {
    return -1;
  }

  if (b.updatedAt == null) {
    return 1;
  }

  return a.updatedAt!.isBefore(b.updatedAt!) ? 1 : -1;
}

class ListsState with ChangeNotifier {
  final AuthClient client;
  final FamiliesState familiesState;

  List<FamilyList>? _lists;

  ListsState(this.client, this.familiesState) {
    familiesState.addListener(() {
      refresh();
    });
  }

  bool get isLoading {
    return _lists == null;
  }

  List<FamilyList> get lists {
    if (_lists == null) {
      return [];
    }

    var lists = _lists!.where((list) => !list.isTemplate).toList();
    lists.sort(defaultSort);

    return lists;
  }

  List<FamilyList> get templates {
    if (_lists == null) {
      return [];
    }

    var templates = _lists!.where((list) => list.isTemplate).toList();
    templates.sort(defaultSort);

    return templates;
  }

  void _setList(FamilyList list) {
    if (_lists == null) {
      return;
    }

    final index = _lists!.indexWhere((l) => l.id == list.id);

    if (index == -1) {
      _lists!.add(list);
    } else {
      _lists![index] = list;
    }
  }

  void _removeList(FamilyList list) {
    _lists?.remove(list);
  }

  void createList(FamilyList list) {
    _setList(list);
    notifyListeners();

    client.createList(familiesState.currentFamily!.id, list).then((created) {
      _removeList(list);
      _setList(created);
    }, onError: (error) {
      _removeList(list);
      // TODO display snackbar
      logger.warning("Error creating list: $error");
    }).whenComplete(notifyListeners);
  }

  void toggleFavorite(FamilyList list) {
    final index = _lists!.indexOf(list);
    _lists![index] = _lists![index].copyWith(isFavorite: !list.isFavorite);
    notifyListeners();

    client.patchList(
      familiesState.currentFamily!.id,
      list.id,
      {"is_favorite": !list.isFavorite},
    ).then((edited) {
      // TODO display snackbar
    }, onError: (error) {
      _lists![index] = list;
      // TODO display snackbar
      logger.warning("Error toggling favorite: $error");

      notifyListeners();
    });
  }

  Future<void> refresh() async {
    final currentFamilyId = familiesState.currentFamily?.id;
    if (currentFamilyId == null) {
      return;
    }

    final lists = await client.lists(currentFamilyId);

    _lists = lists;

    notifyListeners();
  }
}
