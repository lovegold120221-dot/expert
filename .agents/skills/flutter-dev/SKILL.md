---
name: flutter-dev
description: "Full-stack Flutter app development — architecture, UI, state, routing, networking, serialization, localization, testing, and layout debugging. Use when user asks to: build a Flutter app, create a mobile app with Flutter, develop a cross-platform Flutter UI, implement Flutter state management, set up Flutter navigation/routing, build Flutter forms and screens, connect Flutter to a REST API, add JSON serialization to Flutter models, add localization/internationalization to a Flutter app, write widget/integration tests for Flutter, fix Flutter layout overflow errors, build responsive Flutter layouts, scaffold a new Flutter project, configure Flutter deep linking, implement Flutter MVVM architecture. Also applies to: Dart development, Flutter widget creation, Flutter app architecture, mobile app development with Flutter, cross-platform development, Flutter web apps, Flutter desktop apps. Reference: Official Flutter skills from github.com/lovegold120221-dot/skillsoo-flutter — 10 production-grade development skills."
---

# Flutter App Development

Comprehensive Flutter development patterns adapted from the official Flutter team's agent skills. Covers architecture, UI, routing, networking, data, localization, testing, and layout debugging.

## Flutter Architecture (MVVM + Repository Pattern)

The official Flutter recommendation: strict separation of concerns with three layers.

### Project Structure

```
lib/
├── data/
│   ├── models/          # API models (fromJson/toJson)
│   ├── repositories/    # Single source of truth, returns Domain Models
│   └── services/        # HTTP clients, local DB wrappers, platform plugins
├── domain/              # Optional — only when business logic is complex
│   ├── models/          # Clean domain models
│   └── use_cases/       # Complex/cross-repository business logic
└── ui/
    ├── core/            # Shared widgets, themes, typography, constants
    └── features/
        └── {feature_name}/
            ├── view_models/   # ChangeNotifier — holds UI state
            └── views/         # Lean widgets, no business logic
```

### Architecture Workflow

```
Step 1: Define Domain/API Models (immutable, freezed or manual)
Step 2: Implement Services (stateless API wrappers)
Step 3: Implement Repositories (cache, transform, single source of truth)
Step 4: Optional — Use Cases (complex cross-repository logic)
Step 5: ViewModel (ChangeNotifier, exposes state + commands)
Step 6: View (dumb widget, ListenableBuilder, passes data from ViewModel)
Step 7: Dependency Injection (provider or get_it)
Step 8: Test (unit test ViewModel + Repository)
```

### Example: Repository Pattern

```dart
// Service — raw HTTP
class ApiClient {
  Future<UserApiModel> fetchUser(String id) async { /* http.get */ }
}

// Repository — cached, transforms to domain model
class UserRepository {
  UserRepository({required ApiClient apiClient}) : _apiClient = apiClient;
  final ApiClient _apiClient;
  User? _cachedUser;

  Future<User> getUser(String id) async {
    if (_cachedUser != null) return _cachedUser!;
    final apiModel = await _apiClient.fetchUser(id);
    _cachedUser = User(id: apiModel.id, name: apiModel.fullName);
    return _cachedUser!;
  }
}
```

### Example: ViewModel + View

```dart
class ProfileViewModel extends ChangeNotifier {
  ProfileViewModel({required UserRepository repo}) : _repo = repo;
  final UserRepository _repo;
  User? _user; User? get user => _user;
  bool _isLoading = false; bool get isLoading => _isLoading;

  Future<void> loadProfile(String id) async {
    _isLoading = true; notifyListeners();
    try { _user = await _repo.getUser(id); }
    finally { _isLoading = false; notifyListeners(); }
  }
}

// View — dumb, just renders
class ProfileView extends StatelessWidget {
  const ProfileView({required this.viewModel, super.key});
  final ProfileViewModel viewModel;

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: viewModel,
      builder: (context, _) {
        if (viewModel.isLoading) return const Center(child: CircularProgressIndicator());
        final user = viewModel.user;
        if (user == null) return const Center(child: Text('Not found'));
        return Column(children: [Text(user.name)]);
      },
    );
  }
}
```

## Declarative Routing (go_router)

Use `go_router` with `MaterialApp.router` for URL-based navigation, deep linking, and nested navigation.

### Setup

```bash
flutter pub add go_router
```

### Basic Configuration

```dart
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_web_plugins/url_strategy.dart';

void main() {
  usePathUrlStrategy(); // Removes # from web URLs
  runApp(const MyApp());
}

final GoRouter _router = GoRouter(
  initialLocation: '/',
  routes: [
    GoRoute(
      path: '/',
      builder: (context, state) => const HomeScreen(),
      routes: [
        GoRoute(
          path: 'details/:id',
          builder: (context, state) =>
              DetailsScreen(id: state.pathParameters['id']!),
        ),
      ],
    ),
  ],
  errorBuilder: (context, state) => ErrorScreen(error: state.error),
);

class MyApp extends StatelessWidget {
  const MyApp({super.key});
  @override
  Widget build(BuildContext context) => MaterialApp.router(routerConfig: _router);
}
```

### Bottom Navigation with StatefulShellRoute

```dart
final GoRouter _router = GoRouter(
  initialLocation: '/home',
  routes: [
    StatefulShellRoute.indexedStack(
      builder: (context, state, navigationShell) =>
          ScaffoldWithNavBar(navigationShell: navigationShell),
      branches: [
        StatefulShellBranch(routes: [
          GoRoute(path: '/home', builder: (context, state) => const HomeScreen()),
        ]),
        StatefulShellBranch(routes: [
          GoRoute(path: '/settings', builder: (context, state) => const SettingsScreen()),
        ]),
      ],
    ),
  ],
);

// Shell widget with bottom nav
class ScaffoldWithNavBar extends StatelessWidget {
  const ScaffoldWithNavBar({required this.navigationShell, super.key});
  final StatefulNavigationShell navigationShell;

  void _goBranch(int index) => navigationShell.goBranch(index,
      initialLocation: index == navigationShell.currentIndex);

  @override
  Widget build(BuildContext context) => Scaffold(
    body: navigationShell,
    bottomNavigationBar: NavigationBar(
      selectedIndex: navigationShell.currentIndex,
      onDestinationSelected: _goBranch,
      destinations: const [
        NavigationDestination(icon: Icon(Icons.home), label: 'Home'),
        NavigationDestination(icon: Icon(Icons.settings), label: 'Settings'),
      ],
    ),
  );
}
```

### Navigation Commands

```dart
context.go('/details/123');                 // Replace stack
context.push('/details/123');                // Push onto stack
context.goNamed('details', pathParameters: {'id': '123'});  // Named route
context.pop();                               // Go back
```

## Networking (http package)

### Setup

```bash
flutter pub add http
```

Android: Add `<uses-permission android:name="android.permission.INTERNET" />` to `AndroidManifest.xml`
macOS: Add `<key>com.apple.security.network.client</key><true/>` to entitlements

### Pattern: API Call with Background Parsing

```dart
import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

// Top-level function for Isolate
List<Photo> parsePhotos(String body) {
  final parsed = (jsonDecode(body) as List).cast<Map<String, dynamic>>();
  return parsed.map(Photo.fromJson).toList();
}

Future<List<Photo>> fetchPhotos() async {
  final response = await http.get(
    Uri.parse('https://api.example.com/photos'),
    headers: {HttpHeaders.authorizationHeader: 'Bearer token'},
  );
  if (response.statusCode == 200) {
    return compute(parsePhotos, response.body); // Background Isolate
  }
  throw Exception('Failed: ${response.statusCode}');
}

// UI
FutureBuilder<List<Photo>>(
  future: fetchPhotos(),
  builder: (context, snapshot) {
    if (snapshot.hasData) return ListView(/*...*/);
    if (snapshot.hasError) return Text('Error: ${snapshot.error}');
    return const CircularProgressIndicator();
  },
);
```

## JSON Serialization

### Manual (simple models)

```dart
class User {
  final int id;
  final String name;
  const User({required this.id, required this.name});

  factory User.fromJson(Map<String, dynamic> json) => User(
    id: json['id'] as int,
    name: json['name'] as String,
  );

  Map<String, dynamic> toJson() => {'id': id, 'name': name};
}
```

### Code Generation (complex models)

```yaml
# pubspec.yaml
dependencies:
  json_annotation: ^4.9.0
dev_dependencies:
  json_serializable: ^6.8.0
  build_runner: ^2.4.0
```

```dart
import 'package:json_annotation/json_annotation.dart';
part 'user.g.dart';

@JsonSerializable()
class User {
  final int id;
  final String name;
  const User({required this.id, required this.name});
  factory User.fromJson(Map<String, dynamic> json) => _$UserFromJson(json);
  Map<String, dynamic> toJson() => _$UserToJson(this);
}
```
```bash
dart run build_runner build
```

## Responsive Layout

Flutter's layout rule: **Constraints go down. Sizes go up. Parent sets position.**

### Adaptive Layout with LayoutBuilder

```dart
const double largeScreenMinWidth = 600.0;

class AdaptiveLayout extends StatelessWidget {
  const AdaptiveLayout({super.key});

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        if (constraints.maxWidth > largeScreenMinWidth) {
          return _buildLargeScreen();  // Row sidebar + content
        } else {
          return _buildSmallScreen();  // Column / stacked
        }
      },
    );
  }
}
```

### Key Principles

- **Use `MediaQuery.sizeOf(context)`** for app window size, not device type
- **Do NOT check for "phone" vs "tablet"** — Flutter runs in resizable windows
- **Do NOT lock orientation** — causes letterboxing on foldables
- **Use `Expanded`/`Flexible`** in Row/Column to distribute space
- **Wrap ListView/GridView in `Expanded`** inside Column
- **Use `ConstrainedBox` + `Center`** to cap width on large screens
- **Use `ListView.builder`** for lazy rendering of large lists
- **Use `SliverGridDelegateWithMaxCrossAxisExtent`** for auto-column grids

### Common Layout Error Fixes

| Error | Fix |
|-------|-----|
| `"Vertical viewport was given unbounded height"` | Wrap ListView/GridView in `Expanded` or `SizedBox` |
| `"InputDecorator...cannot have unbounded width"` | Wrap TextField in `Expanded` or `Flexible` in a Row |
| `"RenderFlex overflowed"` | Constrain overflowing child with `Expanded` or `Flexible` |
| `"Incorrect use of ParentData widget"` | Ensure `Expanded` is direct child of `Row`/`Column`; `Positioned` direct child of `Stack` |

## Localization (i18n)

### Setup

```bash
flutter pub add flutter_localizations --sdk=flutter
flutter pub add intl:any
```

### Configuration

```yaml
# pubspec.yaml
flutter:
  generate: true
```

```yaml
# l10n.yaml
arb-dir: lib/l10n
template-arb-file: app_en.arb
output-localization-file: app_localizations.dart
```

```arb
// lib/l10n/app_en.arb
{
  "@@locale": "en",
  "helloWorld": "Hello World!",
  "greeting": "Hello {name}",
  "@greeting": {
    "placeholders": {
      "name": {"type": "String"}
    }
  }
}

// lib/l10n/app_es.arb
{
  "@@locale": "es",
  "helloWorld": "¡Hola Mundo!",
  "greeting": "Hola {name}"
}
```

### Usage in Widgets

```dart
// After running the app, use generated localizations:
Text(AppLocalizations.of(context)!.helloWorld)
Text(AppLocalizations.of(context)!.greeting('Eburon'))

// Configure MaterialApp
MaterialApp(
  localizationsDelegates: AppLocalizations.localizationsDelegates,
  supportedLocales: AppLocalizations.supportedLocales,
  // ...
);
```

## Widget Testing

### Pattern

```dart
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('Add and remove a todo item', (WidgetTester tester) async {
    await tester.pumpWidget(const TodoList());
    expect(find.byType(ListTile), findsNothing);

    await tester.enterText(find.byType(TextField), 'Buy groceries');
    await tester.tap(find.byType(FloatingActionButton));
    await tester.pump();

    expect(find.text('Buy groceries'), findsOneWidget);

    await tester.drag(find.byType(Dismissible), const Offset(500, 0));
    await tester.pumpAndSettle();
    expect(find.text('Buy groceries'), findsNothing);
  });
}
```

### Key APIs

| API | Use |
|-----|-----|
| `tester.pumpWidget(widget)` | Render a widget |
| `tester.pump()` | Trigger single frame rebuild |
| `tester.pumpAndSettle()` | Pump until all animations complete |
| `tester.tap(finder)` | Tap an element |
| `tester.enterText(finder, text)` | Type into a TextField |
| `tester.drag(finder, offset)` | Swipe/drag an element |
| `tester.scrollUntilVisible(finder, offset)` | Scroll to make element visible |
| `find.text('...')` | Find by text |
| `find.byType(MyWidget)` | Find by widget type |
| `find.byKey(Key('key'))` | Find by key |
| `findsOneWidget / findsNothing / findsNWidgets(n)` | Matchers |

## Integration Testing

### Setup

```bash
flutter pub add 'dev:integration_test:{"sdk":"flutter"}'
flutter pub add 'dev:flutter_test:{"sdk":"flutter"}'
```

### Test File (`integration_test/app_test.dart`)

```dart
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('Full checkout flow', (WidgetTester tester) async {
    await tester.pumpWidget(const MyApp());
    await tester.pumpAndSettle();

    await tester.tap(find.byKey(const Key('checkout_btn')));
    await tester.pumpAndSettle();
    expect(find.text('Order confirmed'), findsOneWidget);
  });
}
```

### Interactive Exploration (via MCP)

Use the Dart/Flutter MCP tools: `launch_app` → `get_widget_tree` → `tap` / `enter_text` / `scroll` → verify with `get_health`. Then convert explored flows into permanent integration tests.

## Flutter App Scaffold Workflow

When starting a new Flutter project, do this in order:

```bash
# 1. Create the project
flutter create --org com.eburon --platforms=ios,android,web,MacOS my_app
cd my_app

# 2. Add core dependencies
flutter pub add go_router
flutter pub add http
flutter pub add provider        # or riverpod / get_it
flutter pub add flutter_localizations --sdk=flutter
flutter pub add intl:any
flutter pub add 'dev:integration_test:{"sdk":"flutter"}'

# 3. Set up architecture directories
mkdir -p lib/data/{models,repositories,services}
mkdir -p lib/domain/{models,use_cases}
mkdir -p lib/ui/{core,features}
mkdir -p lib/l10n
mkdir -p integration_test

# 4. Configure localization (l10n.yaml + .arb files)
# 5. Set up go_router with MaterialApp.router
# 6. Set up Provider/Riverpod at app root
# 7. Build features using MVVM + Repository pattern
```

## PWA + Flutter Web

For Flutter web builds targeting mobile:

```bash
flutter build web --web-renderer canvaskit  # Best for PWA quality
```

Configure the web manifest at `web/manifest.json` and register a service worker. See the `mobile-pwa-design` skill for PWA-specific patterns (manifest, service worker, offline, app shell, iOS meta tags).

## Testing Checklist

- [ ] `flutter analyze` — no warnings or errors
- [ ] `flutter test` — all unit/widget tests pass
- [ ] `flutter test integration_test/` — all integration tests pass
- [ ] Run on real device or emulator — verify UI renders correctly
- [ ] Test on multiple screen sizes (phone + tablet)
- [ ] Test dark mode
- [ ] Test with slow network (DevTools network throttling)

## Experience Notes

Path: `{working-directory}/flutter-dev-memories/flutter-dev.memory.md`

**Before execution**: If the file exists, read it first.

**After execution**: If unexpected situation encountered or better pattern discovered, append:
`{YYYY-MM-DD}: {what happened} → {conclusion}`
