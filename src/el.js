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

Element = (function() {
  'use strict';

  var
    _ = '_',
    __elid__ = '__elid__',
    __for__ = '__for__',
    __template__ = '__template__',

    templates = {},
    bindings = {},
    elid = 0,

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

  render = function(template, object) {
    template || (template = '');
    object || (object = {});

    setId(object);

    if (templates[template]) {
      template = templates[template];
    }

    var el = createElement(template);
    removeAndExecuteScripts(el);
    insertTemplates(el);
    evaluateNode(el, object);

    if ((el.childNodes.length == 1) && (el.childNodes[0].nodeType != Node.TEXT_NODE)) {
      el = el.childNodes[0];
    }

    return el;
  },

  setId = function(object) {
    if (object[__elid__]) {
      return false;
    } else {
      Object.defineProperty(object, __elid__, {
        enumerable: false,
        value: elid++
      });
      return true;
    }
  },

  createElement = function(template) {
    var el = document.createElement('div');
    el.innerHTML = template;
    return el;
  },

  removeAndExecuteScripts = function(el) {
    var node, i;
    for (i = 0; i < el.childNodes.length; i++) {
      node = el.childNodes[i];
      if (node.tagName == 'SCRIPT') {
        node.parentNode.removeChild(node);
        eval(node.innerHTML);
      }
    }
  },

  insertTemplates = function(el) {
    var
      template,
      nodes = el.querySelectorAll('[for]'),
      i, node;

    for (i = 0; i < nodes.length; i++) {
      node = nodes[i];
      if (!insideTemplateNode(node)) {
        template = document.createElement('template');
        template[__for__] = node.getAttribute('for').match(/\{\s*(.*?)\s*\}/)[1];
        node.removeAttribute('for');
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
    return !!parentNode.getAttribute('for') || (parentNode.tagName == 'TEMPLATE') || insideTemplateNode(parentNode);
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
        if (node[__for__]) {
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
      template = node.childNodes[0].outerHTML,
      collection = evaluateExpression(object, node, node[__for__]),
      i, el;

    if (collection) {
      for (i = 0; i < collection.length; i++) {
        object = collection[i];
        if (setId(object)) {
          el = render(template, object);
          register(el, object);
          node.parentNode.insertBefore(el, node);
        }
      }
    }
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
            result += evaluateExpression(object, node, buffer);
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
      variable;

    expression.replace(/(?<!\.)\b\w+(?=(?:(?:[^"']*"[^"']*")|(?:[^'"]*'[^'"]*'))*[^"']*$)/g, function(property) {
      if (object.hasOwnProperty(property)) {
        variable = property + ' = object[\'' + property + '\']';
        if (vars.indexOf(variable) == -1) {
          vars.push(variable);
          bind(object, property, node);
        }
      }
    });

    try {
      return eval(vars.join(', ') + '; _ = ' + expression + '; typeof(_) == \'undefined\' ? \'\' : _');
    } catch (e) {
      return '';
    }
  },

  bind = function(object, property, node) {
    var descriptor = Object.getOwnPropertyDescriptor(object, property), value;

    if (!descriptor || !descriptor.set) {
      value = bindValue(object[property], object, property);
      Object.defineProperty(object, property, {
        get: function() {
          return value;
        },
        set: function(val) {
          deleteAll(value);
          value = bindValue(val, object, property);
          trigger(object, property);
          return true;
        }
      });
    }

    register(node, object, property);
  },

  bindValue = function(value, object, property) {
    if (Object.prototype.toString.call(value) == '[object Array]') {
      value = new Proxy(value, {
        set: function(array, index, val) {
          array[index] = val;
          trigger(object, property);
          return true;
        },
        deleteProperty: function(array, index) {
          var elid = array[index][__elid__], i;
          delete array[index];
          for (i = 0; i < array.length; i++) {
            array[i] = array[(i < index) ? i : (i + 1)];
          }
          array.length--;
          trigger(object, property);
          deleteById(elid);
        }
      });
    }
    return value;
  },

  register = function(node, object, property) {
    var
      elid = object[__elid__],
      objectBindings, nodes;

    property || (property = _);
    objectBindings = bindings[elid] || (bindings[elid] = {}),
    nodes = objectBindings[property] || (objectBindings[property] = []);

    if (nodes.indexOf(node) == -1) {
      nodes.push(node);
      node[__template__] || (node[__template__] = node.nodeValue);
    }
  },

  trigger = function(object, property) {
    var
      elid = object[__elid__],
      objectBindings, nodes, node, i;

    objectBindings = bindings[elid] || {};
    nodes = objectBindings[property] || [];

    for (i = 0; i < nodes.length; i++) {
      node = nodes[i];
      if (node.tagName == 'TEMPLATE') {
        evaluateTemplate(object, node);
      } else {
        evaluateString(object, node, node[__template__]);
      }
    }
  },

  deleteAll = function(value) {
    if (Object.prototype.toString.call(value) == '[object Array]') {
      for (var i = 0; i < value.length; i++) {
        deleteById(value[i][__elid__]);
      }
    }
  },

  deleteById = function(elid) {
    var
      objectBindings = bindings[elid] || {},
      nodes = objectBindings[_] || [],
      node, i;

    for (i = 0; i < nodes.length; i++) {
      node = nodes[i];
      node.parentNode.removeChild(node);
    }
  };

  init();

  return {
    render: render
  };
}()),

El = Element;
document.renderElement = El.render;
