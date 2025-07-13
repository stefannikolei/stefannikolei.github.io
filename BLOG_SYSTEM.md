# Blog System Documentation

This Blazor WebAssembly blog now uses a dynamic Markdown-based system for managing blog posts.

## Adding New Blog Posts

To add a new blog post, follow these steps:

1. **Create a Markdown file** in the `wwwroot/Content/BlogPosts/` directory with a descriptive filename (e.g., `my-new-post.md`)

2. **Add front matter** at the top of the file with the required metadata:

```markdown
---
title: "Your Blog Post Title"
publishDate: 2025-07-13
tags: [Technology, Programming, Blazor]
summary: "A brief summary of your blog post that will appear in the blog listing."
readingTimeMinutes: 5
---

# Your Blog Post Content

Write your blog post content here using standard Markdown syntax.

## Subheadings

You can use all standard Markdown features:
- Lists
- **Bold text**
- *Italic text*
- [Links](https://example.com)
- Code blocks
- And more!
```

3. **Update the BlogPostService** to include your new post slug in the `postSlugs` array in the `GetAllPostsAsync()` method:

```csharp
var postSlugs = new[] { "welcome", "blazor-static-sites", "your-new-post" };
```

4. **Build and test** your changes locally before deploying.

## Front Matter Fields

- `title`: The title of the blog post (required)
- `publishDate`: Publication date in YYYY-MM-DD format (required)
- `tags`: Array of tags for categorization (optional)
- `summary`: Brief description shown in blog listing (optional but recommended)
- `readingTimeMinutes`: Estimated reading time in minutes (optional, defaults to 3)

## File Structure

```
wwwroot/
  Content/
    BlogPosts/
      welcome.md
      blazor-static-sites.md
      your-new-post.md
```

## Features

- ✅ Markdown content with front matter metadata
- ✅ Dynamic blog post loading and display
- ✅ Responsive design with proper styling
- ✅ SEO-friendly page titles
- ✅ Tag support and reading time estimation
- ✅ Automatic date formatting
- ✅ Back navigation to blog overview

## Technical Details

The blog system uses:
- **Markdig** for Markdown processing with advanced extensions
- **BlogPostService** for content loading and parsing
- **BlogPost model** for structured data representation
- **Dynamic routing** with `/blog/{slug}` pattern
- **Caching** for improved performance