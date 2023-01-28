bool get isRelease {
  return const bool.fromEnvironment('dart.vm.product');
}

String get baseUrl {
  if (isRelease) {
    return 'https://api.familia.clotet.dev';
  }

  return 'http://10.0.2.2:8000';
}
