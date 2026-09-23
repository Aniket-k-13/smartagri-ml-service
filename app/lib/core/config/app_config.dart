/// Single source of truth for environment config.
/// Never hardcode a URL anywhere else in the app — read it from here.
class AppConfig {
  AppConfig._();

  // IMPORTANT: this is a Cloudflare quick tunnel (trycloudflare.com).
  // These URLs are EPHEMERAL — they regenerate every time Person 1 restarts
  // `cloudflared`, so this exact value WILL eventually stop working again
  // (this is the THIRD url so far). Ask Person 1 to add DJANGO_ALLOWED_HOSTS
  // with a wildcard (".trycloudflare.com") server-side so future tunnel
  // restarts don't also require a code change here. When the URL changes,
  // either edit the defaultValue below, or override at run time:
  //   flutter run --dart-define=API_BASE_URL=https://<new-subdomain>.trycloudflare.com/api
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://lying-lodge-owner-gore.trycloudflare.com/api',
  );

  static const Duration connectTimeout = Duration(seconds: 15);
  static const Duration receiveTimeout = Duration(seconds: 20);
}
