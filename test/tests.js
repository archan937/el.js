var
  test = QUnit.test,
  render = ElementJS.render;

test('provide Elements.render()', function(assert) {
  var el = render();
  assert.ok(el instanceof HTMLElement, 'returns an HTMLElement');
  assert.equal(el.tagName, 'DIV', 'returns a <div> at default');
});

test('provide El.render()', function(assert) {
  var el = El.render();
  assert.ok(el instanceof HTMLElement, 'returns an HTMLElement');
  assert.equal(el.tagName, 'DIV', 'returns a <div> at default');
});

test('provide document.renderElement()', function(assert) {
  var el = document.renderElement();
  assert.ok(el instanceof HTMLElement, 'returns an HTMLElement');
  assert.equal(el.tagName, 'DIV', 'returns a <div> at default');
});

test('render the passed template', function(assert) {
  var el = render('<h1>Hello</h1>');
  assert.equal(el.outerHTML, '<h1>Hello</h1>', 'uses template for resulting HTML output');
});

test('return a <div> wrapper when concerning multiple elements', function(assert) {
  var el = render('<h1>Hello</h1><p>Lorem ipsum.</p>');
  assert.equal(el.tagName, 'DIV', 'wraps content within a <div> wrapper');
  assert.equal(el.outerHTML, '<div><h1>Hello</h1><p>Lorem ipsum.</p></div>', 'outputs expected HTML');
});

test('do not count <script> as an element', function(assert) {
  var el = render('<h1>Hello</h1><script></script>');
  assert.equal(el.outerHTML, '<h1>Hello</h1>', 'excludes <script> from output');
});

test('remove <script> tags', function(assert) {
  var el = render('<script>throw "Error";</script>');
  assert.equal(el.outerHTML, '<div></div>', 'removes included <script>');
});

test('ignore non-existing keys', function(assert) {
  var el = render('<span>{ first_name }</span>');
  assert.equal(el.outerHTML, '<span></span>', 'results as empty text in output when no object given');

  var el = render('<span>{ first_name } {last_name }</span>', {first_name: 'Paul'});
  assert.equal(el.outerHTML, '<span>Paul </span>', 'results as empty text in output when key non-existent (1)');

  var el = render('<span>{ first_name } {last_name }</span>', {last_name: 'Engel'});
  assert.equal(el.outerHTML, '<span> Engel</span>', 'results as empty text in output when key non-existent (2)');
});

test('interpolate simple values', function(assert) {
  var el = render('<span>{ first_name }</span>', {first_name: 'Paul'});
  assert.equal(el.outerHTML, '<span>Paul</span>', 'interpolates single expression within a text node');

  var el = render('<span>{ first_name } {last_name }</span>', {first_name: 'Paul', last_name: 'Engel'});
  assert.equal(el.outerHTML, '<span>Paul Engel</span>', 'interpolates multiple expressions within a text node');

  var el = render('<span>{ first_name } <strong>separator</strong> {last_name }</span>', {first_name: 'Paul', last_name: 'Engel'});
  assert.equal(el.outerHTML, '<span>Paul <strong>separator</strong> Engel</span>', 'respects nested nodes');
});

test('interpolate with plain JS', function(assert) {
  var el = render('<span>{ amount * price }</span>', {amount: 1982, price: 1.8});
  assert.equal(el.outerHTML, '<span>3567.6</span>', 'allows mathematic operations within expressions');

  var el = render('<span>{ first_name } {last_name } ({ tags.join(\', \') })</span>', {first_name: 'Paul', last_name: 'Engel', tags: ['ruby', 'elixir']});
  assert.equal(el.outerHTML, '<span>Paul Engel (ruby, elixir)</span>', 'allows function invocations within expressions');

  var el = render('<span>{ first_name } {last_name } ({ tags.join(\'{, }\') })</span>', {first_name: 'Paul', last_name: 'Engel', tags: ['ruby', 'elixir']});
  assert.equal(el.outerHTML, '<span>Paul Engel (ruby{, }elixir)</span>', 'does not crash when containing curly braces');
});

test('interpolate with the notion of scoping', function(assert) {
  var
    el = render(`<div for="{ one }">
{ name }
</div>`, {name: 'root'}),
    object = el.binding;

  object.one = [{}];
  assert.equal(el.outerHTML, `<div><div>
root
</div><template></template></div>`, 'uses parent binding as fallback');

  object.one.push({});
  assert.equal(el.outerHTML, `<div><div>
root
</div><div>
root
</div><template></template></div>`, 'uses parent binding as fallback for every following item');

  object.name = 'r00t';
  assert.equal(el.outerHTML, `<div><div>
r00t
</div><div>
r00t
</div><template></template></div>`, 'updates whenever parent binding has changed');

  object.one[0].name = 'one';
  assert.equal(el.outerHTML, `<div><div>
one
</div><div>
r00t
</div><template></template></div>`, 'updates whenever missing property gets defined in own binding');

  object.one.push({});
  assert.equal(el.outerHTML, `<div><div>
one
</div><div>
r00t
</div><div>
r00t
</div><template></template></div>`, 'uses parent binding as fallback for every following item');

  delete object.one[0].name;
  assert.equal(el.outerHTML, `<div><div>
r00t
</div><div>
r00t
</div><div>
r00t
</div><template></template></div>`, 'uses parent binding after deleting property in own binding again');

  delete object.name;
  assert.equal(el.outerHTML, `<div><div>

</div><div>

</div><div>

</div><template></template></div>`, 'is empty after deleting property in parent binding');
});

test('provide `el.binding`', function(assert) {
  var
    el = render('{ first_name }'),
    object = el.binding;

  object.first_name = 'Bruce';
  assert.equal(el.outerHTML, '<div>Bruce</div>', 'updates its HTML after changing the binding');
});

test('bind to objects', function(assert) {
  var
    el = render('<span>{ first_name } {last_name }</span>', {
      first_name: 'Paul',
      last_name: 'Engel',
      tags: ['ruby', 'elixir']
    }),
    object = el.binding;

  object.first_name = 'Bruce';
  assert.equal(el.outerHTML, '<span>Bruce Engel</span>', 'updates dependent text node after first change');

  object.last_name = 'Wayne';
  assert.equal(el.outerHTML, '<span>Bruce Wayne</span>', 'updates dependent text node after succeeding change');
});

test('bind to nested objects', function(assert) {
  var
    el = render('<span>{ selected.hero.name }</span>', {}),
    object = el.binding;

  assert.equal(el.outerHTML, '<span></span>', 'results as empty text in output when no nested object given');

  object.selected = {hero: {name: 'Bruce Wayne'}};
  assert.equal(el.outerHTML, '<span>Bruce Wayne</span>', 'updates dependent text node after setting a nested object');

  object.selected.hero.name = 'Clark Kent';
  assert.equal(el.outerHTML, '<span>Clark Kent</span>', 'updates dependent text node after changing a nested value');

  object.selected.hero = {};
  assert.equal(el.outerHTML, '<span></span>', 'results as empty text when nested value is empty');
});

test('bind to arrays', function(assert) {
  var
    el = render('{ tags.join(\', \') }', {tags: ['ruby', 'elixir', 'javascript']}),
    object = el.binding;

  object.tags.push('html');
  assert.equal(el.outerHTML, '<div>ruby, elixir, javascript, html</div>', 'updates when an item is added');

  delete object.tags[0];
  assert.equal(el.outerHTML, '<div>elixir, javascript, html</div>', 'updates when an item is deleted (1)');

  delete object.tags[1];
  assert.equal(el.outerHTML, '<div>elixir, html</div>', 'updates when an item is deleted (2)');
});

test('within attributes', function(assert) {
  var el = render('<a href="#{ anchor }">{ name }</a>', {name: 'Javascript', anchor: 'js'});
  assert.equal(el.outerHTML, '<a href="#js">Javascript</a>', 'interpolates node quotes');
});

test('<script type="text/element" src="..."></script> includes', function(assert) {
  var
    el = render('hello.el', {name: 'Paul Engel', skills: ['ruby', 'javascript', 'elixir']}),
    object = el.binding;

  assert.equal(el.outerHTML, `<div><h1>Hello world!</h1>
<p>
  My name is Paul Engel.
</p>
<p>
  I am pretty much experienced in: ruby, javascript, elixir.
</p>
</div>`, 'matches and uses included <script> as template');

  object.name = 'Bruce Wayne';
  object.skills.length = 0;
  object.skills.push('crime fighting', 'being rich', 'looking cool in my suit');

  assert.equal(el.outerHTML, `<div><h1>Hello world!</h1>
<p>
  My name is Bruce Wayne.
</p>
<p>
  I am pretty much experienced in: crime fighting, being rich, looking cool in my suit.
</p>
</div>`, 'updates the element after changes');
});

test('render collections with primitive values', function(assert) {
  var
    el = render('<ul><li for="{ skills }">{ . }</li></ul>', {skills: ['ruby', 'javascript', 'elixir']}),
    object = el.binding;

  assert.equal(
    el.outerHTML,
    `<ul><li>ruby</li><li>javascript</li><li>elixir</li><template></template></ul>`,
    'gets interpolated value using `.`'
  );
});

test('render collections', function(assert) {
  var
    el = render('super-heroes.el', {super_heroes: [
      {name: 'Superman', alter_ego: 'Clark Joseph Kent'},
      {name: 'Batman', alter_ego: 'Bruce Wayne'},
      {name: 'Spider-Man', alter_ego: 'Peter Benjamin Parker'},
      {name: 'Iron Man', alter_ego: 'Anthony Edward Stark'},
      {name: 'Hulk', alter_ego: 'Robert Bruce Banner'}
    ]}),
    object = el.binding;

  assert.equal(el.outerHTML, `<div><h1>
  Super heroes
</h1>
<ul>
  <li>
    <strong>Superman</strong> (Clark Joseph Kent)
  </li><li>
    <strong>Batman</strong> (Bruce Wayne)
  </li><li>
    <strong>Spider-Man</strong> (Peter Benjamin Parker)
  </li><li>
    <strong>Iron Man</strong> (Anthony Edward Stark)
  </li><li>
    <strong>Hulk</strong> (Robert Bruce Banner)
  </li><template></template>
</ul>
</div>`, 'renders elements for every entry');

  object.super_heroes[1].alter_ego = 'Bram Engel';
  object.super_heroes[3].alter_ego = 'Tony Montana';

  assert.equal(el.outerHTML, `<div><h1>
  Super heroes
</h1>
<ul>
  <li>
    <strong>Superman</strong> (Clark Joseph Kent)
  </li><li>
    <strong>Batman</strong> (Bram Engel)
  </li><li>
    <strong>Spider-Man</strong> (Peter Benjamin Parker)
  </li><li>
    <strong>Iron Man</strong> (Tony Montana)
  </li><li>
    <strong>Hulk</strong> (Robert Bruce Banner)
  </li><template></template>
</ul>
</div>`, 'updates elements after changing entries');

//   delete object.super_heroes[0];
//   delete object.super_heroes[2];
//
//   assert.equal(el.outerHTML, `<div><h1>
//   Super heroes
// </h1>
// <ul>
//   <li>
//     <strong>Batman</strong> (Bram Engel)
//   </li><li>
//     <strong>Spider-Man</strong> (Peter Benjamin Parker)
//   </li><li>
//     <strong>Hulk</strong> (Robert Bruce Banner)
//   </li><template></template>
// </ul>
// </div>`, 'removes elements after deleted entries');
//
//   object.super_heroes = [{name: 'Foo', alter_ego: 'Bar'}];
//
//   assert.equal(el.outerHTML, `<div><h1>
//   Super heroes
// </h1>
// <ul>
//   <li>
//     <strong>Foo</strong> (Bar)
//   </li><template></template>
// </ul>
// </div>`, 'replaces all elements after assigning new array');
});

test('render nested collections', function(assert) {
  var
    el = render('heroes-vs-villains.el', {
      groups: [
        {
          name: 'Super heroes',
          characters: [
            {name: 'Superman'},
            {name: 'Batman'},
            {name: 'Spider-Man'},
            {name: 'Iron Man'},
            {name: 'Hulk'}
          ]
        }, {
          name: 'Super villains',
          characters: [
            {name: 'Lex Luthor'},
            {name: 'Joker'},
            {name: 'Venom'},
            {name: 'Mandarin'},
            {name: 'Sandman'}
          ]
        }
      ]
    }),
    object = el.binding;

  assert.equal(el.outerHTML, `<div><div>
  <h2>
    Super heroes
  </h2>
  <ul>
    <li>
      <strong>Superman</strong>
    </li><li>
      <strong>Batman</strong>
    </li><li>
      <strong>Spider-Man</strong>
    </li><li>
      <strong>Iron Man</strong>
    </li><li>
      <strong>Hulk</strong>
    </li><template></template>
  </ul>
</div><div>
  <h2>
    Super villains
  </h2>
  <ul>
    <li>
      <strong>Lex Luthor</strong>
    </li><li>
      <strong>Joker</strong>
    </li><li>
      <strong>Venom</strong>
    </li><li>
      <strong>Mandarin</strong>
    </li><li>
      <strong>Sandman</strong>
    </li><template></template>
  </ul>
</div><template></template>
</div>`, 'renders elements for every entry');
});

test('if statements', function(assert) {
  var
    el = document.createElement('div'),
    renderedEl = render('super-hero.el', {}),
    object = renderedEl.binding;

  el.appendChild(renderedEl);

  assert.equal(el.outerHTML, `<div><template></template></div>`, 'renders nothing when key is missing');

  object.selected = null;

  assert.equal(el.outerHTML, `<div><template></template></div>`, 'renders nothing when expression is falsy');

  object.selected = {name: 'Batman', description: 'Unlike most superheroes, Batman does not possess any inhuman superpowers. He does, however, possess a genius-level intellect, is a peerless martial artist, and his vast wealth affords him an extraordinary arsenal of weaponry and equipment.'};

  assert.equal(el.outerHTML, `<div><div>
  <h2>Batman</h2>
  <p>Unlike most superheroes, Batman does not possess any inhuman superpowers. He does, however, possess a genius-level intellect, is a peerless martial artist, and his vast wealth affords him an extraordinary arsenal of weaponry and equipment.</p>
</div><template></template></div>`, 'renders elements when expression is truthy');

  object.selected.description = 'He is a pancake! #justkiddingbruce <3';

  assert.equal(el.outerHTML, `<div><div>
  <h2>Batman</h2>
  <p>He is a pancake! #justkiddingbruce &lt;3</p>
</div><template></template></div>`, 'renders elements when expression is truthy');

  object.selected = null;

  assert.equal(el.outerHTML, `<div><template></template></div>`, 'renders nothing again when setting value to falsy');
});

test('tables and extensive javascript', function(assert) {
  var
    el = render('table-of-heroes.el', {}),
    object = el.binding;

  assert.equal(el.outerHTML, `<table>
  <tbody><template></template>
</tbody></table>`, 'renders nothing when key is missing');

  object.super_heroes = null;

  assert.equal(el.outerHTML, `<table>
  <tbody><template></template>
</tbody></table>`, 'renders nothing when value is not an array');

  object.super_heroes = [{name: 'Batman', created_at: 1556446639}];

  assert.equal(el.outerHTML, `<table>
  <tbody><tr>
    <td>Batman</td>
    <td>28-4-2019 12:17:19</td>
  </tr><template></template>
</tbody></table>`, 'renders table when assigned');

  object.super_heroes.push({name: 'Superman', created_at: 1556446642});

  assert.equal(el.outerHTML, `<table>
  <tbody><tr>
    <td>Batman</td>
    <td>28-4-2019 12:17:19</td>
  </tr><tr>
    <td>Superman</td>
    <td>28-4-2019 12:17:22</td>
  </tr><template></template>
</tbody></table>`, 'renders row for an added array item');

  object.super_heroes.unshift({name: 'Spider-Man', created_at: 1573163460});

  assert.equal(el.outerHTML, `<table>
  <tbody><tr>
    <td>Spider-Man</td>
    <td>7-11-2019 22:51:00</td>
  </tr><tr>
    <td>Batman</td>
    <td>28-4-2019 12:17:19</td>
  </tr><tr>
    <td>Superman</td>
    <td>28-4-2019 12:17:22</td>
  </tr><template></template>
</tbody></table>`, 'renders row at index 0 when unshifting');

  object.super_heroes.splice(1, 0, {name: 'Iron-Man', created_at: 1573166588});

  assert.equal(el.outerHTML, `<table>
  <tbody><tr>
    <td>Spider-Man</td>
    <td>7-11-2019 22:51:00</td>
  </tr><tr>
    <td>Iron-Man</td>
    <td>7-11-2019 23:43:08</td>
  </tr><tr>
    <td>Batman</td>
    <td>28-4-2019 12:17:19</td>
  </tr><tr>
    <td>Superman</td>
    <td>28-4-2019 12:17:22</td>
  </tr><template></template>
</tbody></table>`, 'renders row at index n when inserting');

  object.super_heroes = null;

  assert.equal(el.outerHTML, `<table>
  <tbody><template></template>
</tbody></table>`, 'renders nothing again when setting value to falsy');
});
