// Simple syntax highlighter for blog posts
// Minimal implementation to provide C# syntax highlighting

window.SimpleSyntaxHighlighter = (function() {
    
    // C# keywords and patterns
    const csharpKeywords = [
        'abstract', 'as', 'async', 'await', 'base', 'bool', 'break', 'byte', 'case', 'catch', 
        'char', 'checked', 'class', 'const', 'continue', 'decimal', 'default', 'delegate', 
        'do', 'double', 'else', 'enum', 'event', 'explicit', 'extern', 'false', 'finally', 
        'fixed', 'float', 'for', 'foreach', 'from', 'get', 'goto', 'if', 'implicit', 'in', 
        'int', 'interface', 'internal', 'into', 'is', 'let', 'lock', 'long', 'namespace', 
        'new', 'null', 'object', 'operator', 'orderby', 'out', 'override', 'params', 
        'partial', 'private', 'protected', 'public', 'readonly', 'ref', 'return', 'sbyte', 
        'sealed', 'select', 'set', 'short', 'sizeof', 'stackalloc', 'static', 'string', 
        'struct', 'switch', 'this', 'throw', 'true', 'try', 'typeof', 'uint', 'ulong', 
        'unchecked', 'unsafe', 'ushort', 'using', 'var', 'virtual', 'void', 'volatile', 
        'where', 'while', 'yield'
    ];

    const csharpTypes = [
        'bool', 'byte', 'char', 'decimal', 'double', 'float', 'int', 'long', 'object', 
        'sbyte', 'short', 'string', 'uint', 'ulong', 'ushort', 'void', 'Task', 'List', 
        'Dictionary', 'DateTime', 'TimeSpan', 'Exception', 'ArgumentException', 
        'ArgumentNullException', 'IEnumerable', 'IQueryable', 'HttpClient', 'CancellationToken'
    ];

    function escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, function(m) { return map[m]; });
    }

    function highlightCSharp(code) {
        // Escape HTML first
        code = escapeHtml(code);
        
        // Highlight comments
        code = code.replace(/\/\/.*$/gm, '<span class="token comment">$&</span>');
        code = code.replace(/\/\*[\s\S]*?\*\//g, '<span class="token comment">$&</span>');
        
        // Highlight strings
        code = code.replace(/"(?:[^"\\]|\\.)*"/g, '<span class="token string">$&</span>');
        code = code.replace(/'(?:[^'\\]|\\.)*'/g, '<span class="token string">$&</span>');
        code = code.replace(/@"(?:""|[^"])*"/g, '<span class="token string">$&</span>');
        
        // Highlight numbers
        code = code.replace(/\b\d+\.?\d*[fFdDmM]?\b/g, '<span class="token number">$&</span>');
        
        // Highlight keywords
        const keywordPattern = new RegExp('\\b(' + csharpKeywords.join('|') + ')\\b', 'g');
        code = code.replace(keywordPattern, '<span class="token keyword">$1</span>');
        
        // Highlight types
        const typePattern = new RegExp('\\b(' + csharpTypes.join('|') + ')\\b', 'g');
        code = code.replace(typePattern, '<span class="token class-name">$1</span>');
        
        // Highlight operators
        code = code.replace(/[+\-*/%=!<>&|^~?:;,{}[\]()\.]/g, '<span class="token punctuation">$&</span>');
        
        return code;
    }

    function highlightAll() {
        try {
            console.log('SimpleSyntaxHighlighter: Starting to highlight code blocks');
            
            // Find all possible code block structures
            const preCodeBlocks = document.querySelectorAll('pre code[class*="language-"]');
            const codeBlocks = document.querySelectorAll('code[class*="language-"]');
            const preElements = document.querySelectorAll('pre');
            const allCodeElements = document.querySelectorAll('code');
            
            console.log('SimpleSyntaxHighlighter: Found', preCodeBlocks.length, 'pre > code blocks with language class');
            console.log('SimpleSyntaxHighlighter: Found', codeBlocks.length, 'code blocks with language class');
            console.log('SimpleSyntaxHighlighter: Found', preElements.length, 'pre elements');
            console.log('SimpleSyntaxHighlighter: Found', allCodeElements.length, 'total code elements');
            
            // Debug: Log the structure of the first few code elements
            allCodeElements.forEach((code, index) => {
                if (index < 5) {
                    console.log(`SimpleSyntaxHighlighter: Code element ${index}:`, {
                        tagName: code.tagName,
                        className: code.className,
                        parentTagName: code.parentElement ? code.parentElement.tagName : null,
                        parentClassName: code.parentElement ? code.parentElement.className : null,
                        textContent: code.textContent.substring(0, 50) + '...',
                        hasLanguageClass: code.className.includes('language-')
                    });
                }
            });
            
            // Try to highlight any code blocks that look like they contain C# code
            let highlightedCount = 0;
            
            // First try the standard structure
            preCodeBlocks.forEach((block, index) => {
                const className = block.className;
                if (className.includes('language-csharp') || className.includes('language-cs')) {
                    const originalCode = block.textContent;
                    const highlightedCode = highlightCSharp(originalCode);
                    block.innerHTML = highlightedCode;
                    highlightedCount++;
                    console.log('SimpleSyntaxHighlighter: Highlighted pre>code C# block');
                }
            });
            
            // If no standard blocks found, try to identify C# code by content
            if (highlightedCount === 0) {
                allCodeElements.forEach((block, index) => {
                    const text = block.textContent.trim();
                    
                    // Simple heuristic to detect C# code
                    if (text.length > 50 && (
                        text.includes('using System') ||
                        text.includes('public class') ||
                        text.includes('public interface') ||
                        text.includes('namespace ') ||
                        text.includes('public async Task') ||
                        text.includes(': IRepository') ||
                        text.includes('=> ') ||
                        text.includes('?.')
                    )) {
                        console.log(`SimpleSyntaxHighlighter: Found C# code by heuristic in code element ${index}`);
                        
                        // Add language class and highlight
                        block.className = (block.className + ' language-csharp').trim();
                        const highlightedCode = highlightCSharp(text);
                        block.innerHTML = highlightedCode;
                        highlightedCount++;
                        
                        // Also style the parent as a code block if it's not already
                        if (block.parentElement && block.parentElement.tagName !== 'PRE') {
                            block.parentElement.style.display = 'block';
                            block.parentElement.style.backgroundColor = '#2d3748';
                            block.parentElement.style.padding = '1rem';
                            block.parentElement.style.borderRadius = '0.5rem';
                            block.parentElement.style.overflow = 'auto';
                        }
                    }
                });
            }
            
            console.log('SimpleSyntaxHighlighter: Completed highlighting, highlighted', highlightedCount, 'blocks');
        } catch (error) {
            console.error('SimpleSyntaxHighlighter: Error during highlighting:', error);
        }
    }

    // Auto-highlight when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', highlightAll);
    } else {
        // DOM is already ready
        setTimeout(highlightAll, 100);
    }

    return {
        highlightAll: highlightAll
    };
})();

console.log('SimpleSyntaxHighlighter loaded successfully');