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
    __template__ = '__template__',
    templates = {},
    bindings = {},

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
      xhr.open('GET', scripts[i].getAttribute('src'));
      xhr.send();
    }
  },

  render = function(template, object) {
    template || (template = '');
    object || (object = {});

    if (templates[template]) {
      template = templates[template];
    }

    var el = createElement(template);
    removeAndExecuteScripts(el);
    evaluateTemplates(el, object);

    if ((el.childNodes.length == 1) && (el.childNodes[0].nodeType != Node.TEXT_NODE)) {
      el = el.childNodes[0];
    }

    return el;
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

  evaluateTemplates = function(el, object) {
    var
      walker = document.createTreeWalker(el, NodeFilter.SHOW_ALL, null, false),
      node, attr, i;

    while (node = walker.nextNode()) {
      if ((node.nodeType == Node.TEXT_NODE) && node.nodeValue.indexOf('{') != -1) {
        node.nodeValue = evaluateTemplate(node.nodeValue, object, node);
      }
      if (node.nodeType == Node.ELEMENT_NODE) {
        for (i = 0; i < node.attributes.length; i++) {
          attr = node.attributes[i];
          if (attr.nodeValue.indexOf('{') != -1) {
            attr.nodeValue = evaluateTemplate(attr.nodeValue, object, attr);
          }
        }
      }
    }
  },

  evaluateTemplate = function(template, object, node) {
    return evaluateExpressions(template, function(expression) {
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
    });
  },

  evaluateExpressions = function(template, callback) {
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
          result += callback(buffer);
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

    return result + buffer;
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
          value = bindValue(val, object, property);
          trigger(object, property);
          return true;
        }
      });
    }

    register(object, property, node);
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
          delete array[index];
          for (var i = 0; i < array.length; i++) {
            array[i] = array[(i < index) ? i : (i + 1)];
          }
          array.length--;
          trigger(object, property);
        }
      });
    }
    return value;
  },

  register = function(object, property, node) {
    var objectBindings, nodes;

    objectBindings = bindings[object] || (bindings[object] = {}),
    nodes = objectBindings[property] || (objectBindings[property] = []);

    if (nodes.indexOf(node) == -1) {
      nodes.push(node);
      node[__template__] || (node[__template__] = node.nodeValue);
    }
  },

  trigger = function(object, property) {
    var objectBindings, nodes, node, i;

    objectBindings = bindings[object] || {};
    nodes = objectBindings[property] || [];

    for (i = 0; i < nodes.length; i++) {
      node = nodes[i];
      node.nodeValue = evaluateTemplate(node[__template__], object, node);
    }
  };

  init();

  return {
    render: render
  };
}()),

El = Element;
document.renderElement = El.render;
