var VariableStore = require('../../lib/VariableStore');

function getBaseVariableStore(toExclude) {
  var vs = new VariableStore();
  vs.var('popularity:field', 'field value');
  vs.var('popularity:modifier', 'modifier value');
  vs.var('popularity:max_boost', 'max_boost value');

  if (toExclude) {
    vs.unset(toExclude);
  }

  return vs;

}

module.exports.tests = {};

module.exports.tests.interface = function(test, common) {
  test('interface: contructor', function(t) {
    var popularity = require('../../view/popularity')(function() {});

    t.equal(typeof popularity, 'function', 'valid function');
    t.equal(popularity.length, 1, 'takes 1 arg');
    t.end();
  });

}

module.exports.tests.missing_variable_conditions = function(test, common) {
  test('null subview should return null', function(t) {
    var popularity = require('../../view/popularity')(null);

    var vs = getBaseVariableStore();

    t.equal(popularity(vs), null, 'should have returned null');
    t.end();

  });

  var variables = Object.keys(getBaseVariableStore().export());

  variables.forEach(function(missing_variable) {
    test('missing required variable should return null', function(t) {
      var popularity = require('../../view/popularity')(function() {});

      var vs = getBaseVariableStore(missing_variable);

      t.equal(popularity(vs), null, 'should have returned null');
      t.end();

    });
  });

};


module.exports.tests.no_exceptions_conditions = function(test, common) {
  test('all fields available should populate all fields', function(t) {
    var subview = function(vs) {
      return {
        'subview field': 'subview value'
      };
    }

    var popularity = require('../../view/popularity')(subview);

    var vs = getBaseVariableStore();
    vs.var('popularity:weight', 17);

    var actual = popularity(vs);

    var expected = {
      function_score: {
        query: {
          'subview field': 'subview value'
        },
        max_boost: { $: 'max_boost value' },
        functions: [
          {
            field_value_factor: {
              'modifier': { $: 'modifier value' },
              'field': { $: 'field value' },
              'missing': 1
            },
            weight: { $: 17 }
          }
        ],
        score_mode: 'first',
        boost_mode: 'replace'
      }

    }

    t.deepEquals(actual, expected, 'should have returned object');
    t.end();

  });

};

module.exports.all = function (tape, common) {
  function test(name, testFunction) {
    return tape('popularity ' + name, testFunction);
  }
  for( var testCase in module.exports.tests ){
    module.exports.tests[testCase](test, common);
  }
};
