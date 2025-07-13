# Stefan Nikolei - Tech Blog

Ein moderner Tech Blog erstellt mit Blazor WebAssembly und gehostet auf GitHub Pages.

## 🚀 Technologie-Stack

- **Frontend**: Blazor WebAssembly (.NET 8)
- **Hosting**: GitHub Pages
- **CI/CD**: GitHub Actions
- **Styling**: Bootstrap + Custom CSS mit modernen Gradients

## 📁 Projekt-Struktur

```
├── Pages/
│   ├── BlogPosts/          # Individuelle Blog Posts
│   ├── Home.razor          # Startseite
│   ├── Blog.razor          # Blog-Übersicht
│   └── About.razor         # Über-Seite
├── Layout/
│   ├── MainLayout.razor    # Haupt-Layout
│   └── NavMenu.razor       # Navigation
├── wwwroot/
│   ├── css/               # Stylesheets
│   ├── index.html         # Haupt-HTML
│   └── 404.html          # GitHub Pages SPA-Routing
└── .github/workflows/
    └── deploy.yml         # Automatisches Deployment
```

## 🛠️ Entwicklung

### Voraussetzungen
- .NET 8 SDK
- Git

### Lokale Entwicklung
```bash
# Repository klonen
git clone https://github.com/stefannikolei/stefannikolei.github.io.git
cd stefannikolei.github.io

# Abhängigkeiten wiederherstellen
dotnet restore

# Entwicklungsserver starten
dotnet run
```

### Build für Produktion
```bash
# Produktion-Build erstellen
dotnet publish -c Release -o dist

# Statische Dateien sind in dist/wwwroot/
```

## 🚚 Deployment

Das Deployment erfolgt automatisch über GitHub Actions:

1. Bei Push auf `main` Branch wird automatisch gebaut
2. Die statischen Dateien werden zu GitHub Pages deployed
3. Die Website ist unter https://stefannikolei.github.io verfügbar

## ✨ Features

- **Responsive Design**: Funktioniert auf Desktop und Mobile
- **Moderne UI**: Gradient-Design mit Bootstrap
- **Client-Side Routing**: SPA-Navigation mit Blazor Router
- **SEO-freundlich**: Proper Meta-Tags und Title-Management
- **GitHub Pages kompatibel**: Spezielle Konfiguration für SPA-Routing

## 📝 Neue Blog Posts hinzufügen

1. Neue `.razor` Datei in `Pages/BlogPosts/` erstellen
2. `@page` Direktive mit Route hinzufügen
3. Post zur Blog-Übersicht in `Pages/Blog.razor` hinzufügen
4. Optional: Vorschau auf Home-Page in `Pages/Home.razor` hinzufügen

## 🎨 Design-Philosophie

Das Design folgt modernen Web-Standards:
- Minimalistisch und clean
- Fokus auf Lesbarkeit
- Konsistente Farbpalette (Lila/Blau Gradients)
- Responsive und zugänglich
- Schnelle Ladezeiten

## 📄 Lizenz

Dieses Projekt ist für persönliche Nutzung bestimmt.