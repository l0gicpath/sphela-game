var Tests = new Meteor.Collection('tests');

if (Meteor.isClient) {
  Meteor.startup(function() {
    Session.set('testCount', 0)
    Meteor.subscribe('connect');
  });
  Template.app.testSuccess = function() {
    var test;
    console.log('checking test result');
    test = Tests.findOne();
    if (!test) {
      console.log('no test', test);
      return false;
    }
    console.log('test.testCount', test.testCount);
    return test.testCount > 0;
  };
  Template.app.events({
    'click .run-test': runTest
  });
  function runTest(event) {
    Meteor.call('runTest');
    Session.set('testCount', 1);
  }
  Meteor.autorun(function() {
    console.log('Tests updated!', Tests.findOne());
  });
  Meteor.autosubscribe(function() {
    Meteor.subscribe('test-results', Session.get('testCount'));
  });
}

if (Meteor.isServer) {
  Meteor.startup(function() {
    test = Tests.findOne({})
    if (!test) {
      test = {
        testCount: 0
      };
      console.log('inserting new test');
      test._id = Tests.insert(test);
    } else {
      console.log('startup reset');
      test.testCount = 0;
      Tests.update({_id:test._id}, test);
    }
  });

  Meteor.publish('connect', function() {
    var test_;
    console.log('Connecting test, getting initial data.');
    test_ = Tests.findOne({});
    this.set('tests', test_._id, test_);
    this.complete();
    this.flush();
  });

  Meteor.publish('test-results', function(test) {
    var handle;
    handle = Tests.find({testCount: test}).observe({
      changed: _.bind(function(test) {
        console.log('Test changed', test._id, test.testCount);
        this.set('tests', test._id, test);
        this.flush();
      }, this),
      added: _.bind(function(test) {
        console.log('Test added do nothing', test);
      }, this)
    });
    this.complete();
    this.flush();
    this.onStop(function() {
      handle.stop();
    });
  });
}
Meteor.methods({
  runTest: function() {
    var test;
    console.log('Running test.');
    test = Tests.findOne({});
    test.testCount = 1;
    console.log('Updating test to 1.');
    Tests.update({_id: test._id}, test);
    console.log('Test ran.', Tests.findOne());
  },
});

