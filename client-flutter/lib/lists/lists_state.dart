import 'package:familia/client.dart';
import 'package:familia/families/families_state.dart';
import 'package:familia/models/list.dart';
import 'package:familia/models/list_item.dart';
import 'package:flutter/material.dart';

const currentFamilyIdKey = 'currentFamilyId';

class ListNotFoundException implements Exception {
  int listId;
  ListNotFoundException(this.listId);
}

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
  final AuthClient _client;
  final FamiliesState _familiesState;
  int? _currentFamilyId;

  List<FamilyList>? _lists;

  ListsState(this._client, this._familiesState);

  void familiesStateChanged() {
    if (_familiesState.currentFamily?.id == _currentFamilyId) {
      return;
    }

    _currentFamilyId = _familiesState.currentFamily?.id;

    _lists = null;
    notifyListeners();

    refresh();
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

  FamilyList list(int listId) {
    final index = _lists?.indexWhere(
      (list) => list.id == listId,
    );

    if (index == null || index == -1) {
      throw ListNotFoundException(listId);
    }

    return _lists![index];
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

    _client.createList(_familiesState.currentFamily!.id, list).then((created) {
      _removeList(list);
      _setList(created);
    }, onError: (error) {
      _removeList(list);

      // TODO display snackbar
      logger.warning('Error creating list: $error');
    }).whenComplete(notifyListeners);
  }

  void editList(int id, String name, String description) {
    final list = _lists!.firstWhere((l) => l.id == id);
    final index = _lists!.indexOf(list);

    _lists![index] = list.copyWith(name: name, description: description);
    notifyListeners();

    _client.patchList(
      _familiesState.currentFamily!.id,
      id,
      {'name': name, 'description': description},
    ).then((edited) {
      _lists![index] = edited;
      notifyListeners();
    }, onError: (error) {
      _lists![index] = list;

      // TODO display snackbar
      logger.warning('Error editing list: $error');

      notifyListeners();
    });
  }

  void toggleFavorite(FamilyList list) {
    final index = _lists!.indexOf(list);
    _lists![index] = _lists![index].copyWith(isFavorite: !list.isFavorite);
    notifyListeners();

    _client.patchList(
      _familiesState.currentFamily!.id,
      list.id,
      {'is_favorite': !list.isFavorite},
    ).then((edited) {
      // TODO display snackbar
    }, onError: (error) {
      _lists![index] = list;

      // TODO display snackbar
      logger.warning('Error toggling favorite: $error');

      notifyListeners();
    });
  }

  void delete(FamilyList list) {
    _lists!.remove(list);
    notifyListeners();

    _client.deleteList(_familiesState.currentFamily!.id, list.id).catchError(
      (error) {
        _lists!.add(list);

        // TODO display snackbar
        logger.warning('Error toggling favorite: $error');

        notifyListeners();
      },
    );
  }

  void addItem(int listId, String name, String category) async {
    final currentFamilyId = _familiesState.currentFamily!.id;
    final list = lists.firstWhere((l) => l.id == listId);
    final item = ListItem(
      id: -1,
      name: name,
      category: category,
    );

    list.items.add(item);
    list.sortItems();
    notifyListeners();

    try {
      final newItem = await _client.createItem(
        currentFamilyId,
        listId,
        item.name,
        item.category,
      );

      refresh();
    } catch (error) {
      // TODO display snackbar
      logger.warning('Error creating item: $error');

      refresh();
    }
  }

  void editItem(int listId, int itemId, Map<String, dynamic> toUpdate) async {
    final currentFamilyId = _familiesState.currentFamily!.id;
    final list = lists.firstWhere((l) => l.id == listId);
    final item = list.items.firstWhere((i) => i.id == itemId);

    item.patch(toUpdate);

    try {
      final item = await _client.patchItem(
        currentFamilyId,
        listId,
        itemId,
        toUpdate,
      );

      final index = list.items.indexWhere((i) => i.id == itemId);
      list.items[index] = item;
      list.sortItems();
      notifyListeners();
    } catch (error) {
      // TODO display snackbar
      logger.warning('Error editing item: $error');

      await refresh();
      list.sortItems();
      notifyListeners();
    }
  }

  Future<void> deleteItem(int listId, int itemId) async {
    final currentFamilyId = _familiesState.currentFamily!.id;
    final list = lists.firstWhere((l) => l.id == listId);
    final item = list.items.firstWhere((i) => i.id == itemId);

    list.items.remove(item);
    notifyListeners();

    try {
      await _client.deleteItem(currentFamilyId, listId, itemId);
    } catch (error) {
      // TODO display snackbar
      logger.warning('Error deleting item: $error');
    }

    refresh();
  }

  void changeCategoryName(
    int listId,
    Iterable<ListItem> items,
    String newName,
    String oldName,
    ScaffoldMessengerState messenger, {
    bool isRevert = false,
  }) async {
    final currentFamilyId = _familiesState.currentFamily!.id;

    try {
      final updatedList = await _client.changeCategoryName(
        currentFamilyId,
        listId,
        items,
        newName,
      );

      updatedList.sortItems();

      final index = lists.indexWhere((l) => l.id == listId);
      _lists![index] = updatedList;

      notifyListeners();
    } catch (error) {
      // TODO display snackbar
      logger.warning('Error changing category name: $error');
      refresh();
      return;
    }

    if (isRevert) {
      // Reverting succeeded, we don't want any user feedback
      return;
    }

    messenger.showSnackBar(
      SnackBar(
        content: Text(
          'Nom de la categoria canviat: ${newName == '' ? 'Sense categoria' : newName}',
        ),
        action: SnackBarAction(
          label: 'Desfer',
          onPressed: () {
            changeCategoryName(listId, items, oldName, newName, messenger);
          },
        ),
      ),
    );
  }

  Future<void> refresh() async {
    final currentFamilyId = _familiesState.currentFamily?.id;
    if (currentFamilyId == null) {
      return;
    }

    final lists = await _client.lists(currentFamilyId);

    _lists = lists;

    notifyListeners();
  }
}
