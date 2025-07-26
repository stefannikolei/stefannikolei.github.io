using System.Text.Json;
using System.Text.RegularExpressions;
using Markdig;
using TechBlog.Models;
using TechBlog.Generated;

namespace TechBlog.Services;

/// <summary>
/// MarkdownMonster-style Markdown processor that provides a simple, clean API
/// for converting Markdown to HTML with common extensions.
/// Syntax highlighting is handled client-side by PrismJS.
/// </summary>
public static class MarkdownMonster
{
    /// <summary>
    /// Parses markdown text to HTML using MarkdownMonster-style configuration.
    /// Includes advanced extensions. Syntax highlighting handled by PrismJS.
    /// </summary>
    /// <param name="markdown">The markdown text to parse</param>
    /// <returns>HTML string</returns>
    public static string Parse(string markdown)
    {
        // MarkdownMonster-style: Simple, direct API with sensible defaults
        // Syntax highlighting handled client-side by PrismJS
        var pipeline = new MarkdownPipelineBuilder()
            .UseAdvancedExtensions()
            .Build();
            
        return Markdown.ToHtml(markdown, pipeline);
    }
}

public class BlogPostService
{
    private readonly HttpClient _httpClient;
    private List<BlogPost>? _cachedPosts;

    public BlogPostService(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public async Task<List<BlogPost>> GetAllPostsAsync()
    {
        if (_cachedPosts != null)
            return _cachedPosts;

        var posts = new List<BlogPost>();

        // Verwende den Output des Source Generators anstatt manueller Liste
        foreach (var postMeta in BlogPostList.All)
        {
            try
            {
                var post = await GetPostAsync(postMeta.FileName);
                if (post != null)
                {
                    posts.Add(post);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error loading post {postMeta.FileName}: {ex.Message}");
            }
        }

        // Posts sind bereits vom Source Generator sortiert (nach Datum absteigend)
        _cachedPosts = posts;
        return posts;
    }

    /// <summary>
    /// Gibt nur die Metadaten aller Posts zurück, ohne den vollständigen Inhalt zu laden.
    /// Dies ist performanter für Übersichtsseiten.
    /// </summary>
    public List<BlogPostMeta> GetAllPostMetadata()
    {
        return BlogPostList.All.ToList();
    }

    /// <summary>
    /// Gibt eine paginierte Liste von Blog Posts zurück.
    /// </summary>
    /// <param name="page">Die Seitennummer (1-basiert)</param>
    /// <param name="pageSize">Anzahl der Posts pro Seite</param>
    /// <returns>Paginierte Blog Posts</returns>
    public async Task<PaginatedBlogPosts> GetPaginatedPostsAsync(int page = 1, int pageSize = 5)
    {
        var allPosts = await GetAllPostsAsync();
        var totalPosts = allPosts.Count;
        var totalPages = (int)Math.Ceiling((double)totalPosts / pageSize);
        
        // Sicherstellen, dass die Seitennummer gültig ist
        page = Math.Max(1, Math.Min(page, totalPages));
        
        var skip = (page - 1) * pageSize;
        var posts = allPosts.Skip(skip).Take(pageSize).ToList();
        
        return new PaginatedBlogPosts
        {
            Posts = posts,
            CurrentPage = page,
            TotalPages = totalPages,
            TotalPosts = totalPosts,
            PageSize = pageSize,
            HasPreviousPage = page > 1,
            HasNextPage = page < totalPages
        };
    }

    public async Task<BlogPost?> GetPostAsync(string slug)
    {
        try
        {
            var markdownContent = await _httpClient.GetStringAsync($"Content/BlogPosts/{slug}.md");
            return ParseMarkdownPost(markdownContent, slug);
        }
        catch (HttpRequestException)
        {
            Console.WriteLine($"Could not find blog post: {slug}");
            return null;
        }
    }

    private BlogPost ParseMarkdownPost(string markdownContent, string slug)
    {
        var frontMatterRegex = new Regex(@"^---\s*\n(.*?)\n---\s*\n(.*)$", RegexOptions.Singleline);
        var match = frontMatterRegex.Match(markdownContent);

        if (!match.Success)
        {
            throw new ArgumentException("Invalid markdown format. Expected front matter.");
        }

        var frontMatterYaml = match.Groups[1].Value;
        var contentMarkdown = match.Groups[2].Value;

        // Remove the first H1 heading from markdown content to avoid duplication
        // since we already display the title from front matter metadata
        var cleanedMarkdown = RemoveFirstH1Heading(contentMarkdown);

        var metadata = ParseFrontMatter(frontMatterYaml);
        
        // MarkdownMonster-style: simple, clean API call
        var htmlContent = MarkdownMonster.Parse(cleanedMarkdown);

        return new BlogPost
        {
            Title = metadata.Title,
            PublishDate = metadata.PublishDate,
            Tags = metadata.Tags,
            Summary = metadata.Summary,
            ReadingTimeMinutes = metadata.ReadingTimeMinutes,
            Content = htmlContent,
            Slug = slug
        };
    }

    private BlogPostMetadata ParseFrontMatter(string frontMatter)
    {
        var metadata = new BlogPostMetadata();
        var lines = frontMatter.Split('\n', StringSplitOptions.RemoveEmptyEntries);

        foreach (var line in lines)
        {
            var parts = line.Split(':', 2, StringSplitOptions.TrimEntries);
            if (parts.Length != 2) continue;

            var key = parts[0].ToLower();
            var value = parts[1];

            switch (key)
            {
                case "title":
                    metadata.Title = value.Trim('"', '\'');
                    break;
                case "publishdate":
                case "date":
                    if (DateTime.TryParse(value, out var date))
                        metadata.PublishDate = date;
                    break;
                case "tags":
                    // Parse tags as comma-separated values or YAML array
                    if (value.StartsWith('[') && value.EndsWith(']'))
                    {
                        // YAML array format: [tag1, tag2, tag3]
                        var tagString = value.Trim('[', ']');
                        metadata.Tags = tagString.Split(',')
                            .Select(t => t.Trim().Trim('"', '\''))
                            .Where(t => !string.IsNullOrEmpty(t))
                            .ToList();
                    }
                    else
                    {
                        // Comma-separated format: tag1, tag2, tag3
                        metadata.Tags = value.Split(',')
                            .Select(t => t.Trim().Trim('"', '\''))
                            .Where(t => !string.IsNullOrEmpty(t))
                            .ToList();
                    }
                    break;
                case "summary":
                    metadata.Summary = value.Trim('"', '\'');
                    break;
                case "readingtime":
                case "readingtimeminutes":
                    if (int.TryParse(value, out var readingTime))
                        metadata.ReadingTimeMinutes = readingTime;
                    break;
            }
        }

        return metadata;
    }

    private string RemoveFirstH1Heading(string markdownContent)
    {
        // Remove the first H1 heading (# ) only if it appears at the beginning of the content
        // This prevents duplicate headings since we display the title from front matter
        var lines = markdownContent.Split('\n');
        var resultLines = new List<string>();
        bool contentStarted = false;

        foreach (var line in lines)
        {
            var trimmedLine = line.Trim();
            
            // If we haven't found any content yet
            if (!contentStarted)
            {
                // Skip empty lines at the beginning
                if (string.IsNullOrWhiteSpace(trimmedLine))
                {
                    resultLines.Add(line);
                    continue;
                }
                
                // If the first non-empty line is an H1 heading, skip it
                if (trimmedLine.StartsWith("# "))
                {
                    contentStarted = true;
                    continue;
                }
                
                // If the first non-empty line is not an H1, mark content as started
                contentStarted = true;
            }
            
            resultLines.Add(line);
        }

        return string.Join('\n', resultLines);
    }

    public void ClearCache()
    {
        _cachedPosts = null;
    }
}

// Helper class for YAML front matter parsing
public class BlogPostMetadata
{
    public string Title { get; set; } = "";
    public DateTime PublishDate { get; set; }
    public List<string> Tags { get; set; } = new();
    public string Summary { get; set; } = "";
    public int ReadingTimeMinutes { get; set; }
}