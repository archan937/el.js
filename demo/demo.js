Demo = (function() {
  var
    state = {
      super_heroes: [],
      groups: []
    },

  init = function() {
    document.render(state);
    update();
  },

  update = function(i) {
    setTimeout(function() {
      var object;

      if (i == 5) {
        return;
      }

      i = (i || 0);

      object = [
        {name: 'Superman', alter_ego: 'Clark Joseph Kent'},
        {name: 'Batman', alter_ego: 'Bruce Wayne'},
        {name: 'Spider-Man', alter_ego: 'Peter Benjamin Parker'},
        {name: 'Iron Man', alter_ego: 'Anthony Edward Stark'},
        {name: 'Hulk', alter_ego: 'Robert Bruce Banner'}
      ][i];

      if (object) {
        state.super_heroes.push(object);
      }

      object = [
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

      if (object) {
        state.groups.push(object);
      }

      update(i + 1);
    }, 250);
  };

  init();

}());
