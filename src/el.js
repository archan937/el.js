var

// *
// * el.js {version} (Uncompressed)
// * A straightforward and lightweight Javascript library for data-binded template rendering.
// *
// * (c) {year} Paul Engel
// * el.js is licensed under MIT license
// *
// * $Date: {date} $
// *

ElementJS = (function() {
  'use strict';

  var
    templates = {},
    bindings = {},
    elid = 1,
    pageBinding,

    __elid__     = '__elid__'    ,
    __for__      = '__for__'     ,
    __if__       = '__if__'      ,
    __tag__      = '__tag__'     ,
    __template__ = '__template__',

  init = function() {
    var
      scripts = document.querySelectorAll('[type="text/element"]'),
      xhr = new XMLHttpRequest(),
      name, content, i;

    xhr.onload = function(event) {
    	if (xhr.status >= 200 && xhr.status < 300) {
        name = event.currentTarget.responseURL.replace(/.*\//, '');
        content = event.currentTarget.responseText;
        templates[name] = content;
    	}
    };

    for (i = 0; i < scripts.length; i++) {
      xhr.open('GET', scripts[i].getAttribute('src'), false);
      xhr.send();
    }
  },

  render = function(template, object, tag) {
    template || (template = '');
    object || (object = {});

    setId(object);

    if (templates[template]) {
      template = templates[template];
    }

    var
      div = document.createElement('div'),
      el = createElement(template);

    div.appendChild(el);
    insertTemplates(div);
    evaluateNode(div, object);

    el = (div.childNodes.length == 1) ? div.childNodes[0] : div;
    el[__tag__] = tag;

    return el;
  },

  setId = function(object) {
    if (!object[__elid__]) {
      var id = 'el' + elid;
      Object.defineProperty(object, __elid__, {
        enumerable: false,
        value: id
      });
      elid++;
    }
    return object[__elid__];
  },

  createElement = function(template) {
    var
      el = document.createElement('template'),
      childNodes, i;

    el.innerHTML = template;
    el = el.content;
    removeScripts(el);

    if (el.children.length == 1) {
      return el.children[0];
    } else {
      childNodes = el.childNodes;
      el = document.createElement('div');
      for (i = childNodes.length - 1; i >= 0; i--) {
        el.insertBefore(childNodes[i], el.firstChild);
      }
      return el;
    }
  },

  removeScripts = function(el) {
    var i, child;
    for (i = 0; i < el.children.length; i++) {
      child = el.children[i];
      if (child.tagName == 'SCRIPT') {
        child.parentNode.removeChild(child);
      }
    }
  },

  insertTemplates = function(el) {
    var
      nodes = el.querySelectorAll('[for],[if]'),
      i, node, template;

    for (i = 0; i < nodes.length; i++) {
      node = nodes[i];
      if (!insideTemplateNode(node)) {
        template = createTemplate(node);
        node.parentNode.insertBefore(template, node);
        template.appendChild(node);
      }
    }
  },

  insideTemplateNode = function(node) {
    var parentNode = node.parentNode;
    if ((parentNode == null) || (parentNode == document.body)) {
      return false;
    }
    return (parentNode.tagName == 'TEMPLATE') || insideTemplateNode(parentNode);
  },

  createTemplate = function(node) {
    var
      template = document.createElement('template'),
      mapping = {'for': __for__, 'if': __if__},
      attribute, value;

    for (attribute in mapping) {
      value = node.getAttribute(attribute);
      if (value) {
        template[mapping[attribute]] = node.getAttribute(attribute).match(/\{\s*(.*?)\s*\}/)[1];
        node.removeAttribute(attribute);
      }
    }

    return template;
  },

  evaluateNode = function(el, object) {
    var
      walker = document.createTreeWalker(el, NodeFilter.SHOW_ALL, {
        acceptNode: function(node) {
          if (node.parentNode.tagName == 'TEMPLATE') {
            return NodeFilter.FILTER_REJECT;
          } else {
            return NodeFilter.FILTER_ACCEPT;
          }
        }
      }, false),
      node, attr, i;

    while (node = walker.nextNode()) {
      if (node.nodeType == Node.ELEMENT_NODE) {
        if (node[__for__] || node[__if__]) {
          evaluateTemplate(object, node);
        } else {
          for (i = 0; i < node.attributes.length; i++) {
            attr = node.attributes[i];
            evaluateString(object, attr);
          }
        }
      }
      if (node.nodeType == Node.TEXT_NODE) {
        evaluateString(object, node);
      }
    }
  },

  evaluateTemplate = function(object, node) {
    var
      elid = setId(node),
      template = node.childNodes[0].outerHTML,
      siblingTags = [],
      siblings = (function() {
        var siblings = [], i, child, tag;
        for (i = 0; i < node.parentNode.children.length; i++) {
          child = node.parentNode.children[i];
          if (child !== node) {
            tag = child[__tag__] || '';
            if (tag.indexOf(elid + ':') != -1) {
              siblingTags.push(tag);
              siblings.push(child);
            }
          }
        }
        return siblings;
      }()),
      renderObject = function(object, tag, i) {
        var
          el = render(template, object, tag),
          sibling = node;

        if (typeof(i) != 'undefined') {
          sibling = node.parentNode.children[i];
        }

        node.parentNode.insertBefore(el, sibling);
      },
      value = evaluateExpression(object, node, node[__for__] || node[__if__]),
      valueTags, i, sibling, tag;

    if (node[__for__]) {
      value = value || [];
      valueTags = [];

      for (i = 0; i < value.length; i++) {
        valueTags.push(elid + ':' + setId(value[i]));
      }

      for (i = 0; i < siblings.length; i++) {
        sibling = siblings[i];
        tag = sibling[__tag__];
        if (valueTags.indexOf(tag) == -1) {
          deleteNode(sibling);
        }
      }

      for (i = 0; i < value.length; i++) {
        object = value[i];
        tag = elid + ':' + object[__elid__];
        if (siblingTags.indexOf(tag) == -1) {
          renderObject(object, tag, i);
        }
      }
    } else {
      tag = elid + ':' + setId(object);
      if (value) {
        for (i = 0; i < siblings.length; i++) {
          sibling = siblings[i];
          if (sibling[__tag__] == tag) {
            return;
          }
        }
        renderObject(object, tag);
      } else {
        for (i = 0; i < siblings.length; i++) {
          sibling = siblings[i];
          if (sibling[__tag__] == tag) {
            deleteNode(sibling);
            return;
          }
        }
      }
    }
  },

  deleteNode = function(node) {
    node.parentNode.removeChild(node);
  },

  evaluateString = function(object, node, template) {
    template || (template = node.nodeValue);

    if (template.indexOf('{') != -1) {
      var
        count = 0,
        buffer = '',
        result = '',
        i, c;

      for (i = 0; i < template.length; i++) {
        c = template[i];
        if (c == '{') {
          if (count > 0) {
            buffer += c;
          }
          count++;
        } else if (c == '}') {
          count--;
          if (count == 0) {
            result += evaluateExpression(object, node, buffer.replace(/(^\s*|\s*$)/g, ''));
            buffer = '';
          } else {
            buffer += c;
          }
        } else if (count > 0) {
          buffer += c;
        } else {
          result += c;
        }
      }

      node.nodeValue = result + buffer;
    }
  },

  evaluateExpression = function(object, node, expression) {
    var
      vars = ['var _'],
      property, variable;

    expression.replace(/(?<!\.)\b[a-z]\w*(\.\w+\(?)*(?=(?:(?:[^"']*"[^"']*")|(?:[^'"]*'[^'"]*'))*[^"']*$)/g, function(path) {
      path = path.replace(/\.\w+\(/, '').split('.');
      property = path[0];
      variable = property + ' = object[\'' + property + '\'] || window[\'' + property + '\']';
      if (vars.indexOf(variable) == -1) {
        try {
          eval('var ' + variable);
          vars.push(variable);
          register(node, object, path.join('.'));
          bind(node, object, path);
        } catch (e) {
          // reserved word
        }
      }
    });

    try {
      return eval(vars.join(', ') + '; _ = ' + expression + '; (typeof(_) == \'undefined\') ? \'\' : _');
    } catch (e) {
      return '';
    }
  },

  bind = function(node, object, path, value, trail) {
    if (arguments.length == 3) {
      value = object;
      trail = [];
    }

    switch (Object.prototype.toString.call(value)) {
      case '[object Object]':
        return bindObject(node, object, path, value, trail);
      case '[object Array]':
        return bindArray(node, object, path, value, trail);
      default:
        return value;
    }
  },

  bindObject = function(node, rootObject, path, object, trail) {
    if (!path.length) {
      return object;
    }

    var
      property = path.shift(),
      value = object[property],
      descriptor = Object.getOwnPropertyDescriptor(object, property),
      triggerPath;

    trail.push(property);
    value = bind(node, rootObject, path, value, trail);

    if (!descriptor || !descriptor.set) {
      triggerPath = trail.join('.');
      Object.defineProperty(object, property, {
        get: function() {
          return value;
        },
        set: function(val) {
          value = bind(node, rootObject, path, val, trail);
          trigger(rootObject, triggerPath);
          return true;
        }
      });
    }

    return object;
  },

  bindArray = function(node, rootObject, _path, array, trail) {
    var
      triggerPath = trail.join('.');

    return new Proxy(array, {
      set: function(array, index, val) {
        array[index] = val;
        trigger(rootObject, triggerPath);
        return true;
      },
      deleteProperty: function(array, index) {
        delete array[index];
        for (var i = 0; i < array.length; i++) {
          array[i] = array[(i < index) ? i : (i + 1)];
        }
        array.length--;
        trigger(rootObject, triggerPath);
      }
    });
  },

  register = function(node, object, path) {
    var
      elid = object[__elid__],
      objectBindings, nodes;

    objectBindings = bindings[elid] || (bindings[elid] = {});
    nodes = objectBindings[path] || (objectBindings[path] = []);

    if (nodes.indexOf(node) == -1) {
      nodes.push(node);
      node[__template__] || (node[__template__] = template(node));
    }
  },

  trigger = function(object, path) {
    var
      elid = object[__elid__],
      objectBindings = (bindings[elid] || {}),
      regexp = new RegExp('^' + path + '(\.|$)'),
      bindedPath, nodes,
      i, node;

    for (bindedPath in objectBindings) {
      if (bindedPath.match(regexp)) {
        nodes = objectBindings[bindedPath];
        for (i = 0; i < nodes.length; i++) {
          node = nodes[i];
          if (node.tagName == 'TEMPLATE') {
            evaluateTemplate(object, node);
          } else {
            evaluateString(object, node, node[__template__]);
          }
        }
      }
    }
  },

  template = function(node) {
    return node.tagName == 'TEMPLATE' ? node.childNodes[0].outerHTML : node.nodeValue;
  },

  ready = function(fn) {
    if ((document.readyState == 'interactive') || (document.readyState == 'complete')) {
      fn();
    } else {
      document.addEventListener('DOMContentLoaded', fn);
    }
  };

  ready(init);

  return {
    renderPage: function(object) {
      if (pageBinding) {
        Object.assign(pageBinding, object);
      } else {
        pageBinding = object;
        ready(function() {
          var
            templates = document.getElementsByTagName('TEMPLATE'),
            template, i, html, el;

          for (i = 0; i < templates.length; i++) {
            template = templates[i];
            html = template.innerHTML;
            if (template.parentNode.children.length > 1) {
              html = '<div>' + html + '</div>';
            }
            el = render(html, pageBinding);
            template.parentNode.insertBefore(el, template);
            template.parentNode.removeChild(template);
          }
        });
      }
      return pageBinding;
    },
    render: render
  };
}()),

El = ElementJS;
document.render = El.renderPage;
document.renderElement = El.render;
