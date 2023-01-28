String get baseUrl {
  bool isProd = const bool.fromEnvironment('dart.vm.product');
  if (isProd) {
    return 'https://familia.clotet.dev';
  }

  return "http://10.0.2.2:8000";
}
