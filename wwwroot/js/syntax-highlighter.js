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
            
            // Find all possible code block structures with detailed logging
            const preCodeBlocks = document.querySelectorAll('pre code[class*="language-"]');
            const codeBlocks = document.querySelectorAll('code[class*="language-"]');
            const preElements = document.querySelectorAll('pre');
            const allCodeElements = document.querySelectorAll('code');
            const allPreElements = document.querySelectorAll('pre');
            
            console.log('SimpleSyntaxHighlighter: Found', preCodeBlocks.length, 'pre > code blocks with language class');
            console.log('SimpleSyntaxHighlighter: Found', codeBlocks.length, 'code blocks with language class');
            console.log('SimpleSyntaxHighlighter: Found', preElements.length, 'pre elements');
            console.log('SimpleSyntaxHighlighter: Found', allCodeElements.length, 'total code elements');
            console.log('SimpleSyntaxHighlighter: Found', allPreElements.length, 'total pre elements');
            
            // Debug: Show the actual DOM structure
            console.log('SimpleSyntaxHighlighter: DOM inspection:');
            
            // Try multiple ways to find post content
            const postContent = document.querySelector('.post-content') || 
                               document.querySelector('article') ||
                               document.querySelector('main');
                               
            if (postContent) {
                console.log('Post content found. Sample HTML:', postContent.innerHTML.substring(0, 500));
                
                // Look for pre elements specifically in post content
                const postPres = postContent.querySelectorAll('pre');
                const postCodes = postContent.querySelectorAll('code');
                console.log('Found', postPres.length, 'pre elements in post content');
                console.log('Found', postCodes.length, 'code elements in post content');
                
                // Inspect first pre element if it exists
                if (postPres.length > 0) {
                    const firstPre = postPres[0];
                    console.log('First pre element:', {
                        outerHTML: firstPre.outerHTML.substring(0, 200),
                        className: firstPre.className,
                        children: firstPre.children.length,
                        firstChildTag: firstPre.children[0] ? firstPre.children[0].tagName : 'none',
                        firstChildClass: firstPre.children[0] ? firstPre.children[0].className : 'none'
                    });
                }
            } else {
                console.log('Post content not found! Available elements:');
                console.log('- Articles:', document.querySelectorAll('article').length);
                console.log('- Mains:', document.querySelectorAll('main').length);
                console.log('- .post-content:', document.querySelectorAll('.post-content').length);
                
                // Try to find any content with code
                const bodyCode = document.querySelectorAll('body code');
                const bodyPre = document.querySelectorAll('body pre');
                console.log('- Body code elements:', bodyCode.length);
                console.log('- Body pre elements:', bodyPre.length);
            }
            
            // Debug: Log the structure of the first few code elements
            allCodeElements.forEach((code, index) => {
                if (index < 3) {
                    console.log(`SimpleSyntaxHighlighter: Code element ${index}:`, {
                        tagName: code.tagName,
                        className: code.className,
                        parentTagName: code.parentElement ? code.parentElement.tagName : null,
                        parentClassName: code.parentElement ? code.parentElement.className : null,
                        textContent: code.textContent.substring(0, 100) + '...',
                        hasLanguageClass: code.className.includes('language-'),
                        outerHTML: code.outerHTML.substring(0, 150) + '...'
                    });
                }
            });
            
            // Try to highlight any code blocks that look like they contain C# code
            let highlightedCount = 0;
            
            // First try the standard structure: pre > code with language class
            preCodeBlocks.forEach((block, index) => {
                const className = block.className;
                if (className.includes('language-csharp') || className.includes('language-cs')) {
                    const originalCode = block.textContent;
                    const highlightedCode = highlightCSharp(originalCode);
                    block.innerHTML = highlightedCode;
                    highlightedCount++;
                    console.log('SimpleSyntaxHighlighter: Highlighted pre>code C# block', index);
                }
            });
            
            // Try direct code elements with language class
            if (highlightedCount === 0) {
                codeBlocks.forEach((block, index) => {
                    const className = block.className;
                    if (className.includes('language-csharp') || className.includes('language-cs')) {
                        const originalCode = block.textContent;
                        const highlightedCode = highlightCSharp(originalCode);
                        block.innerHTML = highlightedCode;
                        highlightedCount++;
                        console.log('SimpleSyntaxHighlighter: Highlighted direct code C# block', index);
                    }
                });
            }
            
            // If no standard blocks found, try to find pre > code blocks without language class but in post content
            if (highlightedCount === 0) {
                const contentContainer = postContent || document.body;
                const postPreCodes = contentContainer.querySelectorAll('pre code');
                console.log('Found', postPreCodes.length, 'pre > code blocks in content container (without language filter)');
                
                postPreCodes.forEach((block, index) => {
                    const text = block.textContent.trim();
                    console.log(`Examining pre > code block ${index}:`, {
                        className: block.className,
                        parentClassName: block.parentElement ? block.parentElement.className : '',
                        textLength: text.length,
                        startsWith: text.substring(0, 50)
                    });
                    
                    // Simple heuristic to detect C# code and add highlighting
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
                        console.log(`SimpleSyntaxHighlighter: Found C# code by heuristic in pre > code block ${index}`);
                        
                        // Add language class and highlight
                        block.className = (block.className + ' language-csharp').trim();
                        const highlightedCode = highlightCSharp(text);
                        block.innerHTML = highlightedCode;
                        highlightedCount++;
                    }
                });
            }
            
            // If still no blocks found, try to identify C# code by content in any code element
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