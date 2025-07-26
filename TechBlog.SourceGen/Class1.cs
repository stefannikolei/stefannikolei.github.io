using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.Text;
using YamlDotNet.RepresentationModel;

namespace TechBlog.SourceGen;

[Generator]
public class BlogPostSourceGenerator : IIncrementalGenerator
{
    public void Initialize(IncrementalGeneratorInitializationContext context)
    {
        // Überwache alle Markdown-Dateien im BlogPosts Verzeichnis
        var markdownFiles = context.AdditionalTextsProvider
            .Where(file => file.Path.EndsWith(".md") && file.Path.Contains("BlogPosts"))
            .Collect();

        context.RegisterSourceOutput(markdownFiles, GenerateBlogPostList);
    }

    private static void GenerateBlogPostList(SourceProductionContext context, ImmutableArray<AdditionalText> markdownFiles)
    {
        try
        {
            var blogPosts = new List<BlogPostInfo>();

            foreach (var file in markdownFiles)
            {
                var text = file.GetText(context.CancellationToken)?.ToString();
                if (text == null) continue;

                var frontmatterMatch = Regex.Match(text, @"^---\r?\n(.*?)\r?\n---", RegexOptions.Singleline);
                if (!frontmatterMatch.Success) continue;

                try
                {
                    var yaml = new YamlStream();
                    yaml.Load(new StringReader(frontmatterMatch.Groups[1].Value));
                    
                    if (yaml.Documents.Count == 0) continue;
                    var mapping = yaml.Documents[0].RootNode as YamlMappingNode;
                    if (mapping == null) continue;

                    string title = GetYamlValue(mapping, "title");
                    
                    // Support both 'date' and 'publishDate' fields
                    string dateStr = GetYamlValue(mapping, "date");
                    if (string.IsNullOrEmpty(dateStr))
                    {
                        dateStr = GetYamlValue(mapping, "publishDate");
                    }
                    
                    // Support both 'tags' string and tags array
                    string tags = GetYamlValue(mapping, "tags");
                    if (string.IsNullOrEmpty(tags))
                    {
                        // Try to get tags as array
                        if (mapping.Children.TryGetValue(new YamlScalarNode("tags"), out var tagsNode))
                        {
                            if (tagsNode is YamlSequenceNode sequence)
                            {
                                tags = string.Join(", ", sequence.Children.Select(n => n.ToString().Trim('[', ']')));
                            }
                        }
                    }
                    
                    // Support both 'description' and 'summary' fields
                    string description = GetYamlValue(mapping, "description");
                    if (string.IsNullOrEmpty(description))
                    {
                        description = GetYamlValue(mapping, "summary");
                    }

                    var slug = GenerateSlug(title);

                    blogPosts.Add(new BlogPostInfo
                    {
                        Title = title,
                        Date = DateTime.TryParse(dateStr, out var dt) ? dt : DateTime.MinValue,
                        Tags = tags,
                        Description = description,
                        Slug = slug
                    });
                }
                catch
                {
                    // YAML parsing fehler ignorieren und weitermachen
                    continue;
                }
            }

            var sorted = blogPosts.OrderByDescending(x => x.Date).ToList();

            var sourceBuilder = new StringBuilder();
            sourceBuilder.AppendLine("using System;");
            sourceBuilder.AppendLine("using System.Collections.Generic;");
            sourceBuilder.AppendLine();
            sourceBuilder.AppendLine("namespace TechBlog.Generated");
            sourceBuilder.AppendLine("{");
            sourceBuilder.AppendLine("    public static class BlogPostList");
            sourceBuilder.AppendLine("    {");
            sourceBuilder.AppendLine("        public static IReadOnlyList<BlogPostMeta> All => new List<BlogPostMeta>");
            sourceBuilder.AppendLine("        {");

            for (int i = 0; i < sorted.Count; i++)
            {
                var bp = sorted[i];
                var comma = i < sorted.Count - 1 ? "," : "";
                sourceBuilder.AppendLine($"            new BlogPostMeta {{ Title = \"{EscapeString(bp.Title)}\", Date = DateTime.Parse(\"{bp.Date:yyyy-MM-dd}\"), Tags = \"{EscapeString(bp.Tags)}\", Description = \"{EscapeString(bp.Description)}\", Slug = \"{EscapeString(bp.Slug)}\" }}{comma}");
            }

            sourceBuilder.AppendLine("        };");
            sourceBuilder.AppendLine("    }");
            sourceBuilder.AppendLine();
            sourceBuilder.AppendLine("    public class BlogPostMeta");
            sourceBuilder.AppendLine("    {");
            sourceBuilder.AppendLine("        public string Title { get; set; } = \"\";");
            sourceBuilder.AppendLine("        public DateTime Date { get; set; }");
            sourceBuilder.AppendLine("        public string Tags { get; set; } = \"\";");
            sourceBuilder.AppendLine("        public string Description { get; set; } = \"\";");
            sourceBuilder.AppendLine("        public string Slug { get; set; } = \"\";");
            sourceBuilder.AppendLine("    }");
            sourceBuilder.AppendLine("}");

            context.AddSource("BlogPostList.g.cs", SourceText.From(sourceBuilder.ToString(), Encoding.UTF8));
        }
        catch
        {
            // Source Generator sollte niemals Exceptions werfen
            return;
        }
    }

    private static string GetYamlValue(YamlMappingNode mapping, string key)
    {
        return mapping.Children.TryGetValue(new YamlScalarNode(key), out var value) ? value.ToString() : "";
    }

    private static string EscapeString(string input)
    {
        return input.Replace("\"", "\\\"").Replace("\n", "\\n").Replace("\r", "\\r");
    }

    private static string GenerateSlug(string title)
    {
        var slug = title.ToLowerInvariant();
        slug = Regex.Replace(slug, "[^a-z0-9]+", "-");
        slug = slug.Trim('-');
        return slug;
    }

    private class BlogPostInfo
    {
        public string Title { get; set; } = "";
        public DateTime Date { get; set; }
        public string Tags { get; set; } = "";
        public string Description { get; set; } = "";
        public string Slug { get; set; } = "";
    }
}
