namespace TechBlog.Models;

public class BlogPost
{
    public string Title { get; set; } = string.Empty;
    public DateTime PublishDate { get; set; }
    public List<string> Tags { get; set; } = new();
    public string Content { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Summary { get; set; }
    public int ReadingTimeMinutes { get; set; }
}

public class BlogPostMetadata
{
    public string Title { get; set; } = string.Empty;
    public DateTime PublishDate { get; set; }
    public List<string> Tags { get; set; } = new();
    public string? Summary { get; set; }
    public int ReadingTimeMinutes { get; set; } = 3;
}