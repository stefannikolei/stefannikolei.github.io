// See https://aka.ms/new-console-template for more information

using TechBlog.Generated;

Console.WriteLine("Hello, World!");

var allPosts = BlogPostList.All;
Console.WriteLine($"Found {allPosts.Count} blog posts");
        
foreach (var post in allPosts)
{
    Console.WriteLine($"- {post.Title} ({post.FileName}) - {post.Date:yyyy-MM-dd}");
}