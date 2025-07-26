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

public class PaginatedBlogPosts
{
    public List<BlogPost> Posts { get; set; } = new();
    public int CurrentPage { get; set; }
    public int TotalPages { get; set; }
    public int TotalPosts { get; set; }
    public int PageSize { get; set; }
    public bool HasPreviousPage { get; set; }
    public bool HasNextPage { get; set; }
}