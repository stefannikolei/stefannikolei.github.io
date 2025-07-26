---
title: "Blazor für statische Websites"
publishDate: 2025-07-13
tags: [Blazor, .NET]
summary: "Warum Blazor WebAssembly eine interessante Option für statische Websites wie Blogs sein kann. In diesem Post erkläre ich die Vorteile und zeige, wie sich ein Blog mit Blazor und GitHub Pages realisieren lässt."
readingTimeMinutes: 5
---

# ⚡ Blazor für statische Websites

Blazor WebAssembly ist nicht nur für komplexe Web-Anwendungen geeignet. Es eignet sich auch hervorragend für statische Websites wie Blogs. In diesem Artikel zeige ich, warum und wie.

## 🤔 Warum Blazor für einen Blog?

Auf den ersten Blick mag es übertrieben erscheinen, ein komplettes SPA-Framework für einen einfachen Blog zu verwenden. Aber Blazor WebAssembly bietet einige interessante Vorteile:

### 🔷 C# statt JavaScript

Als .NET-Entwickler kann ich meine bevorzugte Programmiersprache verwenden:
- Einheitliche Code-Basis
- Wiederverwendbare Komponenten
- Typsicherheit im gesamten Stack
- Bessere Entwickler-Produktivität

### 🧩 Komponentenbasierte Architektur

Blazor ermöglicht es, die Website in wiederverwendbare Komponenten zu strukturieren:

```razor
@* BlogPost.razor *@
<article class="blog-post">
    <h2>@Title</h2>
    <p class="post-meta">@PublishDate.ToString("dd. MMMM yyyy")</p>
    <div>@ChildContent</div>
</article>

@code {
    [Parameter] public string Title { get; set; } = "";
    [Parameter] public DateTime PublishDate { get; set; }
    [Parameter] public RenderFragment? ChildContent { get; set; }
}
```

### 📄 Statische Generierung mit GitHub Pages

Das Schöne an Blazor WebAssembly ist, dass es komplett statische Dateien generiert:
- HTML, CSS und JavaScript-Dateien
- WASM-Binaries für die .NET-Runtime
- Keine Server-Abhängigkeiten
- Perfekt für GitHub Pages

## 🚀 Setup und Deployment

Das Setup ist überraschend einfach:

### 1. Projekt erstellen
```bash
dotnet new blazorwasm -n MeinBlog
```

### 2. GitHub Actions für automatisches Deployment
Mit einer einfachen GitHub Actions Workflow-Datei lässt sich das Deployment komplett automatisieren. Bei jedem Push auf den main Branch wird automatisch gebaut und deployed.

### 3. Konfiguration für GitHub Pages
Wichtig ist die korrekte Konfiguration der `base href` und die Behandlung von Client-Side Routing.

## ✅ Vorteile gegenüber traditionellen Static Site Generators

Im Vergleich zu Jekyll, Hugo oder Gatsby bietet Blazor:

- **🔒 Typsicherheit** - Compile-Time Checks für alle Templates
- **💡 IntelliSense** - Vollständige IDE-Unterstützung
- **🐛 Debugging** - Echtes Debugging mit Breakpoints
- **♻️ Wiederverwendung** - Komponenten zwischen Projekten teilen

## ⚠️ Nachteile und Überlegungen

**Wichtige Überlegungen:**
- **Größe** - WASM-Bundles sind größer als traditionelles HTML/JS
- **Ladezeit** - Initiales Laden dauert länger
- **SEO** - Erfordert Pre-Rendering für optimale Suchmaschinen-Optimierung
- **Browser-Support** - WebAssembly ist relativ neu

## 🎯 Fazit

Blazor WebAssembly für einen Blog zu verwenden mag auf den ersten Blick wie "Overkill" erscheinen. Aber es demonstriert eindrucksvoll die Vielseitigkeit moderner .NET-Technologien und bietet eine konsistente Entwicklererfahrung.

Für .NET-Entwickler, die ihre Fähigkeiten auch im Frontend-Bereich einsetzen möchten, ist es eine spannende Alternative zu traditionellen Ansätzen.