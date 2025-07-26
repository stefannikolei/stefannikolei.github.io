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
        // Überwache alle Markdown-Dateien - wir filtern später
        var markdownFiles = context.AdditionalTextsProvider
            .Where(file => file.Path.EndsWith(".md"))
            .Collect();

        context.RegisterSourceOutput(markdownFiles, GenerateBlogPostList);
    }

    private static void GenerateBlogPostList(SourceProductionContext context, ImmutableArray<AdditionalText> markdownFiles)
    {
        try
        {
            var blogPosts = new List<BlogPostInfo>();

            // Debug-Informationen sammeln
            var debugInfo = new StringBuilder();
            debugInfo.AppendLine("// Source Generator Debug Info:");
            debugInfo.AppendLine($"// Found {markdownFiles.Length} markdown files:");
            
            foreach (var file in markdownFiles)
            {
                debugInfo.AppendLine($"// - {file.Path}");
                
                // Filtere nur Blog Post Dateien (die "BlogPosts" im Pfad enthalten)
                if (!IsBlogPostFile(file.Path))
                {
                    debugInfo.AppendLine($"//   → Skipped (not in BlogPosts directory)");
                    continue;
                }
                
                debugInfo.AppendLine($"//   → Processing as blog post");

                var text = file.GetText(context.CancellationToken)?.ToString();
                if (text == null) 
                {
                    debugInfo.AppendLine($"//   → Error: Could not read file content");
                    continue;
                }

                var frontmatterMatch = Regex.Match(text, @"^---\r?\n(.*?)\r?\n---", RegexOptions.Singleline);
                if (!frontmatterMatch.Success) 
                {
                    debugInfo.AppendLine($"//   → Error: No frontmatter found");
                    continue;
                }

                try
                {
                    var yaml = new YamlStream();
                    yaml.Load(new StringReader(frontmatterMatch.Groups[1].Value));
                    
                    if (yaml.Documents.Count == 0) 
                    {
                        debugInfo.AppendLine($"//   → Error: No YAML documents");
                        continue;
                    }
                    var mapping = yaml.Documents[0].RootNode as YamlMappingNode;
                    if (mapping == null) 
                    {
                        debugInfo.AppendLine($"//   → Error: YAML root is not a mapping");
                        continue;
                    }

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

                    
                    blogPosts.Add(new BlogPostInfo
                    {
                        Title = title,
                        Date = DateTime.TryParse(dateStr, out var dt) ? dt : DateTime.MinValue,
                        Tags = tags,
                        Description = description,
                        FileName = Path.GetFileNameWithoutExtension(file.Path)
                    });
                    
                    debugInfo.AppendLine($"//   → Successfully parsed: '{title}'");
                }
                catch (Exception ex)
                {
                    debugInfo.AppendLine($"//   → YAML parsing error: {ex.Message}");
                }
            }

            var sorted = blogPosts.OrderByDescending(x => x.Date).ToList();

            var sourceBuilder = new StringBuilder();
            sourceBuilder.AppendLine(debugInfo.ToString());
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
                sourceBuilder.AppendLine($"            new BlogPostMeta {{ Title = \"{EscapeString(bp.Title)}\", Date = DateTime.Parse(\"{bp.Date:yyyy-MM-dd}\"), Tags = \"{EscapeString(bp.Tags)}\", Description = \"{EscapeString(bp.Description)}\", FileName = \"{EscapeString(bp.FileName)}\" }}{comma}");
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
            sourceBuilder.AppendLine("        public string FileName { get; set; } = \"\";");
            sourceBuilder.AppendLine("    }");
            sourceBuilder.AppendLine("}");

            context.AddSource("BlogPostList.g.cs", SourceText.From(sourceBuilder.ToString(), Encoding.UTF8));
        }
        catch (Exception ex)
        {
            // Fallback: Generiere leere Liste mit Fehler-Info
            var errorSource = $@"// Source Generator Error: {ex.Message}
using System;
using System.Collections.Generic;

namespace TechBlog.Generated
{{
    public static class BlogPostList
    {{
        public static IReadOnlyList<BlogPostMeta> All => new List<BlogPostMeta>();
    }}

    public class BlogPostMeta
    {{
        public string Title {{ get; set; }} = """";
        public DateTime Date {{ get; set; }}
        public string Tags {{ get; set; }} = """";
        public string Description {{ get; set; }} = """";
        public string FileName {{ get; set; }} = """";
    }}
}}";
            context.AddSource("BlogPostList.g.cs", SourceText.From(errorSource, Encoding.UTF8));
        }
    }

    private static bool IsBlogPostFile(string filePath)
    {
        // Normalisiere Pfade für Vergleich
        var normalizedPath = filePath.Replace('\\', '/');
        
        // Prüfe ob die Datei im BlogPosts-Verzeichnis liegt
        return normalizedPath.IndexOf("BlogPosts", StringComparison.OrdinalIgnoreCase) >= 0;
    }

    private static string GetYamlValue(YamlMappingNode mapping, string key)
    {
        return mapping.Children.TryGetValue(new YamlScalarNode(key), out var value) ? value.ToString() : "";
    }

    private static string EscapeString(string input)
    {
        return input.Replace("\"", "\\\"").Replace("\n", "\\n").Replace("\r", "\\r");
    }

    private class BlogPostInfo
    {
        public string Title { get; set; } = "";
        public DateTime Date { get; set; }
        public string Tags { get; set; } = "";
        public string Description { get; set; } = "";
        public string FileName { get; set; } = "";
    }
}
