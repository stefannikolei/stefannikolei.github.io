// Standalone syntax highlighter for C# code blocks
// Works independently without external Prism.js dependency

window.SimpleSyntaxHighlighter = (function() {
    
    // C# keywords for syntax highlighting
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
        'ArgumentNullException', 'IEnumerable', 'IQueryable', 'HttpClient', 'CancellationToken',
        'IRepository', 'ILogger', 'IMemoryCache', 'DbContext', 'DbSet'
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
        
        // Highlight comments (do this first to avoid conflicts)
        code = code.replace(/\/\/.*$/gm, '<span class="token comment">$&</span>');
        code = code.replace(/\/\*[\s\S]*?\*\//g, '<span class="token comment">$&</span>');
        code = code.replace(/\/\/\/ .*/g, '<span class="token comment">$&</span>');
        
        // Highlight strings (do this before keywords to avoid conflicts)
        code = code.replace(/"(?:[^"\\]|\\.)*"/g, '<span class="token string">$&</span>');
        code = code.replace(/'(?:[^'\\]|\\.)*'/g, '<span class="token string">$&</span>');
        code = code.replace(/@"(?:""|[^"])*"/g, '<span class="token string">$&</span>');
        code = code.replace(/\$"(?:[^"\\]|\\.)*"/g, '<span class="token string">$&</span>');
        
        // Highlight numbers
        code = code.replace(/\b\d+\.?\d*[fFdDmM]?\b/g, '<span class="token number">$&</span>');
        
        // Highlight keywords
        const keywordPattern = new RegExp('\\b(' + csharpKeywords.join('|') + ')\\b', 'g');
        code = code.replace(keywordPattern, '<span class="token keyword">$1</span>');
        
        // Highlight types
        const typePattern = new RegExp('\\b(' + csharpTypes.join('|') + ')\\b', 'g');
        code = code.replace(typePattern, '<span class="token class-name">$1</span>');
        
        // Highlight operators and punctuation
        code = code.replace(/[+\-*/%=!<>&|^~?:;,{}[\]()\.]/g, '<span class="token punctuation">$&</span>');
        
        return code;
    }
    
    function detectLanguage(code) {
        // Simple heuristics to detect programming language
        if (code.includes('using System') || 
            code.includes('public class') || 
            code.includes('public interface') ||
            code.includes('namespace ') ||
            /\b(public|private|protected|internal)\s+(static\s+)?(class|interface|struct|enum)\b/.test(code) ||
            /\b(var|string|int|bool|decimal|double|float|DateTime|Task)\s+\w+/.test(code)) {
            return 'csharp';
        }
        
        if (code.includes('function') || code.includes('const ') || code.includes('let ') || code.includes('=>')) {
            return 'javascript';
        }
        
        if (code.includes('<html') || code.includes('<!DOCTYPE') || /<\w+.*>/.test(code)) {
            return 'html';
        }
        
        return 'none';
    }

    function highlightAll() {
        try {
            console.log('SimpleSyntaxHighlighter: Starting syntax highlighting');
            
            // Find all code blocks
            const postContent = document.querySelector('.post-content') || 
                               document.querySelector('article') ||
                               document.querySelector('main') ||
                               document.body;
                               
            if (!postContent) {
                console.warn('No content container found');
                return;
            }
            
            // Find all pre > code blocks
            const codeBlocks = postContent.querySelectorAll('pre code');
            console.log('Found', codeBlocks.length, 'code blocks');
            
            let highlightedCount = 0;
            
            codeBlocks.forEach((block, index) => {
                try {
                    // Skip if already processed
                    if (block.classList.contains('syntax-highlighted')) {
                        return;
                    }
                    
                    const text = block.textContent.trim();
                    const parentPre = block.parentElement;
                    
                    if (!parentPre || parentPre.tagName !== 'PRE' || text.length < 10) {
                        return;
                    }
                    
                    console.log(`Processing code block ${index}:`, {
                        length: text.length,
                        className: block.className,
                        preview: text.substring(0, 50) + '...'
                    });
                    
                    // Determine language
                    let language = 'none';
                    
                    // Check if language is already specified in class
                    const languageMatch = block.className.match(/language-(\w+)/);
                    if (languageMatch) {
                        language = languageMatch[1];
                    } else {
                        // Auto-detect language
                        language = detectLanguage(text);
                        
                        // Add language class
                        if (language !== 'none') {
                            block.className = (block.className + ' language-' + language).trim();
                            parentPre.className = (parentPre.className + ' language-' + language).trim();
                        }
                    }
                    
                    // Apply syntax highlighting based on language
                    if (language === 'csharp' || language === 'cs') {
                        const highlightedCode = highlightCSharp(text);
                        block.innerHTML = highlightedCode;
                        highlightedCount++;
                        console.log(`Highlighted C# code block ${index}`);
                    } else if (language !== 'none') {
                        // For other languages, just add the class for CSS styling
                        console.log(`Added language class for ${language} in block ${index}`);
                    }
                    
                    // Mark as processed
                    block.classList.add('syntax-highlighted');
                    
                } catch (error) {
                    console.error(`Error processing code block ${index}:`, error);
                }
            });
            
            console.log(`SimpleSyntaxHighlighter: Completed. Highlighted ${highlightedCount} C# blocks`);
            
        } catch (error) {
            console.error('SimpleSyntaxHighlighter: Error during highlighting:', error);
        }
    }

    // Initialize
    function initialize() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(highlightAll, 100);
            });
        } else {
            setTimeout(highlightAll, 100);
        }
    }
    
    // Auto-initialize
    initialize();

    return {
        highlightAll: highlightAll
    };
})();

console.log('SimpleSyntaxHighlighter loaded successfully');