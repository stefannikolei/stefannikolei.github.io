using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using System.Collections.Immutable;
using System.Reflection;
using TechBlog.SourceGen;
using Xunit;

namespace TechBlog.Tests;

public class BlogPostSourceGeneratorIntegrationTests
{
    [Fact]
    public void GeneratesBlogPostList_WithRealMarkdownFiles()
    {
        // Arrange
        var compilation = CreateCompilation();
        var generator = new BlogPostSourceGenerator();
        
        // Use the actual test markdown files in the BlogPosts directory
        var testFiles = Directory.GetFiles("BlogPosts", "*.md", SearchOption.AllDirectories);
        var additionalTexts = testFiles
            .Select(file => new TestAdditionalText(file, File.ReadAllText(file)))
            .ToImmutableArray<AdditionalText>();

        // Act
        var driver = CSharpGeneratorDriver.Create(generator)
            .AddAdditionalTexts(additionalTexts);

        driver = driver.RunGenerators(compilation);
        var result = driver.GetRunResult();

        // Assert
        Assert.Single(result.Results);
        Assert.Empty(result.Diagnostics);
        
        var generatorResult = result.Results[0];
        Assert.Single(generatorResult.GeneratedSources);
        
        var generatedSource = generatorResult.GeneratedSources[0];
        var sourceText = generatedSource.SourceText.ToString();
        
        // Write generated source to output for debugging
        Console.WriteLine("Generated Source:");
        Console.WriteLine(sourceText);
        
        // Verify structure
        Assert.Contains("namespace TechBlog.Generated", sourceText);
        Assert.Contains("public static class BlogPostList", sourceText);
        Assert.Contains("public static IReadOnlyList<BlogPostMeta> All", sourceText);
        
        // Verify test posts are included
        Assert.Contains("Erster Test Blog Post", sourceText);
        Assert.Contains("Zweiter Test Blog Post", sourceText);
    }

    [Fact]
    public void CanCompileGeneratedCode()
    {
        // Arrange
        var compilation = CreateCompilation();
        var generator = new BlogPostSourceGenerator();
        
        var testFiles = Directory.GetFiles("BlogPosts", "*.md", SearchOption.AllDirectories);
        var additionalTexts = testFiles
            .Select(file => new TestAdditionalText(file, File.ReadAllText(file)))
            .ToImmutableArray<AdditionalText>();

        // Act
        var driver = CSharpGeneratorDriver.Create(generator)
            .AddAdditionalTexts(additionalTexts);

        driver = driver.RunGenerators(compilation);
        var result = driver.GetRunResult();

        // Get the generated source and try to compile it
        var generatedSource = result.Results[0].GeneratedSources[0];
        var syntaxTree = CSharpSyntaxTree.ParseText(generatedSource.SourceText);
        
        var testCompilation = compilation.AddSyntaxTrees(syntaxTree);
        
        // Assert - should compile without errors
        var diagnostics = testCompilation.GetDiagnostics();
        var errors = diagnostics.Where(d => d.Severity == DiagnosticSeverity.Error).ToArray();
        
        Assert.Empty(errors);
    }

    [Fact]
    public void GeneratedCodeCanBeUsedAtRuntime()
    {
        // This test demonstrates how the generated code would be used
        // Note: In a real scenario, this would be tested in the consuming project
        
        // Arrange
        var compilation = CreateCompilation();
        var generator = new BlogPostSourceGenerator();
        
        var markdownContent = """
            ---
            title: "Runtime Test Post"
            date: "2024-03-01"
            tags: "Runtime, Testing"
            description: "Testing runtime usage"
            ---
            
            # Runtime Test
            Content here
            """;

        var driver = CSharpGeneratorDriver.Create(generator)
            .AddAdditionalTexts(ImmutableArray.Create<AdditionalText>(
                new TestAdditionalText("BlogPosts/runtime-test.md", markdownContent)
            ));

        driver = driver.RunGenerators(compilation);
        var result = driver.GetRunResult();

        // Act & Assert
        var generatedSource = result.Results[0].GeneratedSources[0];
        var sourceText = generatedSource.SourceText.ToString();
        
        // Verify the generated code structure matches expected runtime usage
        Assert.Contains("public static IReadOnlyList<BlogPostMeta> All", sourceText);
        Assert.Contains("new BlogPostMeta", sourceText);
        Assert.Contains("Runtime Test Post", sourceText);
        Assert.Contains("2024-03-01", sourceText);
        Assert.Contains("runtime-test-post", sourceText); // slug
    }

    private static CSharpCompilation CreateCompilation()
    {
        var references = new List<MetadataReference>
        {
            MetadataReference.CreateFromFile(typeof(object).Assembly.Location),
            MetadataReference.CreateFromFile(typeof(Console).Assembly.Location),
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

        // Add reference to System.Runtime if available
        try
        {
            var systemRuntime = Assembly.Load("System.Runtime");
            references.Add(MetadataReference.CreateFromFile(systemRuntime.Location));
        }
        catch
        {
            // Ignore if not available
        }

        return CSharpCompilation.Create(
            "TestAssembly",
            syntaxTrees: Array.Empty<SyntaxTree>(),
            references: references,
            options: new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary)
        );
    }
}
