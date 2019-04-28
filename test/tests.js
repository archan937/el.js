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

  var el = render('<span>{ first_name } {last_name}</span>', {first_name: 'Paul'});
  assert.equal(el.outerHTML, '<span>Paul </span>', 'results as empty text in output when key non-existent (1)');

  var el = render('<span>{ first_name } {last_name}</span>', {last_name: 'Engel'});
  assert.equal(el.outerHTML, '<span> Engel</span>', 'results as empty text in output when key non-existent (2)');
});

test('interpolate simple values', function(assert) {
  var el = render('<span>{ first_name }</span>', {first_name: 'Paul'});
  assert.equal(el.outerHTML, '<span>Paul</span>', 'interpolates single expression within a text node');

  var el = render('<span>{ first_name } {last_name}</span>', {first_name: 'Paul', last_name: 'Engel'});
  assert.equal(el.outerHTML, '<span>Paul Engel</span>', 'interpolates multiple expressions within a text node');

  var el = render('<span>{ first_name } <strong>separator</strong> {last_name}</span>', {first_name: 'Paul', last_name: 'Engel'});
  assert.equal(el.outerHTML, '<span>Paul <strong>separator</strong> Engel</span>', 'respects nested nodes');
});

test('interpolate with plain JS', function(assert) {
  var el = render('<span>{ amount * price }</span>', {amount: 1982, price: 1.8});
  assert.equal(el.outerHTML, '<span>3567.6</span>', 'allows mathematic operations within expressions');

  var el = render('<span>{ first_name } {last_name} ({ tags.join(\', \') })</span>', {first_name: 'Paul', last_name: 'Engel', tags: ['ruby', 'elixir']});
  assert.equal(el.outerHTML, '<span>Paul Engel (ruby, elixir)</span>', 'allows function invocations within expressions');

  var el = render('<span>{ first_name } {last_name} ({ tags.join(\'{, }\') })</span>', {first_name: 'Paul', last_name: 'Engel', tags: ['ruby', 'elixir']});
  assert.equal(el.outerHTML, '<span>Paul Engel (ruby{, }elixir)</span>', 'does not crash when containing curly braces');
});

test('bind to objects', function(assert) {
  var
    object = {first_name: 'Paul', last_name: 'Engel', tags: ['ruby', 'elixir']},
    el = render('<span>{ first_name } {last_name}</span>', object);

  object.first_name = 'Bruce';
  assert.equal(el.outerHTML, '<span>Bruce Engel</span>', 'updates dependent text node after first change');

  object.last_name = 'Wayne';
  assert.equal(el.outerHTML, '<span>Bruce Wayne</span>', 'updates dependent text node after succeeding change');
});

test('bind to arrays', function(assert) {
  var
    object = {tags: ['ruby', 'elixir', 'javascript']},
    el = render('{ tags.join(\', \') }', object);

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
    object = {name: 'Paul Engel', skills: ['ruby', 'javascript', 'elixir']},
    el = render('hello.el', object);

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

test('render collections', function(assert) {
  var
    object = {super_heroes: [
      {name: 'Superman', alter_ego: 'Clark Joseph Kent'},
      {name: 'Batman', alter_ego: 'Bruce Wayne'},
      {name: 'Spider-Man', alter_ego: 'Peter Benjamin Parker'},
      {name: 'Iron Man', alter_ego: 'Anthony Edward Stark'},
      {name: 'Hulk', alter_ego: 'Robert Bruce Banner'}
    ]},
    el = render('super-heroes.el', object);

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

  delete object.super_heroes[0];
  delete object.super_heroes[2];

  assert.equal(el.outerHTML, `<div><h1>
  Super heroes
</h1>
<ul>
  <li>
    <strong>Batman</strong> (Bram Engel)
  </li><li>
    <strong>Spider-Man</strong> (Peter Benjamin Parker)
  </li><li>
    <strong>Hulk</strong> (Robert Bruce Banner)
  </li><template></template>
</ul>
</div>`, 'removes elements after deleted entries');

  object.super_heroes = [{name: 'Foo', alter_ego: 'Bar'}];

  assert.equal(el.outerHTML, `<div><h1>
  Super heroes
</h1>
<ul>
  <li>
    <strong>Foo</strong> (Bar)
  </li><template></template>
</ul>
</div>`, 'replaces all elements after assigning new array');
});

test('render nested collections', function(assert) {
  var
    object = {
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
    },
    el = render('heroes-vs-villains.el', object);

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
</div><template></template></div>`, 'renders elements for every entry');
});

test('if statements', function(assert) {
  var
    object = {},
    el = document.createElement('div');

  el.appendChild(render('super-hero.el', object));

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
