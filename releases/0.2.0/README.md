# el.js

A straightforward and lightweight Javascript library for data-binded template rendering.

## Installation

Just include el.js:

```html
<script src="path/to/el.js" type="text/javascript"></script>
```

**Note**: include `el.min.js` for the minified el.js library

## Testing el.js with QUnit

The `el.js` library is tested with [QUnit](http://qunitjs.com). Check out the test results at [https://archan937.github.io/el.js/test/index.html](https://archan937.github.io/el.js/test/index.html).

### Running tests locally

In order to run tests on your own computer, please start up a web server for the current directory (e.g. `ruby -run -ehttpd . -p8000`)
and open `http://<localhost>/test` in your browser (e.g. `http://localhost:8000/test`).

Here is a list of HTTP static server one-liners: [https://gist.github.com/willurd/5720255](https://gist.github.com/willurd/5720255).

## Usage

To render data-binded elements, you have to use either of the following functions:

* `ElementJS.render()` - the original function
* `El.render()` - an alias function
* `document.renderElement()` - an alias function

They require the following arguments:

1. the `template` - a string value
2. the `binding` - an object value

The return value is an `HTMLElement` of which the tag depends on the contents of the template.

### Render the entire page

As of version `0.2.0`, it is possible to render the entire(!) page right after it is loaded. Use either of the following:

* `ElementJS.renderPage()` - the original function
* `El.renderPage()` - an alias function
* `document.render()` - an alias function

They require the following argument:

1. the `binding` - an object value

This function will use the entire page as template using the passed binding. No need for separate template elements.

#### An example

```html
<!DOCTYPE html>
<html>
  <head>
    <script type="text/javascript" src="../src/el.js"></script>
    <script>
      document.render({
        firstName: 'Paul',
        lastName: 'Engel',
        skills: ['ruby', 'elixir', 'javascript'],
      });
    </script>
  </head>
  <body>
    <h2>Page render example</h2>
    <template>
      Hello, my name is { firstName } { lastName }!
      <p>
        I am pretty much experienced in:
        <ul>
          <li for="{ skills }">
            { . }
          </li>
        </ul>
      </p>
    </template>
  </body>
</html>
```

Convenient, huh? You can also see `document.render()` in action: [https://archan937.github.io/el.js/demo/index.html](https://archan937.github.io/el.js/demo/index.html) 😎😎😎

### Basic interpolation

To interpolate values you can use `{ < property > }`:

```javascript
var
  object = {},
  el = document.renderElement('<h1>Hello, { name }</h1>', object);

el.outerHTML; //=> <h1>Hello, </h1>

object.name = 'Paul';
el.outerHTML; //=> <h1>Hello, Paul</h1>

object.name = 'Bruce';
el.outerHTML; //=> <h1>Hello, Bruce</h1>
```

The expressions within the curly braces is just evaluated Javascript:

```javascript
ElementJS.render(
  '<span>{ amount * price }</span>', {
    amount: 1982,
    price: 1.8
  }
).outerHTML;
//=> <span>3567.6</span>

ElementJS.render(
  '<span>{ first_name } {last_name } ({ tags.join(", ") })</span>', {
    first_name: 'Paul',
    last_name: 'Engel',
    tags: ['ruby', 'elixir']
  }
).outerHTML;
//=> <span>Paul Engel (ruby, elixir)</span>

ElementJS.render(
  '{ tags.join(", ") }', {
    tags: [
      'ruby',
      'elixir',
      'javascript'
    ]
  }
).outerHTML;
//=> <div>ruby, elixir, javascript</div>

ElementJS.render(
  '{ name } { new Date(created_at * 1000).toLocaleString() }', {
    name: 'Batman',
    created_at: 1556446639
  }
).outerHTML;
//=> <div>Batman 28-4-2019 12:17:19</div>
```

### Attribute interpolation

You can interpolate element attributes as follows:

```javascript
var
  object = {name: 'Javascript', slug: 'js'},
  el = render('<a href="/category/{ slug }">{ name }</a>', object);

el.outerHTML; //=> <a href="/category/js">Javascript</a>
```

### Nested objects

You can interpolate nested values using a "path of properties":

```javascript
var
  object = {},
  el = document.renderElement('<h1>Hello, { user.name }</h1>', object);

el.outerHTML; //=> <h1>Hello, </h1>

object.user = {name: 'Paul'};
el.outerHTML; //=> <h1>Hello, Paul</h1>

object.user.name = 'Bruce';
el.outerHTML; //=> <h1>Hello, Bruce</h1>
```

### Using .el template files

Other than passing a string containing the template, you can also use included `.el` template files.

You need to include them with a `<script>` tag using the `text/element` type with a `.el` file extension.

In order to use it, you need to use the file name of the included template

```html
<script type="text/element" src="./elements/hello.el"></script>
<script src="./el.js"></script>
<script>
  var
    object = {name: 'Paul'},
    el = render('hello.el', object);

el.outerHTML; //=> <h1>Hello, my name is Paul</h1>
</script>
```

### If statements

You can render elements conditionally using the `if` attribute.
As the expression concerns plain Javascript, the element will be rendered if the result is truthy.

_(in super-hero.el)_

```html
<div if="{ selected }">
  <h2>{ selected.name }</h2>
  <p>{ selected.description }</p>
</div>
```

```javascript
var
  object = {},
  el = document.renderElement('super-hero.el', object);

el.outerHTML;
// <div><template></template></div>

object.selected = {name: 'Batman', description: 'He is a pancake! #justkiddingbruce <3'};
el.outerHTML;
// <div>
//   <div>
//     <h2>Batman</h2>
//     <p>He is a pancake! #justkiddingbruce &lt;3</p>
//   </div>
//   <template></template>
// </div>
```

### For loops

You can render elements for arrays using the `for` attribute:

_(in super-heroes.el)_

```html
<h1>
  Super heroes
</h1>
<ul>
  <li for="{ super_heroes }">
    <strong>{ name }</strong> ({ alter_ego })
  </li>
</ul>
```

```javascript
var
  object = {},
  el = document.renderElement('super-heroes.el', object);

el.outerHTML;
// <div>
//   <h1>
//     Super heroes
//   </h1>
//   <ul>
//     <template></template>
//   </ul>
// </div>

object.super_heroes = [
  {name: 'Spider-Man', alter_ego: 'Peter Benjamin Parker'},
  {name: 'Iron Man', alter_ego: 'Anthony Edward Stark'}
];
el.outerHTML;
// <div>
//   <h1>
//     Super heroes
//   </h1>
//   <ul>
//     <li>
//       <strong>Spider-Man</strong> (Peter Benjamin Parker)
//     </li>
//     <li>
//       <strong>Iron Man</strong> (Anthony Edward Stark)
//     </li>
//     <template></template>
//   </ul>
// </div>
```

## Contact me

For support, remarks and requests, please mail me at [pm_engel@icloud.com](mailto:pm_engel@icloud.com).

## License

Copyright (c) 2019 Paul Engel, released under the MIT license

[http://github.com/archan937](http://github.com/archan937) - [http://twitter.com/archan937](http://twitter.com/archan937) - [pm_engel@icloud.com](mailto:pm_engel@icloud.com)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
