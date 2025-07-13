using System.Text.Json;
using System.Text.RegularExpressions;
using Markdig;
using Markdig.SyntaxHighlighting;
using TechBlog.Models;

namespace TechBlog.Services;

public class BlogPostService
{
    private readonly HttpClient _httpClient;
    private readonly MarkdownPipeline _markdownPipeline;
    private List<BlogPost>? _cachedPosts;

    public BlogPostService(HttpClient httpClient)
    {
        _httpClient = httpClient;
        _markdownPipeline = new MarkdownPipelineBuilder()
            .UseAdvancedExtensions()
            .UseSyntaxHighlighting()
            .Build();
    }

    public async Task<List<BlogPost>> GetAllPostsAsync()
    {
        if (_cachedPosts != null)
            return _cachedPosts;

        var posts = new List<BlogPost>();

        // For now, we'll manually list the posts. In a future iteration, 
        // this could be automated by reading a manifest file
        var postSlugs = new[] { "welcome", "blazor-static-sites", "creating-dynamic-blog-posts", "csharp-code-beispiele" };

        foreach (var slug in postSlugs)
        {
            try
            {
                var post = await GetPostAsync(slug);
                if (post != null)
                {
                    posts.Add(post);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error loading post {slug}: {ex.Message}");
            }
        }

        // Sort by publish date descending
        posts.Sort((a, b) => b.PublishDate.CompareTo(a.PublishDate));
        
        _cachedPosts = posts;
        return posts;
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
        var htmlContent = Markdown.ToHtml(cleanedMarkdown, _markdownPipeline);

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