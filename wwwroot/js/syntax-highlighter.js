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
            
            // Find all code blocks with language classes
            const codeBlocks = document.querySelectorAll('pre code[class*="language-"]');
            console.log('SimpleSyntaxHighlighter: Found', codeBlocks.length, 'code blocks');
            
            codeBlocks.forEach((block, index) => {
                const className = block.className;
                console.log('SimpleSyntaxHighlighter: Processing block', index, 'with class', className);
                
                if (className.includes('language-csharp') || className.includes('language-cs')) {
                    const originalCode = block.textContent;
                    const highlightedCode = highlightCSharp(originalCode);
                    block.innerHTML = highlightedCode;
                    console.log('SimpleSyntaxHighlighter: Highlighted C# code block');
                }
            });
            
            console.log('SimpleSyntaxHighlighter: Completed highlighting');
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