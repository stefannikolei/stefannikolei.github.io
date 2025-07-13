/* PrismJS 1.29.0 - Core + Languages */
var _self = (typeof window !== 'undefined')
	? window   // if in browser
	: (
		(typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope)
		? self // if in worker
		: {}   // if in node js
	);

var Prism = (function (_self) {
    // Private helper vars
    var lang = /(?:^|\s)lang(?:uage)?-([\w-]+)(?=\s|$)/i;
    var uniqueId = 0;

    var Prism = {
        manual: false,
        disableWorkerMessageHandler: false,

        util: {
            encode: function encode(tokens) {
                if (tokens instanceof Token) {
                    return new Token(tokens.type, encode(tokens.content), tokens.alias);
                } else if (Array.isArray(tokens)) {
                    return tokens.map(encode);
                } else {
                    return tokens.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\u00a0/g, ' ');
                }
            },

            type: function (o) {
                return Object.prototype.toString.call(o).slice(8, -1);
            },

            objId: function (obj) {
                if (!obj['__id']) {
                    Object.defineProperty(obj, '__id', { value: ++uniqueId });
                }
                return obj['__id'];
            },

            clone: function deepClone(o, visited) {
                visited = visited || {};

                var clone, id;
                switch (Prism.util.type(o)) {
                    case 'Object':
                        id = Prism.util.objId(o);
                        if (visited[id]) {
                            return visited[id];
                        }
                        clone = {};
                        visited[id] = clone;

                        for (var key in o) {
                            if (o.hasOwnProperty(key)) {
                                clone[key] = deepClone(o[key], visited);
                            }
                        }

                        return clone;

                    case 'Array':
                        id = Prism.util.objId(o);
                        if (visited[id]) {
                            return visited[id];
                        }
                        clone = [];
                        visited[id] = clone;

                        o.forEach(function (v, i) {
                            clone[i] = deepClone(v, visited);
                        });

                        return clone;

                    default:
                        return o;
                }
            },

            getLanguage: function (element) {
                var m;
                while (element) {
                    m = lang.exec(element.className);
                    if (m) {
                        return m[1].toLowerCase();
                    }
                    element = element.parentElement;
                }
                return 'none';
            },

            setLanguage: function (element, language) {
                element.className = element.className.replace(RegExp(lang, 'gi'), '');
                element.classList.add('language-' + language);
            }
        },

        languages: {
            plain: {},
            plaintext: {},
            text: {},
            txt: {}
        },

        plugins: {},

        highlightAll: function (async, callback) {
            Prism.highlightAllUnder(document, async, callback);
        },

        highlightAllUnder: function (container, async, callback) {
            var env = {
                callback: callback,
                container: container,
                selector: 'code[class*="language-"], [class*="language-"] code, code[class*="lang-"], [class*="lang-"] code'
            };

            var elements = container.querySelectorAll(env.selector);
            var i = 0, element;

            for (; element = elements[i++];) {
                Prism.highlightElement(element, async === true, env.callback);
            }
        },

        highlightElement: function (element, async, callback) {
            var language = Prism.util.getLanguage(element);
            var grammar = Prism.languages[language];

            Prism.util.setLanguage(element, language);

            var parent = element.parentElement;
            if (parent && parent.nodeName.toLowerCase() === 'pre') {
                Prism.util.setLanguage(parent, language);
            }

            var code = element.textContent;

            var env = {
                element: element,
                language: language,
                grammar: grammar,
                code: code
            };

            if (!code || !grammar) {
                if (callback) {
                    callback.call(element);
                }
                return;
            }

            env.highlightedCode = Prism.highlight(code, grammar, language);

            element.innerHTML = env.highlightedCode;

            if (callback) {
                callback.call(element);
            }
        },

        highlight: function (text, grammar, language) {
            var env = {
                code: text,
                grammar: grammar,
                language: language
            };
            var tokens = Prism.tokenize(env.code, env.grammar);
            return Token.stringify(Prism.util.encode(tokens), env.language);
        },

        tokenize: function (text, grammar) {
            var rest = grammar.rest;
            if (rest) {
                for (var token in rest) {
                    grammar[token] = rest[token];
                }
                delete grammar.rest;
            }

            var tokenList = new LinkedList();
            addAfter(tokenList, tokenList.head, text);

            matchGrammar(text, tokenList, grammar, tokenList.head, 0);

            return toArray(tokenList);
        }
    };

    var Token = Prism.Token = function (type, content, alias, matchedStr) {
        this.type = type;
        this.content = content;
        this.alias = alias;
        this.length = (matchedStr || '').length | 0;
    };

    Token.stringify = function stringify(o, language) {
        if (typeof o == 'string') {
            return o;
        }
        if (Array.isArray(o)) {
            var s = '';
            o.forEach(function (e) {
                s += stringify(e, language);
            });
            return s;
        }

        var env = {
            type: o.type,
            content: stringify(o.content, language),
            tag: 'span',
            classes: ['token', o.type],
            attributes: {},
            language: language
        };

        var aliases = o.alias;
        if (aliases) {
            if (Array.isArray(aliases)) {
                Array.prototype.push.apply(env.classes, aliases);
            } else {
                env.classes.push(aliases);
            }
        }

        var attributes = '';
        for (var name in env.attributes) {
            attributes += ' ' + name + '="' + (env.attributes[name] || '').replace(/"/g, '&quot;') + '"';
        }

        return '<' + env.tag + ' class="' + env.classes.join(' ') + '"' + attributes + '>' + env.content + '</' + env.tag + '>';
    };

    // Linked list implementation
    function LinkedList() {
        var head = { value: null, prev: null, next: null };
        var tail = { value: null, prev: head, next: null };
        head.next = tail;

        this.head = head;
        this.tail = tail;
        this.length = 0;
    }

    function addAfter(list, node, value) {
        var next = node.next;
        var newNode = { value: value, prev: node, next: next };
        node.next = newNode;
        next.prev = newNode;
        list.length++;
        return newNode;
    }

    function toArray(list) {
        var array = [];
        var node = list.head.next;
        while (node !== list.tail) {
            array.push(node.value);
            node = node.next;
        }
        return array;
    }

    function matchGrammar(text, tokenList, grammar, startNode, startPos, rematch) {
        for (var token in grammar) {
            if (!grammar.hasOwnProperty(token) || !grammar[token]) {
                continue;
            }

            var patterns = grammar[token];
            patterns = Array.isArray(patterns) ? patterns : [patterns];

            for (var j = 0; j < patterns.length; ++j) {
                if (rematch && rematch.cause == token + ',' + j) {
                    return;
                }

                var patternObj = patterns[j];
                var inside = patternObj.inside;
                var lookbehind = !!patternObj.lookbehind;
                var greedy = !!patternObj.greedy;
                var alias = patternObj.alias;

                if (greedy && !patternObj.pattern.global) {
                    var flags = patternObj.pattern.toString().match(/[imsuy]*$/)[0];
                    patternObj.pattern = RegExp(patternObj.pattern.source, flags + 'g');
                }

                var pattern = patternObj.pattern || patternObj;

                for (var currentNode = startNode.next, pos = startPos; currentNode !== tokenList.tail; pos += currentNode.value.length, currentNode = currentNode.next) {
                    if (rematch && pos >= rematch.reach) {
                        break;
                    }

                    var str = currentNode.value;

                    if (tokenList.length > text.length) {
                        return;
                    }

                    if (str instanceof Token) {
                        continue;
                    }

                    var removeCount = 1;
                    var match;

                    if (greedy) {
                        match = pattern.exec(text.slice(pos));
                        if (!match || match.index >= str.length) {
                            break;
                        }

                        var from = match.index;
                        var to = match.index + match[0].length;
                        var p = pos;

                        p += currentNode.value.length;
                        while (from >= p) {
                            currentNode = currentNode.next;
                            p += currentNode.value.length;
                        }

                        p -= currentNode.value.length;
                        pos = p;

                        if (currentNode.value instanceof Token) {
                            continue;
                        }

                        for (var k = currentNode; k !== tokenList.tail && (p < to || typeof k.value === 'string'); k = k.next) {
                            removeCount++;
                            p += k.value.length;
                        }
                        removeCount--;

                        str = text.slice(pos, p);
                        match.index -= pos;
                    } else {
                        match = pattern.exec(str);
                    }

                    if (!match) {
                        continue;
                    }

                    if (lookbehind) {
                        var lookbehindLength = match[1] ? match[1].length : 0;
                        var from = match.index + lookbehindLength;
                        var matchStr = match[0].slice(lookbehindLength);
                        var to = from + matchStr.length;
                        var before = str.slice(0, from);
                        var after = str.slice(to);

                        var reach = pos + str.length;
                        if (rematch && reach > rematch.reach) {
                            rematch.reach = reach;
                        }

                        var removeFrom = currentNode.prev;

                        if (before) {
                            removeFrom = addAfter(tokenList, removeFrom, before);
                            pos += before.length;
                        }

                        removeRange(tokenList, removeFrom, removeCount);

                        var wrapped = new Token(token, inside ? Prism.tokenize(matchStr, inside) : matchStr, alias, matchStr);
                        currentNode = addAfter(tokenList, removeFrom, wrapped);

                        if (after) {
                            addAfter(tokenList, currentNode, after);
                        }

                        if (removeCount > 1) {
                            var nestedRematch = {
                                cause: token + ',' + j,
                                reach: reach
                            };
                            matchGrammar(text, tokenList, grammar, currentNode.prev, pos, nestedRematch);
                            if (rematch && nestedRematch.reach > rematch.reach) {
                                rematch.reach = nestedRematch.reach;
                            }
                        }
                    }
                }
            }
        }
    }

    function removeRange(list, start, count) {
        var next = start.next;
        for (var i = 0; i < count && next !== list.tail; i++) {
            var current = next;
            next = next.next;
            current.prev.next = current.next;
            current.next.prev = current.prev;
            list.length--;
        }
    }

    // Add common languages
    Prism.languages.csharp = Prism.languages.extend('clike', {
        'string': [
            {
                pattern: /@"(?:""|\\[\s\S]|[^\\"])*"(?!")/,
                greedy: true
            },
            {
                pattern: /"(?:\\.|[^\\"\r\n])*"/,
                greedy: true
            }
        ],
        'class-name': [
            {
                pattern: /(\b(?:class|enum|interface|struct)\s+)(?!(?:abstract|as|base|bool|break|byte|case|catch|char|checked|const|continue|decimal|default|delegate|do|double|else|event|explicit|extern|false|finally|fixed|float|for|foreach|goto|if|implicit|in|int|internal|is|lock|long|namespace|new|null|object|operator|out|override|params|private|protected|public|readonly|ref|return|sbyte|sealed|short|sizeof|stackalloc|static|string|switch|this|throw|true|try|typeof|uint|ulong|unchecked|unsafe|ushort|using|virtual|void|volatile|while)\b)\w+(?:\.\w+)*)/,
                lookbehind: true,
                inside: {
                    punctuation: /\./
                }
            },
            {
                pattern: /(\b(?:new|typeof)\s+)\w+(?:\.\w+)*/,
                lookbehind: true,
                inside: {
                    punctuation: /\./
                }
            }
        ],
        'keyword': /\b(?:abstract|as|async|await|base|bool|break|byte|case|catch|char|checked|class|const|continue|decimal|default|delegate|do|double|else|enum|event|explicit|extern|false|finally|fixed|float|for|foreach|from|get|goto|if|implicit|in|int|interface|internal|into|is|let|lock|long|namespace|new|null|object|operator|orderby|out|override|params|partial|private|protected|public|readonly|ref|return|sbyte|sealed|select|set|short|sizeof|stackalloc|static|string|struct|switch|this|throw|true|try|typeof|uint|ulong|unchecked|unsafe|ushort|using|var|virtual|void|volatile|where|while|yield)\b/,
        'function': /\b[a-z_]\w*(?=\s*(?:\.\s*[a-z_]\w*)*\s*\()/i,
        'number': /(?:\b0(?:x[\da-f_]*[\da-f]|b[01_]*[01])|(?:\B\.\d+(?:_+\d+)*|\b\d+(?:_+\d+)*(?:\.\d+(?:_+\d+)*)?)(?:e[-+]?\d+(?:_+\d+)*)?)(?:ul|lu|[dflmu])?\b/i,
        'operator': />>=?|<<=?|[-=]>|[-+*/%&|^]|[<>]=?|[!?]=?|&&|\|\||--|[+][+]|[=]=?|&=|\|=|\^=|<<=?|>>=?|[/][/]/,
        'punctuation': /\?\.?|::|[{}[\];(),.:]/
    });

    Prism.languages.javascript = Prism.languages.extend('clike', {
        'class-name': [
            Prism.languages.clike['class-name'],
            {
                pattern: /(^|[^$\w\xA0-\uFFFF])(?!\s)[_$A-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\.(?:constructor|prototype))/,
                lookbehind: true
            }
        ],
        'keyword': [
            {
                pattern: /((?:^|\})\s*)catch\b/,
                lookbehind: true
            },
            {
                pattern: /(^|[^.]|\.\.\.\s*)\b(?:as|async(?=\s*(?:function\b|\(|[$\w\xA0-\uFFFF]|$))|await|break|case|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally(?=\s*(?:\{|$))|for|from(?=\s*(?:['"]|$))|function|(?:get|set)(?=\s*(?:[#\[$\w\xA0-\uFFFF]|$))|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|static|super|switch|this|throw|try|typeof|undefined|var|void|while|with|yield)\b/,
                lookbehind: true
            }
        ],
        'function': /#?(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*(?:\.\s*(?:apply|bind|call)\s*)?\()/,
        'number': {
            pattern: RegExp(
                /(^|[^\w$])/.source +
                '(?:' +
                (/NaN|Infinity/.source +
                '|' +
                /0[bB][01]+(?:_[01]+)*n?/.source +
                '|' +
                /0[oO][0-7]+(?:_[0-7]+)*n?/.source +
                '|' +
                /0[xX][\dA-Fa-f]+(?:_[\dA-Fa-f]+)*n?/.source +
                '|' +
                /\d+(?:_\d+)*n/.source +
                '|' +
                /(?:\d+(?:_\d+)*(?:\.(?:\d+(?:_\d+)*)?)?|\.\d+(?:_\d+)*)(?:[Ee][+-]?\d+(?:_\d+)*)?/.source) +
                ')' +
                /(?![\w$])/.source
            ),
            lookbehind: true
        },
        'operator': /--|\+\+|\*\*=?|=>|&&=?|\|\|=?|[!=]==|<<=?|>>>?=?|[-+*/%&|^!=<>]=?|\.{3}|\?\?=?|\?\.?|[~:]/
    });

    Prism.languages.js = Prism.languages.javascript;

    // Add other common languages
    Prism.languages.css = {
        'comment': /\/\*[\s\S]*?\*\//,
        'atrule': {
            pattern: /@[\w-](?:[^;{\s]|\s+(?![\s{]))*(?:;|(?=\s*\{))/,
            inside: {
                'rule': /^@[\w-]+/,
                'selector-function-argument': {
                    pattern: /(\bselector\s*\(\s*(?![\s)]))(?:[^()\s]|\s+(?![\s)])|\((?:[^()]|\([^()]*\))*\))+(?=\s*\))/,
                    lookbehind: true,
                    alias: 'selector'
                },
                'keyword': {
                    pattern: /(^|[^\w-])(?:and|not|only|or)(?![\w-])/,
                    lookbehind: true
                }
            }
        },
        'url': {
            pattern: RegExp('\\burl\\((?:' + /"(?:[^\\\r\n"]|\\[\s\S])*"/.source + '|' + /'(?:[^\\\r\n']|\\[\s\S])*'/.source + '|' + /(?:[^\\\r\n"'()]|\\[\s\S])*/.source + ')\\)', 'i'),
            greedy: true,
            inside: {
                'function': /^url/i,
                'punctuation': /^\(|\)$/,
                'string': {
                    pattern: RegExp('^' + /"(?:[^\\\r\n"]|\\[\s\S])*"/.source + '$|' + '^' + /'(?:[^\\\r\n']|\\[\s\S])*'/.source + '$'),
                    alias: 'url'
                }
            }
        },
        'selector': {
            pattern: RegExp('(^|[{}\\s])[^{}\\s](?:[^{};"\'\\s]|\\s+(?![\\s{])|' + /"(?:[^\\\r\n"]|\\[\s\S])*"/.source + '|' + /'(?:[^\\\r\n']|\\[\s\S])*'/.source + ')*(?=\\s*\\{)'),
            lookbehind: true
        },
        'string': {
            pattern: /"(?:[^\\\r\n"]|\\[\s\S])*"|'(?:[^\\\r\n']|\\[\s\S])*'/,
            greedy: true
        },
        'property': {
            pattern: /(^|[^-\w\xA0-\uFFFF])(?!\s)[-_a-z\xA0-\uFFFF](?:(?!\s)[-\w\xA0-\uFFFF])*(?=\s*:)/i,
            lookbehind: true
        },
        'important': /!important\b/i,
        'function': {
            pattern: /(^|[^-a-z0-9])[-a-z0-9]+(?=\()/i,
            lookbehind: true
        },
        'punctuation': /[(){};:,]/
    };

    // HTML/XML
    Prism.languages.markup = {
        'comment': {
            pattern: /<!--(?:(?!<!--)[\s\S])*?-->/,
            greedy: true
        },
        'prolog': {
            pattern: /<\?[\s\S]+?\?>/,
            greedy: true
        },
        'doctype': {
            pattern: /<!DOCTYPE(?:[^>"'[\]]|"[^"]*"|'[^']*')+(?:\[(?:[^<"'\]]|"[^"]*"|'[^']*'|<(?!!--)|<!--(?:[^-]|-(?!->))*-->)*\]\s*)?>/i,
            greedy: true,
            inside: {
                'internal-subset': {
                    pattern: /(^[^\[]*\[)[\s\S]+(?=\]>$)/,
                    lookbehind: true,
                    greedy: true,
                    inside: null
                },
                'string': {
                    pattern: /"[^"]*"|'[^']*'/,
                    greedy: true
                },
                'punctuation': /^<!|>$|[[\]]/,
                'doctype-tag': /^DOCTYPE/i,
                'name': /[^\s<>'"]+/
            }
        },
        'cdata': {
            pattern: /<!\[CDATA\[[\s\S]*?\]\]>/i,
            greedy: true
        },
        'tag': {
            pattern: /<\/?(?!\d)[^\s>\/=$<%]+(?:\s(?:\s*[^\s>\/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+(?=[\s>]))|(?=[\s/>])))+)?\s*\/?>/,
            greedy: true,
            inside: {
                'tag': {
                    pattern: /^<\/?[^\s>\/]+/,
                    inside: {
                        'punctuation': /^<\/?/,
                        'namespace': /^[^\s>\/:]+:/
                    }
                },
                'special-attr': [],
                'attr-value': {
                    pattern: /=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+)/,
                    inside: {
                        'punctuation': [
                            {
                                pattern: /^=/,
                                alias: 'attr-equals'
                            },
                            /"|'/
                        ]
                    }
                },
                'punctuation': /\/?>/,
                'attr-name': {
                    pattern: /[^\s>\/]+/,
                    inside: {
                        'namespace': /^[^\s>\/:]+:/
                    }
                }
            }
        },
        'entity': [
            {
                pattern: /&[\da-z]{1,8};/i,
                alias: 'named-entity'
            },
            /&#x?[\da-f]{1,8};/i
        ]
    };

    Prism.languages.html = Prism.languages.markup;
    Prism.languages.xml = Prism.languages.extend('markup', {});

    // JSON
    Prism.languages.json = {
        'property': {
            pattern: /(^|[^\\])"(?:\\.|[^\\"\r\n])*"(?=\s*:)/,
            lookbehind: true,
            greedy: true
        },
        'string': {
            pattern: /(^|[^\\])"(?:\\.|[^\\"\r\n])*"(?!\s*:)/,
            lookbehind: true,
            greedy: true
        },
        'comment': {
            pattern: /\/\/.*|\/\*[\s\S]*?(?:\*\/|$)/,
            greedy: true
        },
        'number': /-?\b\d+(?:\.\d+)?(?:e[+-]?\d+)?\b/i,
        'punctuation': /[{}[\],]/,
        'operator': /:/,
        'boolean': /\b(?:false|true)\b/,
        'null': {
            pattern: /\bnull\b/,
            alias: 'keyword'
        }
    };

    // Auto-highlight when DOM is ready
    if (!Prism.manual && typeof document !== 'undefined') {
        if (document.readyState !== 'loading') {
            if (window.requestAnimationFrame) {
                window.requestAnimationFrame(Prism.highlightAll);
            } else {
                window.setTimeout(Prism.highlightAll, 16);
            }
        } else {
            document.addEventListener('DOMContentLoaded', Prism.highlightAll);
        }
    }

    return Prism;

})(_self);

// Ensure Prism is available globally
if (typeof window !== 'undefined') {
    window.Prism = Prism;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Prism;
}

if (typeof global !== 'undefined') {
    global.Prism = Prism;
}

// Debug message
console.log('Prism.js loaded, highlightAll function available:', typeof Prism.highlightAll);