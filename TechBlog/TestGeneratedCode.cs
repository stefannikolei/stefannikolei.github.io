using TechBlog.Generated;

namespace TechBlog;

// Test-Klasse um zu prüfen ob der Source Generator funktioniert
public static class TestGeneratedCode
{
    public static void TestBlogPostList()
    {
        var allPosts = BlogPostList.All;
        Console.WriteLine($"Found {allPosts.Count} blog posts");
        
        foreach (var post in allPosts)
        {
            Console.WriteLine($"- {post.Title} ({post.Slug}) - {post.Date:yyyy-MM-dd}");
        }
    }
}
