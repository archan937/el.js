Demo = (function() {
  'use strict';

  var
    binding = document.binding,

  init = function() {
    document.render({
      super_heroes: [],
      groups: []
    });
    update();
  },

  update = function(i) {
    setTimeout(function() {
      var item;

      if (i == 5) {
        return;
      }

      i = (i || 0);

      item = [
        {name: 'Superman', alter_ego: 'Clark Joseph Kent'},
        {name: 'Batman', alter_ego: 'Bruce Wayne'},
        {name: 'Spider-Man', alter_ego: 'Peter Benjamin Parker'},
        {name: 'Iron Man', alter_ego: 'Anthony Edward Stark'},
        {name: 'Hulk', alter_ego: 'Robert Bruce Banner'}
      ][i];

      if (item) {
        binding.super_heroes.push(item);
      }

      item = [
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
      ][i];

      if (item) {
        binding.groups.push(item);
      }

      update(i + 1);
    }, 250);
  };

  init();

}());
