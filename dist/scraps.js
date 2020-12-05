function toJSONWithFuncs(obj) { Object.prototype.toJSON = function() { var sobj = {}, i; for (i in this) if (this.hasOwnProperty(i)) sobj[i] = typeof this[i] == 'function' ? this[i].toString() : this[i]; return sobj; }; var str = JSON.stringify(obj); delete Object.prototype.toJSON; return str; }

(function() {
'use strict';
/**
 * Create html element
 * @param {String} type html element 
 * @param {Object} config
 */
function  createElement(type, config) {
  const htmlElement = document.createElement(type);

  if (config === undefined) {
    return htmlElement;
  }

  if (config.className) {
    htmlElement.className = config.className;
  }

  if (config.content) {
    htmlElement.textContent = config.content;
  }

  if (config.children) {
    config.children.forEach((el) => {
      if (el !== null) {
        htmlElement.appendChild(el);
      }
    });
  }

  return htmlElement; 
}


/**
 * @param {Object} node
 * @return {HTMLElement}
 */
function createExpandedElement(node) {
  const iElem = createElement('i');

  if (node.expanded) {
    iElem.className = 'fas fa-caret-down';
  } else {
    iElem.className = 'fas fa-caret-right';
  }

  const caretElem = createElement('div', {
    className: 'caret-icon',
    children: [iElem],
  });

  const handleClick = node.toggle.bind(node);
  caretElem.addEventListener('click', handleClick);

  const indexElem = createElement('div', {
    className: 'json-index',
    content: node.key,
  });

  const typeElem = createElement('div', {
    className: 'json-type',
    content: node.type,
  });

  const keyElem = createElement('div', {
    className: 'json-key',
    content: node.key,
  });

  const sizeElem = createElement('div', {
    className: 'json-size'
  });

  if (node.type === 'array') {
    let types = [];
    node.children.forEach(function(c){
      if (types.indexOf(c.type) === -1){
        types.push(c.type);
      }
    });
    sizeElem.innerText = `Array< ${types.join(', ')} > ${node.children.length} items`;
  } else if (node.type === 'object') {
    sizeElem.innerText = '{' + node.children.length + '}';
  }

  let lineChildren=[];
  if (node.key === null) {
    lineChildren = [typeElem, sizeElem]
  } else if (node.parent.type === 'array') {
    lineChildren = [indexElem, sizeElem]
  } else {
    lineChildren = [keyElem, sizeElem]
  }
  if (node.children.length){
    lineChildren.unshift(caretElem);
  }

  const lineElem = createElement('div', {
    className: 'line',
    children: lineChildren
  });

  if (node.depth > 0) {
    lineElem.style = 'margin-left: ' + node.depth * 24 + 'px;';
  }

  return lineElem;
}


/**
 * @param {Object} node
 * @return {HTMLElement}
 */
function createNotExpandedElement(node) {
  const caretElem = createElement('div', {
    className: 'empty-icon',
  });

  const keyElem = createElement('div', {
    className: 'json-key',
    content: node.key
  });

  const separatorElement = createElement('div', {
    className: 'json-separator',
    content: ':'
  });

  const valueType = ' json-' + typeof node.value;
  const valueContent = String(node.value);
  const valueElement = createElement('div', {
    className: 'json-value' + valueType,
    content: valueContent
  });

  const lineElem = createElement('div', {
    className: 'line',
    children: [caretElem, keyElem, separatorElement, valueElement]
  });

  if (node.depth > 0) {
    lineElem.style = 'margin-left: ' + node.depth * 24 + 'px;';
  }

  return lineElem;
}


/**
 * create tree node
 * @return {Object}
 */
function createNode() {
  return {
    key: null,
    parent: null,
    value: null,
    expanded: false,
    type: null,
    children: null,
    elem: null,
    depth: 0,

    setCaretIconRight() {
      const icon = this.elem.querySelector('.fas');
      icon.classList.replace('fa-caret-down', 'fa-caret-right');
    },

    setCaretIconDown() {
      const icon = this.elem.querySelector('.fas');
      icon.classList.replace('fa-caret-right', 'fa-caret-down');
    },

    hideChildren() {
      if (this.children !== null) {
        this.children.forEach((item) => {
          item.elem.classList.add('hide');
          if (item.expanded) {
            item.hideChildren();
          }
        });
      }
    },

    showChildren() {
      if (this.children !== null) {
        this.children.forEach((item) => {
          item.elem.classList.remove('hide');
          if (item.expanded) {
            item.showChildren();
          }
        });
      }
    },

    toggle: function() {
      if (this.expanded) {
        this.expanded = false;
        this.hideChildren();
        this.setCaretIconRight();
      } else {
        this.expanded = true;
        this.showChildren();
        this.setCaretIconDown();
      }
    }
  }
}


/**
 * Return object length
 * @param {Object} obj
 * @return {number}
 */
function getLength(obj) {
  let length = 0;
  for (let key in obj) {
    length += 1;
  }
  return length;
}


/**
 * Return variable type
 * @param {*} val
 */
function getType(val) {
  let type = typeof val;
  if (Array.isArray(val)) {
    type = 'array';
  } else if (val === null) {
    type = 'null';
  }
  return type;
}


/**
 * Recursively traverse json object
 * @param {Object} obj parsed json object
 * @param {Object} parent of object tree
 */
function traverseObject(obj, parent) {
  for (let key in obj) {
    const child = createNode();
    child.parent = parent;
    child.key = key;
    child.type = getType(obj[key]);
    child.depth = parent.depth + 1;
    child.expanded = false;

    if (typeof obj[key] === 'object') {
      child.children = [];
      parent.children.push(child);
      traverseObject(obj[key], child);
      child.elem = createExpandedElement(child);
    } else {
      child.value = obj[key];
      child.elem = createNotExpandedElement(child);
      parent.children.push(child);
    }
  }
}


/**
 * Create root of a tree
 * @param {Object} obj Json object
 * @return {Object}
 */
function createTree(obj) {
  const tree = createNode();
  tree.type = getType(obj);
  tree.children = [];
  tree.expanded = true;

  traverseObject(obj, tree);
  tree.elem = createExpandedElement(tree);

  return tree;
}


/**
 * Recursively traverse Tree object
 * @param {Object} node
 * @param {Callback} callback
 */
function traverseTree(node, callback) {
  callback(node);
  if (node.children !== null) {
    node.children.forEach((item) => {
      traverseTree(item, callback);
    });
  }
}


/**
 * Render Tree object
 * @param {Object} tree
 * @param {String} targetElem
 */
function render(tree, targetElem) {
  let rootElem;
 if (targetElem) {
    rootElem = targetElem;
  } else {
    rootElem = document.body;
  }

  traverseTree(tree, (node) => {
    if (!node.expanded) {
      node.hideChildren();
    }
    rootElem.appendChild(node.elem);
  });
}


/* Export jsonView object */
window.jsonView = {
  /**
   * Render JSON into DOM container
   * @param {String} jsonData
   * @param {String} targetElem
   */
  format: function(jsonData, targetElem) {
  //  const parsedData = JSON.parse(jsonData);
    const tree = createTree(typeof jsonData==='string'?JSON.parse(jsonData):jsonData);
    render(tree, targetElem);
  }
}

})();
/* PrismJS 1.17.1
https://prismjs.com/download.html#themes=prism&languages=markup+css+clike+javascript+typescript */
var _self = "undefined" != typeof window ? window : "undefined" != typeof WorkerGlobalScope && self instanceof WorkerGlobalScope ? self : {},
    Prism = function (u) {
        var c = /\blang(?:uage)?-([\w-]+)\b/i, a = 0;
        var _ = {
            manual: u.Prism && u.Prism.manual,
            disableWorkerMessageHandler: u.Prism && u.Prism.disableWorkerMessageHandler,
            util: {
                encode: function (e) {
                    return e instanceof L ? new L(e.type, _.util.encode(e.content), e.alias) : Array.isArray(e) ? e.map(_.util.encode) : e.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/\u00a0/g, " ")
                }, type: function (e) {
                    return Object.prototype.toString.call(e).slice(8, -1)
                }, objId: function (e) {
                    return e.__id || Object.defineProperty(e, "__id", {value: ++a}), e.__id
                }, clone: function n(e, r) {
                    var t, a, i = _.util.type(e);
                    switch (r = r || {}, i) {
                        case"Object":
                            if (a = _.util.objId(e), r[a]) return r[a];
                            for (var o in t = {}, r[a] = t, e) e.hasOwnProperty(o) && (t[o] = n(e[o], r));
                            return t;
                        case"Array":
                            return a = _.util.objId(e), r[a] ? r[a] : (t = [], r[a] = t, e.forEach(function (e, a) {
                                t[a] = n(e, r)
                            }), t);
                        default:
                            return e
                    }
                }
            },
            languages: {
                extend: function (e, a) {
                    var n = _.util.clone(_.languages[e]);
                    for (var r in a) n[r] = a[r];
                    return n
                }, insertBefore: function (n, e, a, r) {
                    var t = (r = r || _.languages)[n], i = {};
                    for (var o in t) if (t.hasOwnProperty(o)) {
                        if (o == e) for (var l in a) a.hasOwnProperty(l) && (i[l] = a[l]);
                        a.hasOwnProperty(o) || (i[o] = t[o])
                    }
                    var s = r[n];
                    return r[n] = i, _.languages.DFS(_.languages, function (e, a) {
                        a === s && e != n && (this[e] = i)
                    }), i
                }, DFS: function e(a, n, r, t) {
                    t = t || {};
                    var i = _.util.objId;
                    for (var o in a) if (a.hasOwnProperty(o)) {
                        n.call(a, o, a[o], r || o);
                        var l = a[o], s = _.util.type(l);
                        "Object" !== s || t[i(l)] ? "Array" !== s || t[i(l)] || (t[i(l)] = !0, e(l, n, o, t)) : (t[i(l)] = !0, e(l, n, null, t))
                    }
                }
            },
            plugins: {},
            highlightAll: function (e, a) {
                _.highlightAllUnder(document, e, a)
            },
            highlightAllUnder: function (e, a, n) {
                var r = {
                    callback: n,
                    selector: 'code[class*="language-"], [class*="language-"] code, code[class*="lang-"], [class*="lang-"] code'
                };
                _.hooks.run("before-highlightall", r);
                for (var t, i = e.querySelectorAll(r.selector), o = 0; t = i[o++];) _.highlightElement(t, !0 === a, r.callback)
            },
            highlightElement: function (e, a, n) {
                var r = function (e) {
                    for (; e && !c.test(e.className);) e = e.parentNode;
                    return e ? (e.className.match(c) || [, "none"])[1].toLowerCase() : "none"
                }(e), t = _.languages[r];
                e.className = e.className.replace(c, "").replace(/\s+/g, " ") + " language-" + r;
                var i = e.parentNode;
                i && "pre" === i.nodeName.toLowerCase() && (i.className = i.className.replace(c, "").replace(/\s+/g, " ") + " language-" + r);
                var o = {element: e, language: r, grammar: t, code: e.textContent};

                function l(e) {
                    o.highlightedCode = e, _.hooks.run("before-insert", o), o.element.innerHTML = o.highlightedCode, _.hooks.run("after-highlight", o), _.hooks.run("complete", o), n && n.call(o.element)
                }

                if (_.hooks.run("before-sanity-check", o), !o.code) return _.hooks.run("complete", o), void (n && n.call(o.element));
                if (_.hooks.run("before-highlight", o), o.grammar) if (a && u.Worker) {
                    var s = new Worker(_.filename);
                    s.onmessage = function (e) {
                        l(e.data)
                    }, s.postMessage(JSON.stringify({language: o.language, code: o.code, immediateClose: !0}))
                } else l(_.highlight(o.code, o.grammar, o.language)); else l(_.util.encode(o.code))
            },
            highlight: function (e, a, n) {
                var r = {code: e, grammar: a, language: n};
                return _.hooks.run("before-tokenize", r), r.tokens = _.tokenize(r.code, r.grammar), _.hooks.run("after-tokenize", r), L.stringify(_.util.encode(r.tokens), r.language)
            },
            matchGrammar: function (e, a, n, r, t, i, o) {
                for (var l in n) if (n.hasOwnProperty(l) && n[l]) {
                    var s = n[l];
                    s = Array.isArray(s) ? s : [s];
                    for (var u = 0; u < s.length; ++u) {
                        if (o && o == l + "," + u) return;
                        var c = s[u], g = c.inside, f = !!c.lookbehind, h = !!c.greedy, d = 0, m = c.alias;
                        if (h && !c.pattern.global) {
                            var p = c.pattern.toString().match(/[imsuy]*$/)[0];
                            c.pattern = RegExp(c.pattern.source, p + "g")
                        }
                        c = c.pattern || c;
                        for (var y = r, v = t; y < a.length; v += a[y].length, ++y) {
                            var k = a[y];
                            if (a.length > e.length) return;
                            if (!(k instanceof L)) {
                                if (h && y != a.length - 1) {
                                    if (c.lastIndex = v, !(x = c.exec(e))) break;
                                    for (var b = x.index + (f && x[1] ? x[1].length : 0), w = x.index + x[0].length, A = y, P = v, O = a.length; A < O && (P < w || !a[A].type && !a[A - 1].greedy); ++A) (P += a[A].length) <= b && (++y, v = P);
                                    if (a[y] instanceof L) continue;
                                    j = A - y, k = e.slice(v, P), x.index -= v
                                } else {
                                    c.lastIndex = 0;
                                    var x = c.exec(k), j = 1
                                }
                                if (x) {
                                    f && (d = x[1] ? x[1].length : 0);
                                    w = (b = x.index + d) + (x = x[0].slice(d)).length;
                                    var N = k.slice(0, b), S = k.slice(w), C = [y, j];
                                    N && (++y, v += N.length, C.push(N));
                                    var E = new L(l, g ? _.tokenize(x, g) : x, m, x, h);
                                    if (C.push(E), S && C.push(S), Array.prototype.splice.apply(a, C), 1 != j && _.matchGrammar(e, a, n, y, v, !0, l + "," + u), i) break
                                } else if (i) break
                            }
                        }
                    }
                }
            },
            tokenize: function (e, a) {
                var n = [e], r = a.rest;
                if (r) {
                    for (var t in r) a[t] = r[t];
                    delete a.rest
                }
                return _.matchGrammar(e, n, a, 0, 0, !1), n
            },
            hooks: {
                all: {}, add: function (e, a) {
                    var n = _.hooks.all;
                    n[e] = n[e] || [], n[e].push(a)
                }, run: function (e, a) {
                    var n = _.hooks.all[e];
                    if (n && n.length) for (var r, t = 0; r = n[t++];) r(a)
                }
            },
            Token: L
        };

        function L(e, a, n, r, t) {
            this.type = e, this.content = a, this.alias = n, this.length = 0 | (r || "").length, this.greedy = !!t
        }

        if (u.Prism = _, L.stringify = function (e, a) {
            if ("string" == typeof e) return e;
            if (Array.isArray(e)) return e.map(function (e) {
                return L.stringify(e, a)
            }).join("");
            var n = {
                type: e.type,
                content: L.stringify(e.content, a),
                tag: "span",
                classes: ["token", e.type],
                attributes: {},
                language: a
            };
            if (e.alias) {
                var r = Array.isArray(e.alias) ? e.alias : [e.alias];
                Array.prototype.push.apply(n.classes, r)
            }
            _.hooks.run("wrap", n);
            var t = Object.keys(n.attributes).map(function (e) {
                return e + '="' + (n.attributes[e] || "").replace(/"/g, "&quot;") + '"'
            }).join(" ");
            return "<" + n.tag + ' class="' + n.classes.join(" ") + '"' + (t ? " " + t : "") + ">" + n.content + "</" + n.tag + ">"
        }, !u.document) return u.addEventListener && (_.disableWorkerMessageHandler || u.addEventListener("message", function (e) {
            var a = JSON.parse(e.data), n = a.language, r = a.code, t = a.immediateClose;
            u.postMessage(_.highlight(r, _.languages[n], n)), t && u.close()
        }, !1)), _;
        var e = document.currentScript || [].slice.call(document.getElementsByTagName("script")).pop();
        if (e && (_.filename = e.src, e.hasAttribute("data-manual") && (_.manual = !0)), !_.manual) {
            function n() {
                _.manual || _.highlightAll()
            }

            "loading" !== document.readyState ? window.requestAnimationFrame ? window.requestAnimationFrame(n) : window.setTimeout(n, 16) : document.addEventListener("DOMContentLoaded", n)
        }
        return _
    }(_self);
"undefined" != typeof module && module.exports && (module.exports = Prism), "undefined" != typeof global && (global.Prism = Prism);
Prism.languages.markup = {
    comment: /<!--[\s\S]*?-->/,
    prolog: /<\?[\s\S]+?\?>/,
    doctype: /<!DOCTYPE[\s\S]+?>/i,
    cdata: /<!\[CDATA\[[\s\S]*?]]>/i,
    tag: {
        pattern: /<\/?(?!\d)[^\s>\/=$<%]+(?:\s(?:\s*[^\s>\/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+(?=[\s>]))|(?=[\s/>])))+)?\s*\/?>/i,
        greedy: !0,
        inside: {
            tag: {pattern: /^<\/?[^\s>\/]+/i, inside: {punctuation: /^<\/?/, namespace: /^[^\s>\/:]+:/}},
            "attr-value": {
                pattern: /=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+)/i,
                inside: {punctuation: [/^=/, {pattern: /^(\s*)["']|["']$/, lookbehind: !0}]}
            },
            punctuation: /\/?>/,
            "attr-name": {pattern: /[^\s>\/]+/, inside: {namespace: /^[^\s>\/:]+:/}}
        }
    },
    entity: /&#?[\da-z]{1,8};/i
}, Prism.languages.markup.tag.inside["attr-value"].inside.entity = Prism.languages.markup.entity, Prism.hooks.add("wrap", function (a) {
    "entity" === a.type && (a.attributes.title = a.content.replace(/&amp;/, "&"))
}), Object.defineProperty(Prism.languages.markup.tag, "addInlined", {
    value: function (a, e) {
        var s = {};
        s["language-" + e] = {
            pattern: /(^<!\[CDATA\[)[\s\S]+?(?=\]\]>$)/i,
            lookbehind: !0,
            inside: Prism.languages[e]
        }, s.cdata = /^<!\[CDATA\[|\]\]>$/i;
        var n = {"included-cdata": {pattern: /<!\[CDATA\[[\s\S]*?\]\]>/i, inside: s}};
        n["language-" + e] = {pattern: /[\s\S]+/, inside: Prism.languages[e]};
        var i = {};
        i[a] = {
            pattern: RegExp("(<__[\\s\\S]*?>)(?:<!\\[CDATA\\[[\\s\\S]*?\\]\\]>\\s*|[\\s\\S])*?(?=<\\/__>)".replace(/__/g, a), "i"),
            lookbehind: !0,
            greedy: !0,
            inside: n
        }, Prism.languages.insertBefore("markup", "cdata", i)
    }
}), Prism.languages.xml = Prism.languages.extend("markup", {}), Prism.languages.html = Prism.languages.markup, Prism.languages.mathml = Prism.languages.markup, Prism.languages.svg = Prism.languages.markup;
!function (s) {
    var t = /("|')(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/;
    s.languages.css = {
        comment: /\/\*[\s\S]*?\*\//,
        atrule: {pattern: /@[\w-]+[\s\S]*?(?:;|(?=\s*\{))/, inside: {rule: /@[\w-]+/}},
        url: {
            pattern: RegExp("url\\((?:" + t.source + "|[^\n\r()]*)\\)", "i"),
            inside: {function: /^url/i, punctuation: /^\(|\)$/}
        },
        selector: RegExp("[^{}\\s](?:[^{};\"']|" + t.source + ")*?(?=\\s*\\{)"),
        string: {pattern: t, greedy: !0},
        property: /[-_a-z\xA0-\uFFFF][-\w\xA0-\uFFFF]*(?=\s*:)/i,
        important: /!important\b/i,
        function: /[-a-z0-9]+(?=\()/i,
        punctuation: /[(){};:,]/
    }, s.languages.css.atrule.inside.rest = s.languages.css;
    var e = s.languages.markup;
    e && (e.tag.addInlined("style", "css"), s.languages.insertBefore("inside", "attr-value", {
        "style-attr": {
            pattern: /\s*style=("|')(?:\\[\s\S]|(?!\1)[^\\])*\1/i,
            inside: {
                "attr-name": {pattern: /^\s*style/i, inside: e.tag.inside},
                punctuation: /^\s*=\s*['"]|['"]\s*$/,
                "attr-value": {pattern: /.+/i, inside: s.languages.css}
            },
            alias: "language-css"
        }
    }, e.tag))
}(Prism);
Prism.languages.clike = {
    comment: [{
        pattern: /(^|[^\\])\/\*[\s\S]*?(?:\*\/|$)/,
        lookbehind: !0
    }, {pattern: /(^|[^\\:])\/\/.*/, lookbehind: !0, greedy: !0}],
    string: {pattern: /(["'])(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/, greedy: !0},
    "class-name": {
        pattern: /((?:\b(?:class|interface|extends|implements|trait|instanceof|new)\s+)|(?:catch\s+\())[\w.\\]+/i,
        lookbehind: !0,
        inside: {punctuation: /[.\\]/}
    },
    keyword: /\b(?:if|else|while|do|for|return|in|instanceof|function|new|try|throw|catch|finally|null|break|continue)\b/,
    boolean: /\b(?:true|false)\b/,
    function: /\w+(?=\()/,
    number: /\b0x[\da-f]+\b|(?:\b\d+\.?\d*|\B\.\d+)(?:e[+-]?\d+)?/i,
    operator: /--?|\+\+?|!=?=?|<=?|>=?|==?=?|&&?|\|\|?|\?|\*|\/|~|\^|%/,
    punctuation: /[{}[\];(),.:]/
};
Prism.languages.javascript = Prism.languages.extend("clike", {
    "class-name": [Prism.languages.clike["class-name"], {
        pattern: /(^|[^$\w\xA0-\uFFFF])[_$A-Z\xA0-\uFFFF][$\w\xA0-\uFFFF]*(?=\.(?:prototype|constructor))/,
        lookbehind: !0
    }],
    keyword: [{
        pattern: /((?:^|})\s*)(?:catch|finally)\b/,
        lookbehind: !0
    }, {
        pattern: /(^|[^.])\b(?:as|async(?=\s*(?:function\b|\(|[$\w\xA0-\uFFFF]|$))|await|break|case|class|const|continue|debugger|default|delete|do|else|enum|export|extends|for|from|function|get|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|set|static|super|switch|this|throw|try|typeof|undefined|var|void|while|with|yield)\b/,
        lookbehind: !0
    }],
    number: /\b(?:(?:0[xX](?:[\dA-Fa-f](?:_[\dA-Fa-f])?)+|0[bB](?:[01](?:_[01])?)+|0[oO](?:[0-7](?:_[0-7])?)+)n?|(?:\d(?:_\d)?)+n|NaN|Infinity)\b|(?:\b(?:\d(?:_\d)?)+\.?(?:\d(?:_\d)?)*|\B\.(?:\d(?:_\d)?)+)(?:[Ee][+-]?(?:\d(?:_\d)?)+)?/,
    function: /#?[_$a-zA-Z\xA0-\uFFFF][$\w\xA0-\uFFFF]*(?=\s*(?:\.\s*(?:apply|bind|call)\s*)?\()/,
    operator: /-[-=]?|\+[+=]?|!=?=?|<<?=?|>>?>?=?|=(?:==?|>)?|&[&=]?|\|[|=]?|\*\*?=?|\/=?|~|\^=?|%=?|\?|\.{3}/
}), Prism.languages.javascript["class-name"][0].pattern = /(\b(?:class|interface|extends|implements|instanceof|new|oak)\s+)[\w.\\]+/, Prism.languages.insertBefore("javascript", "keyword", {
    regex: {
        pattern: /((?:^|[^$\w\xA0-\uFFFF."'\])\s])\s*)\/(\[(?:[^\]\\\r\n]|\\.)*]|\\.|[^/\\\[\r\n])+\/[gimyus]{0,6}(?=\s*($|[\r\n,.;})\]]))/,
        lookbehind: !0,
        greedy: !0
    },
    "function-variable": {
        pattern: /#?[_$a-zA-Z\xA0-\uFFFF][$\w\xA0-\uFFFF]*(?=\s*[=:]\s*(?:async\s*)?(?:\bfunction\b|(?:\((?:[^()]|\([^()]*\))*\)|[_$a-zA-Z\xA0-\uFFFF][$\w\xA0-\uFFFF]*)\s*=>))/,
        alias: "function"
    },
    parameter: [{
        pattern: /(function(?:\s+[_$A-Za-z\xA0-\uFFFF][$\w\xA0-\uFFFF]*)?\s*\(\s*)(?!\s)(?:[^()]|\([^()]*\))+?(?=\s*\))/,
        lookbehind: !0,
        inside: Prism.languages.javascript
    }, {
        pattern: /[_$a-z\xA0-\uFFFF][$\w\xA0-\uFFFF]*(?=\s*=>)/i,
        inside: Prism.languages.javascript
    }, {
        pattern: /(\(\s*)(?!\s)(?:[^()]|\([^()]*\))+?(?=\s*\)\s*=>)/,
        lookbehind: !0,
        inside: Prism.languages.javascript
    }, {
        pattern: /((?:\b|\s|^)(?!(?:as|async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally|for|from|function|get|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|set|static|super|switch|this|throw|try|typeof|undefined|var|void|while|with|yield)(?![$\w\xA0-\uFFFF]))(?:[_$A-Za-z\xA0-\uFFFF][$\w\xA0-\uFFFF]*\s*)\(\s*)(?!\s)(?:[^()]|\([^()]*\))+?(?=\s*\)\s*\{)/,
        lookbehind: !0,
        inside: Prism.languages.javascript
    }],
    constant: /\b[A-Z](?:[A-Z_]|\dx?)*\b/
}), Prism.languages.insertBefore("javascript", "string", {
    "template-string": {
        pattern: /`(?:\\[\s\S]|\${(?:[^{}]|{(?:[^{}]|{[^}]*})*})+}|(?!\${)[^\\`])*`/,
        greedy: !0,
        inside: {
            "template-punctuation": {pattern: /^`|`$/, alias: "string"},
            interpolation: {
                pattern: /((?:^|[^\\])(?:\\{2})*)\${(?:[^{}]|{(?:[^{}]|{[^}]*})*})+}/,
                lookbehind: !0,
                inside: {
                    "interpolation-punctuation": {pattern: /^\${|}$/, alias: "punctuation"},
                    rest: Prism.languages.javascript
                }
            },
            string: /[\s\S]+/
        }
    }
}), Prism.languages.markup && Prism.languages.markup.tag.addInlined("script", "javascript"), Prism.languages.js = Prism.languages.javascript;
Prism.languages.typescript = Prism.languages.extend("javascript", {
    keyword: /\b(?:Oak|abstract|as|async|await|break|case|catch|class|const|constructor|continue|debugger|declare|default|delete|do|else|enum|export|extends|finally|for|from|function|get|if|implements|import|in|instanceof|interface|is|keyof|let|module|namespace|new|null|of|package|private|protected|public|readonly|return|require|set|static|super|switch|this|throw|try|type|typeof|var|void|while|with|yield)\b/,
    builtin: /\b(?:string|Function|any|number|boolean|Array|symbol|console|Promise|unknown|never)\b/
}), Prism.languages.ts = Prism.languages.typescript;
var ScrapsContext = (function () {
    function ScrapsContext() {
        this.scraps = [];
    }
    ScrapsContext.prototype.register = function (kernel) {
        this.scraps.push(kernel);
        return this;
    };
    ScrapsContext.prototype.executeStack = function (flush) {
        this.scraps.forEach(function (scrap) {
            var result = scrap.evaluate(flush);
            scrap.updateEvaluationResponse(result);
        });
    };
    return ScrapsContext;
}());
var SCRAPS_EVALUATION_RESULT_TYPE;
(function (SCRAPS_EVALUATION_RESULT_TYPE) {
    SCRAPS_EVALUATION_RESULT_TYPE[SCRAPS_EVALUATION_RESULT_TYPE["ARTIFACT"] = 0] = "ARTIFACT";
    SCRAPS_EVALUATION_RESULT_TYPE[SCRAPS_EVALUATION_RESULT_TYPE["EDITING"] = 1] = "EDITING";
    SCRAPS_EVALUATION_RESULT_TYPE[SCRAPS_EVALUATION_RESULT_TYPE["COMPILATION_ERROR"] = 2] = "COMPILATION_ERROR";
    SCRAPS_EVALUATION_RESULT_TYPE[SCRAPS_EVALUATION_RESULT_TYPE["RUNTIME_ERROR"] = 3] = "RUNTIME_ERROR";
})(SCRAPS_EVALUATION_RESULT_TYPE || (SCRAPS_EVALUATION_RESULT_TYPE = {}));
var ScrapsEvaluationResponse = (function () {
    function ScrapsEvaluationResponse(type, data) {
        this.type = type;
        this.data = data;
    }
    return ScrapsEvaluationResponse;
}());
var CodeSandbox = (function () {
    function CodeSandbox(scrap, code) {
        var _this = this;
        var sandbox = this;
        this.scrap = scrap;
        this.input = code;
        this.element = document.createElement('textarea');
        this.element.className = "code-input-";
        this.element.value = code;
        this.element.style.width = "100%";
        this.element.rows = 8;
        this.element.spellcheck = false;
        this.output_element = document.createElement('pre');
        this.output_element.className = "code-output-";
        this.output_code = document.createElement('code');
        this.output_code.className = "language-javascript";
        this.output_element.appendChild(this.output_code);
        this.element.onscroll = function () {
            sandbox.output_element.scrollTop = sandbox.element.scrollTop;
            sandbox.output_element.scrollLeft = sandbox.element.scrollLeft;
        };
        this.element.onkeydown = function (key) {
            var input = sandbox.element, selStartPos = input.selectionStart, inputVal = input.value;
            if (key.keyCode === 9) {
                input.value = inputVal.substring(0, selStartPos) + "    " + inputVal.substring(selStartPos, input.value.length);
                input.selectionStart = selStartPos + 4;
                input.selectionEnd = selStartPos + 4;
                key.preventDefault();
            }
            window.setTimeout(function () {
                sandbox.renderCodeHighlighting();
            }, 1);
        };
        this.element.onkeyup = function () {
            _this.scrap.updateEvaluationResponse(new ScrapsEvaluationResponse(SCRAPS_EVALUATION_RESULT_TYPE.EDITING, {}));
            return false;
            context.executeStack(false);
            window.setTimeout(function () {
                sandbox.renderCodeHighlighting();
            }, 1);
        };
    }
    CodeSandbox.prototype.renderCodeHighlighting = function () {
        this.element.style.height = "5px";
        this.element.style.height = (this.element.scrollHeight) + "px";
        this.output_code.style.height = (this.element.scrollHeight) + "px";
        this.input = this.element.value;
        this.output_code.innerHTML = this.input.replace(/&/g, "&amp;").replace(/</g, "&lt;")
            .replace(/>/g, "&gt;") + "\n";
        window['Prism'].highlightAll();
    };
    CodeSandbox.prototype.getElement = function () {
        var el = document.createElement('div');
        el.className = 'code';
        el.appendChild(this.element);
        el.appendChild(this.output_element);
        return el;
    };
    CodeSandbox.prototype.getCompiled = function () {
        var build_variables = "\n\t\tfunction makeIdentifiableProperty(i){\n\t\t\treturn typeof i + (!!i?i.toString():\"unknown\");\n\t\t}\n\t\tlet utils = new KernelUtils(kernel);\n\t\tlet p = utils.p.bind(utils);\n\t\tlet h1 = utils.h1.bind(utils);\n\t\tlet h2 = utils.h2.bind(utils);\n\t\tlet print = kernel.print.bind(kernel)\n\t\tlet field = utils.getRenderArea();\n\t\t";
        return build_variables + " " + this.input.replace(/;/g, ";") + ";";
    };
    CodeSandbox.prototype.getLambda = function () {
        var args = "kernel";
        return new Function(args, this.getCompiled());
    };
    return CodeSandbox;
}());
var ScrapControls = (function () {
    function ScrapControls(scrap) {
        this.scrap = scrap;
        this.element = scrap.area_control;
        this.result_type_element = document.createElement("span");
    }
    ScrapControls.prototype.load = function () {
        var _this = this;
        this.result_type_element.innerHTML = '<i class="fas fa-fw fa-ellipsis-h"></i> ';
        var evaluate_element = document.createElement("button");
        evaluate_element.innerHTML = '<i class="fas fa-fw fa-play"></i> Run';
        evaluate_element.onclick = function () {
            var result = _this.scrap.evaluate(true);
            _this.update(result);
        };
        this.element.appendChild(this.result_type_element);
        this.element.appendChild(evaluate_element);
    };
    ScrapControls.prototype.update = function (result) {
        if (this.last_result_state === result.type) {
            return;
        }
        this.last_result_state = result.type;
        switch (result.type) {
            case SCRAPS_EVALUATION_RESULT_TYPE.COMPILATION_ERROR:
                this.result_type_element.innerHTML = '<i class="fas fa-fw fa-bug"></i> ';
                break;
            case SCRAPS_EVALUATION_RESULT_TYPE.RUNTIME_ERROR:
                this.result_type_element.innerHTML = '<i class="fas fa-fw fa-bug"></i> ';
                break;
            case SCRAPS_EVALUATION_RESULT_TYPE.ARTIFACT:
                this.result_type_element.innerHTML = '<i class="fas fa-fw fa-check"></i> ';
                break;
            case SCRAPS_EVALUATION_RESULT_TYPE.EDITING:
                this.result_type_element.innerHTML = '<i class="fas fa-fw fa-ellipsis-h"></i> ';
                break;
        }
    };
    return ScrapControls;
}());
var Scrap = (function () {
    function Scrap(context) {
        this.context = context.register(this);
        this.area_control = document.createElement('div');
        this.area_working = document.createElement('div');
        this.area_render = document.createElement('div');
        this.area_console = document.createElement('div');
        this.controls = new ScrapControls(this);
        this.utils = new KernelUtils(this);
    }
    Scrap.prototype.print = function (element) {
        this.area_render.appendChild(element);
    };
    Scrap.prototype.load = function (element) {
        this.sandbox = new CodeSandbox(this, element.innerHTML);
        element.innerHTML = "";
        this.area_working.appendChild(this.sandbox.getElement());
        this.controls.load();
        element.appendChild(this.area_render);
        element.appendChild(this.area_working);
        element.appendChild(this.area_control);
        element.appendChild(this.area_console);
        this.sandbox.renderCodeHighlighting();
    };
    Scrap.prototype.getSandbox = function () {
        return this.sandbox;
    };
    Scrap.prototype.onlyIfChanges = function (old, n) {
        return (old !== n);
    };
    Scrap.prototype.evaluate = function (flush) {
        var self = this;
        if (flush) {
            window.clearTimeout(this.debounce);
            this.debounce = null;
        }
        else {
        }
        try {
            var fn = this.getSandbox().getLambda();
            try {
                this.area_console.innerText = '';
                this.area_render.innerHTML = "";
                this.artifacts = fn(this);
                if (this.artifacts !== undefined && JSON.stringify(this.artifacts) !== "{}" && JSON.stringify(this.artifacts) !== "undefined") {
                    if (typeof this.artifacts === 'string' || typeof this.artifacts === 'number') {
                        if (self.onlyIfChanges(this.area_console.innerHTML, this.artifacts)) {
                            this.area_console.innerHTML = this.artifacts.toString();
                        }
                    }
                    else {
                        if (self.onlyIfChanges(this.area_console.innerHTML, JSON.stringify(this.artifacts))) {
                            this.area_console.innerHTML = "";
                            window['jsonView'].format(JSON.stringify(this.artifacts), this.area_console);
                        }
                    }
                    return new ScrapsEvaluationResponse(SCRAPS_EVALUATION_RESULT_TYPE.ARTIFACT, this.artifacts);
                }
                return new ScrapsEvaluationResponse(SCRAPS_EVALUATION_RESULT_TYPE.ARTIFACT, {});
            }
            catch (e) {
                if (self.onlyIfChanges(this.area_console.innerHTML, "Runtime Error: " + JSON.stringify(e.message))) {
                    this.area_console.innerHTML = "Runtime Error: " + JSON.stringify(e.message);
                    return new ScrapsEvaluationResponse(SCRAPS_EVALUATION_RESULT_TYPE.RUNTIME_ERROR, JSON.stringify(e.message));
                }
            }
        }
        catch (e) {
            if (self.onlyIfChanges(this.area_console.innerHTML, "Compilation Error: " + JSON.stringify(e.message))) {
                this.area_console.innerHTML = "Compilation Error: " + JSON.stringify(e.message);
                return new ScrapsEvaluationResponse(SCRAPS_EVALUATION_RESULT_TYPE.COMPILATION_ERROR, JSON.stringify(e.message));
            }
        }
    };
    Scrap.prototype.updateEvaluationResponse = function (response) {
        this.controls.update(response);
    };
    return Scrap;
}());
var KernelUtils = (function () {
    function KernelUtils(kernel) {
        this.kernel = kernel;
    }
    KernelUtils.prototype.p = function (string) {
        var el = document.createElement('p');
        el.innerHTML = string;
        return el;
    };
    KernelUtils.prototype.h1 = function (string) {
        var el = document.createElement('h1');
        el.innerHTML = string;
        return el;
    };
    KernelUtils.prototype.h2 = function (string) {
        var el = document.createElement('h2');
        el.innerHTML = string;
        return el;
    };
    KernelUtils.prototype.h3 = function (string) {
        var el = document.createElement('h3');
        el.innerHTML = string;
        return el;
    };
    KernelUtils.prototype.getRenderArea = function () {
        return this.kernel.area_render;
    };
    return KernelUtils;
}());
var context = new ScrapsContext();
var elements = document.getElementsByClassName('scraps-js');
for (var i = 0; i < elements.length; i++) {
    var el = elements[i];
    var scrap = new Scrap(context);
    scrap.load(el);
}
//# sourceMappingURL=scraps.js.map