# TechBlog Source Generator Tests

Dieses Projekt enthält Unit Tests und Integrationstests für den `BlogPostSourceGenerator`.

## Teststruktur

### Unit Tests (`UnitTest1.cs`)
- **GeneratesBlogPostList_WithValidMarkdownFiles**: Testet die Generierung mit gültigen Markdown-Dateien
- **HandlesInvalidYaml_Gracefully**: Testet das Verhalten bei ungültigem YAML
- **HandlesEmptyInput**: Testet das Verhalten ohne Eingabedateien
- **GeneratesCorrectSlug**: Testet die Slug-Generierung aus Titeln

### Integrationstests (`BlogPostSourceGeneratorIntegrationTests.cs`)
- **GeneratesBlogPostList_WithRealMarkdownFiles**: Testet mit echten Markdown-Dateien
- **CanCompileGeneratedCode**: Überprüft, ob der generierte Code kompilierbar ist
- **GeneratedCodeCanBeUsedAtRuntime**: Testet die Verwendung zur Laufzeit

## Debugging des Source Generators

Um den Source Generator zu debuggen:

1. Setze Breakpoints in den Tests oder im Source Generator Code
2. Führe die Tests im Debug-Modus aus: `dotnet test --logger trx --verbosity normal`
3. Die generierten Quellcodes werden in den Tests ausgegeben und können überprüft werden

## Test-Markdown-Dateien

Das Projekt enthält Beispiel-Markdown-Dateien im `BlogPosts/` Verzeichnis:
- `test-post-1.md`: Erster Test Blog Post (2024-01-15)
- `test-post-2.md`: Zweiter Test Blog Post (2024-02-20)

## Ausführung der Tests

```bash
# Alle Tests ausführen
dotnet test

# Tests mit ausführlicher Ausgabe
dotnet test --verbosity normal

# Nur bestimmte Tests ausführen
dotnet test --filter "FullyQualifiedName~BlogPostSourceGeneratorTests"
```

## Erwartetes Verhalten

Der Source Generator sollte:
1. Markdown-Dateien im `BlogPosts/` Verzeichnis finden
2. YAML-Frontmatter parsen (title, date, tags, description)
3. Eine `BlogPostList.g.cs` Datei generieren mit einer statischen Liste aller Blog Posts
4. Posts nach Datum absteigend sortieren
5. Slugs aus Titeln generieren
6. Graceful mit ungültigen/fehlenden Daten umgehen

## Debugging-Tipps

- Verwende `Console.WriteLine()` in den Tests, um generierten Code zu inspizieren
- Setze Breakpoints in `BlogPostSourceGenerator.GenerateBlogPostList()`
- Überprüfe die `result.Diagnostics` für Compiler-Warnungen oder -Fehler
- Teste verschiedene YAML-Frontmatter-Variationen
