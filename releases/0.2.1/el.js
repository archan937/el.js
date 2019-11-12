var

// *
// * el.js 0.2.1 (Uncompressed)
// * A straightforward and lightweight Javascript library for data-binded template rendering.
// *
// * (c) 2019 Paul Engel
// * el.js is licensed under MIT license
// *
// * $Date: 2019-11-13 00:37:40 +0100 (Wed, 13 November 2019) $
// *

ElementJS = (function() {
  'use strict';

  var
    templates = {},
    bindings = {},
    elid = 1,
    pageBinding = {},

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

  render = function(template, binding, tag, parents) {
    template || (template = '');
    binding || (binding = {});
    parents || (parents = []);

    setId(binding);

    if (templates[template]) {
      template = templates[template];
    }

    var
      div = document.createElement('div'),
      el = createElement(template);

    div.appendChild(el);
    insertTemplates(div);
    renderNode(div, binding, parents);

    el = (div.childNodes.length == 1) ? div.childNodes[0] : div;
    el[__tag__] = tag;

    return el;
  },

  setId = function(object) {
    if (typeof(object) != 'object') {
      return object;
    }
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
      firstChild, childNodes, i;

    el.innerHTML = template;
    el = el.content;
    removeScripts(el);
    firstChild = el.children[0];

    if ((el.children.length == 1) && !firstChild.getAttribute('for')) {
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

  removeScripts = function(el) {
    var i, child;
    for (i = 0; i < el.children.length; i++) {
      child = el.children[i];
      if (child.tagName == 'SCRIPT') {
        deleteNode(child);
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

  renderNode = function(el, binding, parents) {
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
          evaluateNode(binding, node, parents);
        } else {
          for (i = 0; i < node.attributes.length; i++) {
            attr = node.attributes[i];
            evaluateTemplate(binding, attr, null, parents);
          }
        }
      }
      if (node.nodeType == Node.TEXT_NODE) {
        evaluateTemplate(binding, node, null, parents);
      }
    }
  },

  evaluateNode = function(binding, node, parents) {
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
        binding = value[i];
        tag = elid + ':' + binding[__elid__];
        if (siblingTags.indexOf(tag) == -1) {
          renderEl(binding, tag, i);
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

  evaluateTemplate = function(binding, node, template, parents) {
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
      bindings = [binding].concat(parents),
      vars = [],
      dot = '__dot__',
      val = '__val__',
      path, property, variable;

    expression = expression.replace(/((?<!\.)\b[a-z]\w*(\.\w+\(?)*(?=(?:(?:[^"']*"[^"']*")|(?:[^'"]*'[^'"]*'))*[^"']*$)|((^|\s)\.(\s|$)))/g, function(match) {
      if (match.replace(/\s/g, '') == '.') {
        return match.replace('.', dot);
      } else {
        path = match.replace(/\.\w+\(/, '').split('.');
        property = path[0];
        variable = property + ' = resolveValue(bindings, \'' + property + '\')';
        if (vars.indexOf(variable) == -1) {
          try {
            eval('var ' + variable);
            vars.push(variable);
            register(node, binding, path.join('.'), parents);
            bind(node, binding, path, null, null, parents);
          } catch (e) {
            // reserved word
          }
        }
        return match;
      }
    });

    bindings.push(window);
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

  deleteNode = function(node) {
    node.parentNode.removeChild(node);
  },

  bind = function(node, binding, path, value, trail, parents) {
    if ((arguments.length == 3) || (arguments.length == 6 && !trail)) {
      value = binding;
      trail = [];
    }

    switch (Object.prototype.toString.call(value)) {
      case '[object Object]':
        return bindObject(node, binding, path, value, trail, parents);
      case '[object Array]':
        return bindArray(node, binding, path, value, trail);
      default:
        return value;
    }
  },

  bindObject = function(node, rootObject, path, object, trail, parents) {
    if (!path.length) {
      return object;
    }

    var property = path.shift();
    trail.push(property);

    [object].concat(parents).forEach(function(binding) {
      var
        value = binding[property],
        descriptor = Object.getOwnPropertyDescriptor(binding, property),
        triggerPath;

      value = bind(node, rootObject, path, value, trail, parents);

      if (!descriptor || !descriptor.set) {
        triggerPath = trail.join('.');
        Object.defineProperty(binding, property, {
          get: function() {
            return value;
          },
          set: function(val) {
            value = bind(node, rootObject, path, val, trail, parents);
            trigger(rootObject, triggerPath, parents);
            return true;
          }
        });
      }
    })

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

  register = function(node, binding, path, parents) {
    [binding].concat(parents).forEach(function(binding) {
      var
        elid = binding[__elid__],
        objectBindings, nodes;

      objectBindings = bindings[elid] || (bindings[elid] = {});
      nodes = objectBindings[path] || (objectBindings[path] = []);

      if (nodes.indexOf(node) == -1) {
        nodes.push(node);
        node[__template__] || (node[__template__] = template(node));
      }
    });
  },

  trigger = function(binding, path, parents) {
    var
      elid = binding[__elid__],
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
            evaluateNode(binding, node, parents);
          } else {
            evaluateTemplate(binding, node, node[__template__], parents);
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
    renderPage: function(binding) {
      Object.assign(pageBinding, binding);
      if (!pageBinding[__elid__]) {
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
      }
      return pageBinding;
    },
    render: render,
    pageBinding: pageBinding
  };
}()),

El = ElementJS;
document.render = El.renderPage;
document.renderElement = El.render;
document.binding = El.pageBinding;
