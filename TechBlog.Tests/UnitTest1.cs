using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.Text;
using System.Collections.Immutable;
using System.Text;
using TechBlog.SourceGen;
using Xunit;

namespace TechBlog.Tests;

public class BlogPostSourceGeneratorTests
{
    [Fact]
    public void GeneratesBlogPostList_WithValidMarkdownFiles()
    {
        // Arrange
        var markdownContent1 = """
            ---
            title: "Test Post 1"
            date: "2024-01-15"
            tags: "C#, Testing"
            description: "Test description 1"
            ---
            
            # Test Post 1
            Content here
            """;

        var markdownContent2 = """
            ---
            title: "Test Post 2"
            date: "2024-02-20"
            tags: "Source Generator"
            description: "Test description 2"
            ---
            
            # Test Post 2
            More content
            """;

        // Act
        var compilation = CreateCompilation();
        var generator = new BlogPostSourceGenerator();
        
        var driver = CSharpGeneratorDriver.Create(generator)
            .AddAdditionalTexts(ImmutableArray.Create<AdditionalText>(
                new TestAdditionalText("BlogPosts/test1.md", markdownContent1),
                new TestAdditionalText("BlogPosts/test2.md", markdownContent2)
            ));

        driver = driver.RunGenerators(compilation);
        var result = driver.GetRunResult();

        // Assert
        Assert.Single(result.Results);
        Assert.Empty(result.Diagnostics);
        
        var generatorResult = result.Results[0];
        Assert.Single(generatorResult.GeneratedSources);
        
        var generatedSource = generatorResult.GeneratedSources[0];
        Assert.Equal("BlogPostList.g.cs", generatedSource.HintName);
        
        var sourceText = generatedSource.SourceText.ToString();
        
        // Verify generated code contains expected content
        Assert.Contains("namespace TechBlog.Generated", sourceText);
        Assert.Contains("public static class BlogPostList", sourceText);
        Assert.Contains("Test Post 1", sourceText);
        Assert.Contains("Test Post 2", sourceText);
        Assert.Contains("2024-01-15", sourceText);
        Assert.Contains("2024-02-20", sourceText);
        
        // Verify ordering (newer posts first)
        var post1Index = sourceText.IndexOf("Test Post 1");
        var post2Index = sourceText.IndexOf("Test Post 2");
        Assert.True(post2Index < post1Index, "Posts should be ordered by date descending");
    }

    [Fact]
    public void HandlesInvalidYaml_Gracefully()
    {
        // Arrange
        var invalidMarkdownContent = """
            ---
            invalid yaml content
            no proper structure
            ---
            
            # Invalid Post
            Content here
            """;

        // Act
        var compilation = CreateCompilation();
        var generator = new BlogPostSourceGenerator();
        
        var driver = CSharpGeneratorDriver.Create(generator)
            .AddAdditionalTexts(ImmutableArray.Create<AdditionalText>(
                new TestAdditionalText("BlogPosts/invalid.md", invalidMarkdownContent)
            ));

        driver = driver.RunGenerators(compilation);
        var result = driver.GetRunResult();

        // Assert - Should not throw, should generate empty list
        Assert.Single(result.Results);
        Assert.Empty(result.Diagnostics);
        
        var generatorResult = result.Results[0];
        Assert.Single(generatorResult.GeneratedSources);
        
        var sourceText = generatorResult.GeneratedSources[0].SourceText.ToString();
        Assert.Contains("new List<BlogPostMeta>", sourceText);
    }

    [Fact]
    public void HandlesEmptyInput()
    {
        // Act
        var compilation = CreateCompilation();
        var generator = new BlogPostSourceGenerator();
        
        var driver = CSharpGeneratorDriver.Create(generator);
        var runResult = driver.RunGenerators(compilation);
        var result = runResult.GetRunResult();

        // Assert
        Assert.Single(result.Results);
        Assert.Empty(result.Diagnostics);
        
        var generatorResult = result.Results[0];
        Assert.Single(generatorResult.GeneratedSources);
        
        var sourceText = generatorResult.GeneratedSources[0].SourceText.ToString();
        Assert.Contains("new List<BlogPostMeta>", sourceText);
        Assert.Contains("{", sourceText); // Empty list
        Assert.Contains("};", sourceText);
    }

    [Fact]
    public void GeneratesCorrectSlug()
    {
        // This test requires access to the private GenerateSlug method
        // We'll test it indirectly through the full generation process
        
        // Arrange
        var markdownContent = """
            ---
            title: "Test Post With Special Characters & Numbers 123!"
            date: "2024-01-15"
            tags: "Testing"
            description: "Test description"
            ---
            
            # Test Post
            Content here
            """;

        // Act
        var compilation = CreateCompilation();
        var generator = new BlogPostSourceGenerator();
        
        var driver = CSharpGeneratorDriver.Create(generator)
            .AddAdditionalTexts(ImmutableArray.Create<AdditionalText>(
                new TestAdditionalText("BlogPosts/test.md", markdownContent)
            ));

        driver = driver.RunGenerators(compilation);
        var result = driver.GetRunResult();

        // Assert
        var sourceText = result.Results[0].GeneratedSources[0].SourceText.ToString();
        
        // Check that slug is generated correctly (lowercase, special chars replaced with dashes)
        Assert.Contains("test-post-with-special-characters-numbers-123", sourceText);
    }

    private static CSharpCompilation CreateCompilation()
    {
        var references = new List<MetadataReference>
        {
            MetadataReference.CreateFromFile(typeof(object).Assembly.Location),
            MetadataReference.CreateFromFile(typeof(System.Collections.Generic.List<>).Assembly.Location),
            MetadataReference.CreateFromFile(typeof(System.DateTime).Assembly.Location),
            MetadataReference.CreateFromFile(typeof(System.Linq.Enumerable).Assembly.Location)
        };

        // Add YamlDotNet reference
        try
        {
            var yamlDotNetAssembly = typeof(YamlDotNet.RepresentationModel.YamlStream).Assembly;
            references.Add(MetadataReference.CreateFromFile(yamlDotNetAssembly.Location));
        }
        catch
        {
            // Fallback if YamlDotNet is not available
        }

        return CSharpCompilation.Create(
            "TestAssembly",
            syntaxTrees: new[] { CSharpSyntaxTree.ParseText("") },
            references: references,
            options: new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary)
        );
    }
}

// Helper class for creating test additional text files
public class TestAdditionalText : AdditionalText
{
    private readonly string _path;
    private readonly string _content;

    public TestAdditionalText(string path, string content)
    {
        _path = path;
        _content = content;
    }

    public override string Path => _path;

    public override SourceText GetText(CancellationToken cancellationToken = default)
    {
        return SourceText.From(_content, Encoding.UTF8);
    }
}
