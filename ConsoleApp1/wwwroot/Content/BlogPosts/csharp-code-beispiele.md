---
title: "C# Code-Beispiele und Best Practices"
publishDate: 2025-07-13
tags: [C#, .NET, Programming, Best Practices]
summary: "Eine umfassende Sammlung von C# Code-Beispielen zur Demonstration verschiedener Programmierkonzepte und zur Überprüfung der Syntax-Hervorhebung."
readingTimeMinutes: 8
---

# C# Code-Beispiele und Best Practices

Dieser Artikel demonstriert verschiedene C# Programmierkonzepte und testet gleichzeitig die Syntax-Hervorhebung des Blog-Systems. Von grundlegenden Klassen bis hin zu modernen C# Features zeigen wir praktische Beispiele.

## 🏗️ Grundlegende Klassenstruktur

Beginnen wir mit einer einfachen Klasse, die verschiedene C# Features demonstriert:

```csharp
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace TechBlog.Examples
{
    /// <summary>
    /// Beispiel-Klasse zur Demonstration von C# Syntax-Hervorhebung
    /// </summary>
    public class BlogPost
    {
        // Automatische Properties mit verschiedenen Zugriffsmodifikatoren
        public string Title { get; set; } = string.Empty;
        public DateTime PublishDate { get; private set; }
        public List<string> Tags { get; init; } = new();
        
        // Readonly Property mit Expression-Body
        public string FormattedDate => PublishDate.ToString("dd.MM.yyyy");
        
        // Private Field
        private readonly int _readingTimeMinutes;
        
        // Konstruktor mit Parameter-Validierung
        public BlogPost(string title, DateTime publishDate, int readingTimeMinutes)
        {
            Title = title ?? throw new ArgumentNullException(nameof(title));
            PublishDate = publishDate;
            _readingTimeMinutes = readingTimeMinutes > 0 
                ? readingTimeMinutes 
                : throw new ArgumentException("Reading time must be positive", nameof(readingTimeMinutes));
        }
        
        // Async-Methode mit verschiedenen Sprachfeatures
        public async Task<string> GenerateSummaryAsync()
        {
            await Task.Delay(100); // Simulierte async Operation
            
            var tagString = Tags.Any() 
                ? string.Join(", ", Tags.Select(tag => $"#{tag}"))
                : "Keine Tags";
                
            return $"{Title} ({FormattedDate}) - {tagString} - {_readingTimeMinutes} Min. Lesezeit";
        }
    }
}
```

## 🎯 Interface und Implementierung

Hier ein Beispiel für ein Interface und dessen Implementierung:

```csharp
// Interface mit verschiedenen Methodensignaturen
public interface IBlogPostService
{
    Task<IEnumerable<BlogPost>> GetAllPostsAsync();
    Task<BlogPost?> GetPostBySlugAsync(string slug);
    Task<bool> CreatePostAsync(BlogPost post);
    Task<bool> UpdatePostAsync(string slug, BlogPost post);
    Task<bool> DeletePostAsync(string slug);
    
    // Event für Benachrichtigungen
    event EventHandler<BlogPostEventArgs> PostCreated;
}

// Implementierung mit Dependency Injection
public class BlogPostService : IBlogPostService
{
    private readonly IRepository<BlogPost> _repository;
    private readonly ILogger<BlogPostService> _logger;
    private readonly IMemoryCache _cache;
    
    public event EventHandler<BlogPostEventArgs>? PostCreated;
    
    public BlogPostService(
        IRepository<BlogPost> repository, 
        ILogger<BlogPostService> logger,
        IMemoryCache cache)
    {
        _repository = repository ?? throw new ArgumentNullException(nameof(repository));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _cache = cache ?? throw new ArgumentNullException(nameof(cache));
    }
    
    public async Task<IEnumerable<BlogPost>> GetAllPostsAsync()
    {
        const string cacheKey = "all_blog_posts";
        
        if (_cache.TryGetValue(cacheKey, out IEnumerable<BlogPost>? cachedPosts))
        {
            _logger.LogDebug("Returning cached blog posts");
            return cachedPosts!;
        }
        
        try
        {
            var posts = await _repository.GetAllAsync();
            var orderedPosts = posts
                .Where(p => p.PublishDate <= DateTime.Now)
                .OrderByDescending(p => p.PublishDate)
                .ToList();
                
            _cache.Set(cacheKey, orderedPosts, TimeSpan.FromMinutes(30));
            
            _logger.LogInformation("Retrieved {PostCount} blog posts from repository", orderedPosts.Count);
            return orderedPosts;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving blog posts");
            throw;
        }
    }
    
    public async Task<BlogPost?> GetPostBySlugAsync(string slug)
    {
        if (string.IsNullOrWhiteSpace(slug))
            return null;
            
        var cacheKey = $"blog_post_{slug}";
        
        if (_cache.TryGetValue(cacheKey, out BlogPost? cachedPost))
            return cachedPost;
            
        var post = await _repository.GetBySlugAsync(slug);
        
        if (post != null)
        {
            _cache.Set(cacheKey, post, TimeSpan.FromHours(1));
        }
        
        return post;
    }
    
    public async Task<bool> CreatePostAsync(BlogPost post)
    {
        ArgumentNullException.ThrowIfNull(post);
        
        try
        {
            var result = await _repository.CreateAsync(post);
            
            if (result)
            {
                _cache.Remove("all_blog_posts");
                PostCreated?.Invoke(this, new BlogPostEventArgs(post));
                _logger.LogInformation("Created new blog post: {Title}", post.Title);
            }
            
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating blog post: {Title}", post.Title);
            return false;
        }
    }
}
```

## 🔧 Generics und LINQ

Demonstration von generischen Klassen und LINQ-Abfragen:

```csharp
// Generische Repository-Klasse
public class GenericRepository<T> : IRepository<T> where T : class, IEntity
{
    private readonly DbContext _context;
    private readonly DbSet<T> _dbSet;
    
    public GenericRepository(DbContext context)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
        _dbSet = context.Set<T>();
    }
    
    public async Task<IQueryable<T>> GetQueryableAsync()
    {
        return _dbSet.AsQueryable();
    }
    
    // LINQ-Beispiele mit verschiedenen Operatoren
    public async Task<IEnumerable<T>> SearchAsync(string searchTerm, int pageSize = 10)
    {
        if (string.IsNullOrWhiteSpace(searchTerm))
            return await _dbSet.Take(pageSize).ToListAsync();
            
        return await _dbSet
            .Where(entity => EF.Functions.Like(entity.ToString(), $"%{searchTerm}%"))
            .OrderBy(entity => entity.Id)
            .Take(pageSize)
            .ToListAsync();
    }
    
    // Komplexere LINQ-Abfrage mit Gruppierung
    public async Task<Dictionary<string, int>> GetStatisticsAsync()
    {
        var statistics = await _dbSet
            .GroupBy(entity => entity.GetType().Name)
            .Select(group => new 
            { 
                Type = group.Key, 
                Count = group.Count() 
            })
            .ToDictionaryAsync(x => x.Type, x => x.Count);
            
        return statistics;
    }
}

// Extension Methods für bessere Lesbarkeit
public static class BlogPostExtensions
{
    public static IQueryable<BlogPost> PublishedOnly(this IQueryable<BlogPost> query)
    {
        return query.Where(post => post.PublishDate <= DateTime.Now);
    }
    
    public static IQueryable<BlogPost> WithTag(this IQueryable<BlogPost> query, string tag)
    {
        return query.Where(post => post.Tags.Contains(tag));
    }
    
    public static IQueryable<BlogPost> OrderByNewest(this IQueryable<BlogPost> query)
    {
        return query.OrderByDescending(post => post.PublishDate);
    }
    
    // Fluent API Beispiel
    public static async Task<List<BlogPost>> GetRecentPostsWithTagAsync(
        this IQueryable<BlogPost> query, 
        string tag, 
        int count = 5)
    {
        return await query
            .PublishedOnly()
            .WithTag(tag)
            .OrderByNewest()
            .Take(count)
            .ToListAsync();
    }
}
```

## 🎭 Pattern Matching und Records

Moderne C# Features wie Pattern Matching und Records:

```csharp
// Record types für unveränderliche Daten
public record BlogPostDto(
    string Title, 
    DateTime PublishDate, 
    IReadOnlyList<string> Tags,
    string Summary)
{
    // Zusätzliche berechnete Properties
    public string FormattedDate => PublishDate.ToString("dd. MMMM yyyy");
    public bool IsRecent => PublishDate > DateTime.Now.AddDays(-30);
}

// Pattern Matching Beispiele
public class BlogPostAnalyzer
{
    public string AnalyzePost(BlogPost post) => post switch
    {
        { Tags.Count: 0 } => "Post ohne Tags - sollte kategorisiert werden",
        { Tags.Count: > 5 } => "Zu viele Tags - maximal 5 empfohlen",
        { Title.Length: < 10 } => "Titel zu kurz - mindestens 10 Zeichen empfohlen",
        { Title.Length: > 100 } => "Titel zu lang - maximal 100 Zeichen empfohlen",
        { PublishDate: var date } when date > DateTime.Now => "Geplanter Post",
        { PublishDate: var date } when date < DateTime.Now.AddYears(-1) => "Alter Post",
        _ => "Post scheint in Ordnung zu sein"
    };
    
    // Property Pattern mit Guards
    public Priority GetUpdatePriority(BlogPost post) => post switch
    {
        { PublishDate: var date, Tags.Count: var tagCount } 
            when date < DateTime.Now.AddYears(-2) && tagCount == 0 => Priority.High,
        { PublishDate: var date } when date < DateTime.Now.AddMonths(-6) => Priority.Medium,
        _ => Priority.Low
    };
}

public enum Priority { Low, Medium, High }

// Nullable Reference Types
public class BlogPostValidator
{
    public ValidationResult ValidatePost(BlogPost? post)
    {
        if (post is null)
            return new ValidationResult(false, "Post darf nicht null sein");
            
        var errors = new List<string>();
        
        // String.IsNullOrWhiteSpace mit null-conditional operator
        if (string.IsNullOrWhiteSpace(post.Title))
            errors.Add("Titel ist erforderlich");
            
        if (post.PublishDate == default)
            errors.Add("Publikationsdatum ist erforderlich");
            
        // Null-coalescing assignment
        post.Tags ??= new List<string>();
        
        return errors.Count == 0 
            ? new ValidationResult(true, null)
            : new ValidationResult(false, string.Join("; ", errors));
    }
}

public record ValidationResult(bool IsValid, string? ErrorMessage);
```

## 🔄 Async/Await und Exception Handling

Beispiele für asynchrone Programmierung und Fehlerbehandlung:

```csharp
public class AsyncBlogService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<AsyncBlogService> _logger;
    
    public AsyncBlogService(HttpClient httpClient, ILogger<AsyncBlogService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }
    
    // Async-Methode mit mehreren await-Calls
    public async Task<BlogPostSummary> ProcessBlogPostAsync(string slug, CancellationToken cancellationToken = default)
    {
        try
        {
            // Parallele Ausführung mehrerer async Operations
            var postTask = GetPostContentAsync(slug, cancellationToken);
            var commentsTask = GetCommentsAsync(slug, cancellationToken);
            var viewCountTask = GetViewCountAsync(slug, cancellationToken);
            
            // Warten auf alle Tasks
            await Task.WhenAll(postTask, commentsTask, viewCountTask);
            
            var post = await postTask;
            var comments = await commentsTask;
            var viewCount = await viewCountTask;
            
            return new BlogPostSummary
            {
                Title = post.Title,
                CommentCount = comments.Count,
                ViewCount = viewCount,
                LastUpdated = DateTime.UtcNow
            };
        }
        catch (OperationCanceledException)
        {
            _logger.LogInformation("Blog post processing was cancelled for slug: {Slug}", slug);
            throw;
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "HTTP error while processing blog post: {Slug}", slug);
            throw new BlogServiceException($"Failed to retrieve blog post: {slug}", ex);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error processing blog post: {Slug}", slug);
            throw;
        }
    }
    
    // ConfigureAwait(false) für bessere Performance in Libraries
    private async Task<BlogPost> GetPostContentAsync(string slug, CancellationToken cancellationToken)
    {
        using var response = await _httpClient
            .GetAsync($"/api/posts/{slug}", cancellationToken)
            .ConfigureAwait(false);
            
        response.EnsureSuccessStatusCode();
        
        var json = await response.Content
            .ReadAsStringAsync(cancellationToken)
            .ConfigureAwait(false);
            
        return JsonSerializer.Deserialize<BlogPost>(json) 
            ?? throw new InvalidOperationException("Failed to deserialize blog post");
    }
    
    // Async enumerable (IAsyncEnumerable)
    public async IAsyncEnumerable<BlogPost> GetPostsStreamAsync(
        [EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        var page = 1;
        const int pageSize = 10;
        
        while (!cancellationToken.IsCancellationRequested)
        {
            var posts = await GetPostsPageAsync(page, pageSize, cancellationToken);
            
            if (!posts.Any())
                yield break;
                
            foreach (var post in posts)
            {
                yield return post;
            }
            
            page++;
            
            // Kleine Pause zwischen den Seiten
            await Task.Delay(100, cancellationToken);
        }
    }
    
    private async Task<List<BlogPost>> GetPostsPageAsync(int page, int pageSize, CancellationToken cancellationToken)
    {
        // Implementation für Paging...
        await Task.Delay(50, cancellationToken); // Simulierte Verzögerung
        return new List<BlogPost>();
    }
}

// Custom Exception für bessere Fehlerbehandlung
public class BlogServiceException : Exception
{
    public BlogServiceException(string message) : base(message) { }
    public BlogServiceException(string message, Exception innerException) : base(message, innerException) { }
}
```

## 🎉 Fazit

Diese umfangreichen Code-Beispiele demonstrieren verschiedene C# Features und testen gleichzeitig die Syntax-Hervorhebung des Blog-Systems:

- ✅ **Grundlegende Syntax** - Klassen, Properties, Methoden
- ✅ **Moderne C# Features** - Records, Pattern Matching, Nullable Reference Types  
- ✅ **Async/Await** - Asynchrone Programmierung und Fehlerbehandlung
- ✅ **LINQ** - Abfragen und Datenmanipulation
- ✅ **Generics** - Typsichere generische Programmierung
- ✅ **Dependency Injection** - Moderne .NET Patterns

Die Syntax-Hervorhebung sollte alle diese Sprachkonstrukte korrekt darstellen und den Code leicht lesbar machen! 🚀