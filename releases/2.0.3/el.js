var

// *
// * el.js 2.0.3 (Uncompressed)
// * A straightforward and lightweight Javascript library for data-binded template rendering.
// *
// * (c) 2020 Paul Engel
// * el.js is licensed under MIT license
// *
// * $Date: 2020-12-29 14:45:22 +0100 (Tue, 29 December 2020) $
// *

ElementJS = (function() {
  'use strict';

  var
    elid = 1,
    templates = {},
    bindings = {},
    debug = false,

    __binding__ = 'binding'    ,
    __elid__    = '__elid__'   ,
    __for__     = '__for__'    ,
    __if__      = '__if__'     ,
    __tag__     = '__tag__'    ,
    __proxied__ = '__proxied__',

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

  render = function(template, binding, tag, parents) {
    binding = bind(binding || {});
    template || (template = '');
    parents || (parents = []);

    if (templates[template]) {
      template = templates[template];
    }

    var
      div = document.createElement('div'),
      el = createElement(template);

    div.appendChild(el);
    insertTemplates(div);
    renderNode(binding, div, parents);

    el = (div.childNodes.length == 1) ? div.childNodes[0] : div;
    el[__tag__] = tag;

    if (arguments.length <= 2) {
      el[__binding__] = binding;
    }

    return el;
  },

  createElement = function(template) {
    var
      el = document.createElement('template'),
      firstChild, childNodes, i;

    el.innerHTML = template;
    el = el.content;
    removeScripts(el);
    firstChild = el.children[0];

    if ((el.children.length == 1) && !firstChild.getAttribute('forEach')) {
      return firstChild;
    } else {
      childNodes = el.childNodes;
      el = document.createElement('div');
      for (i = childNodes.length - 1; i >= 0; i--) {
        el.insertBefore(childNodes[i], el.firstChild);
      }
      return el;
    }
  },

  removeScripts = function(node) {
    var i, child;
    for (i = 0; i < node.children.length; i++) {
      child = node.children[i];
      if (child.tagName == 'SCRIPT') {
        deleteNode(child);
      }
    }
  },

  deleteNode = function(node) {
    node.parentNode.removeChild(node);
  },

  insertTemplates = function(el) {
    var
      nodes = el.querySelectorAll('[forEach],[if]'),
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
      mapping = {'forEach': __for__, 'if': __if__},
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

  renderNode = function(binding, el, parents) {
    var
      elPrefix = /^el:/,
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
          evaluateBlock(binding, node, parents);
        } else {
          Array.from(node.attributes).forEach(function(attr) {
            var template = attr.nodeValue;
            if (attr.nodeName.match(elPrefix)) {
              var
                name = attr.nodeName.replace(elPrefix, ''),
                value = (name == 'src') ? '//:0' : '';
              node.setAttribute(name, value);
              node.removeAttribute(attr.nodeName);
              attr = node.getAttributeNode(name);
            }
            evaluateNode(binding, attr, template, parents);
          });
        }
      }
      if (node.nodeType == Node.TEXT_NODE) {
        evaluateNode(binding, node, null, parents);
      }
    }
  },

  evaluateBlock = function(binding, node, parents) {
    if (!node.render) {
      node.render = function() {
        evaluateBlock(binding, node, parents);
      };
    }

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
      elParents = [binding].concat(parents),
      renderEl = function(binding, tag, i) {
        var
          el = render(template, binding, tag, elParents),
          sibling = node;
        if (typeof(i) != 'undefined') {
          sibling = node.parentNode.children[i];
        }
        node.parentNode.insertBefore(el, sibling);
      },
      value = evaluateExpression(binding, node, node[__for__] || node[__if__], parents),
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
        var valbinding = value[i];
        tag = elid + ':' + valbinding[__elid__];
        if (siblingTags.indexOf(tag) == -1) {
          renderEl(valbinding, tag, i);
        }
      }
    } else {
      tag = elid + ':' + setId(binding);
      if (value) {
        for (i = 0; i < siblings.length; i++) {
          sibling = siblings[i];
          if (sibling[__tag__] == tag) {
            return;
          }
        }
        renderEl(binding, tag);
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

  evaluateNode = function(binding, node, template, parents) {
    if (!node.render) {
      node.render = function() {
        evaluateNode(binding, node, template, parents);
      };
    }

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
            result += evaluateExpression(binding, node, buffer.replace(/(^\s*|\s*$)/g, ''), parents);
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

  evaluateExpression = function(binding, node, expression, parents) {
    var
      bindings = [binding].concat(parents).concat([window]),
      vars = [],
      dot = '__dot__',
      val = '__val__',
      path, property, variable,
      regExp = /((["']).*?[^\\]\2|\b[A-Za-z](\.?\w+)*(?!\()\b|\.(?!\w))/g;

    debugLog('\n\n', expression);

    expression = expression.replace(regExp, function(match) {
      if (match[0].match(/["']/)) {
        return match;
      }
      if (match.replace(/\s/g, '') == '.') {
        debugLog(' +  ', match + ';');
        return match.replace('.', dot);
      } else {
        path = match.replace(/\.\w+\(/, '').split('.');
        property = path[0];
        variable = property + ' = resolveValue(bindings, \'' + property + '\')';
        if (vars.indexOf(variable) == -1) {
          try {
            eval('var ' + variable);
            debugLog(' +  ', match + ';');
            vars.push(variable);
            bind(binding, node, path, parents);
          } catch (e) {
            // reserved word probably
            debugLog(' -  ', match + ';');
          }
        }
        return match;
      }
    });

    debugLog(' $  ', expression + ';');
    vars.push(dot + ' = binding');

    try {
      return eval('var ' + vars.join(', ') + ', ' + val + ' = ' + expression + '; (typeof(' + val + ') == \'undefined\') ? \'\' : ' + val + ';');
    } catch (e) {
      return '';
    }
  },

  resolveValue = function(bindings, property) {
    var i, value;

    for (i = 0; i < bindings.length - 1; i++) {
      if (typeof(value) == 'undefined') {
        value = bindings[i][property];
      }
    }

    return value;
  },

  setId = function(object) {
    if (typeof(object) != 'object') {
      return object;
    }
    if (!object[__elid__]) {
      object[__elid__] = 'el' + elid++;
    }
    return object[__elid__];
  },

  bind = function(binding, node, path, parents) {
    if (binding) {
      var
        inspect = Object.prototype.toString.call(binding);

      if (inspect.match(/\[object (Object|Array)\]/)) {
        if (parents) {
          parents.forEach(function(parent) {
            bind(parent, node, path);
          });
        }
        switch (inspect) {
          case '[object Object]':
            return bindObject(binding, node, path);
            break;
          case '[object Array]':
            return bindArray(binding, node);
            break;
        }
      }
    }

    return binding;
  },

  bindObject = function(object, node, path) {
    var
      elid = setId(object),
      property;

    if (!object[__proxied__]) {
      delete object[__elid__];

      Object.keys(object).forEach(function(key) {
        object[key] = bind(object[key]);
      });

      object = new Proxy(object, {
        get: function(object, property) {
          if (property == __proxied__) {
            return true;
          } else if (property == __elid__) {
            return elid;
          } else {
            return object[property];
          }
        },
        set: function(object, property, value) {
          object[property] = bind(value);
          trigger(elid, property);
          return true;
        },
        deleteProperty: function(object, property) {
          delete object[property];
          trigger(elid, property);
        }
      });

      elid = setId(object);
    }

    if (node && (property = path[0])) {
      register(node, elid, property);
      bind(object[property], node, path.slice(1));
    }

    return object;
  },

  bindArray = function(array, node) {
    var
      elid = setId(array);

    if (!array[__proxied__]) {
      delete array[__elid__];

      Object.keys(array).forEach(function(index) {
        array[index] = bind(array[index]);
      });

      array = new Proxy(array, {
        get: function(array, index) {
          if (index == __proxied__) {
            return true;
          } else if (index == __elid__) {
            return elid;
          } else {
            return array[index];
          }
        },
        set: function(array, index, value) {
          array[index] = bind(value);
          if (index != 'length') {
            trigger(elid);
          }
          return true;
        },
        deleteProperty: function(array, index) {
          delete array[index];
          for (var i = 0; i < array.length; i++) {
            array[i] = array[(i < index) ? i : (i + 1)];
          }
          array.length--;
          trigger(elid);
        }
      });

      elid = setId(array);
    }

    if (node) {
      register(node, elid);
    }

    return array;
  },

  register = function(node, elid, property) {
    property || (property = null);
    var
      objectBindings = bindings[elid] || (bindings[elid] = {}),
      propertyBindings = objectBindings[property] || (objectBindings[property] = []);

    if (propertyBindings.indexOf(node) == -1) {
      propertyBindings.push(node);
    }
  },

  trigger = function(elid, property) {
    property || (property = null);
    var
      objectBindings = bindings[elid],
      propertyBindings = objectBindings && objectBindings[property];

    if (propertyBindings) {
      propertyBindings.forEach(function(node) {
        node.render();
      });
    }
  },

  ready = function(fn) {
    if ((document.readyState == 'interactive') || (document.readyState == 'complete')) {
      fn();
    } else {
      document.addEventListener('DOMContentLoaded', fn);
    }
  },

  debugMode = function(val) {
    if (arguments.length) {
      debug = val;
    }
    return debug;
  },

  debugLog = function() {
    debugMode() && console.log.apply(this, arguments);
  },

  pageBinding = bind({});

  ready(init);

  return {
    debugMode: debugMode,
    renderPage: function(binding) {
      Object.assign(pageBinding, binding);
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
          deleteNode(template);
        }
      });
      return pageBinding;
    },
    render: render,
    pageBinding: pageBinding
  };
}()),

El = ElementJS;
document.render = ElementJS.renderPage;
document.renderElement = ElementJS.render;
document.binding = ElementJS.pageBinding;
