if (Meteor.isClient) {
  $(window).ready(function() {
    Meteor.subscribe('connect');
  });
}
(function() {
  if (Meteor.isServer) {
    Meteor.startup(function() {
      player = Players.findOne({})
      if (!player) {
        player = {
          currentRound: 0
        };
        player._id = Players.insert(player);
      } else {
        player.currentRound = 0;
        Players.update({_id:player._id}, player);
      }
    });

    /**
     * Publish information when first connected.
     */
    Meteor.publish('connect', function() {
      var player_;
      player_ = Players.findOne({});
      this.set('players', player_._id, player_);
      this.complete();
      this.flush();
    });

    /**
     * Publish player updates.
     */
    Meteor.publish('player-game', function(round) {
      var handle;
      handle = Players.find({currentRound: round}).observe({
        changed: _.bind(function(player) {
          console.log('\n\n', player._id, player.currentRound, '\n\n');
          this.set('players', player._id, player);
          this.flush();
        }, this),
        added: _.bind(function(player) {
          console.log('player added?');
          this.set('players', player._id, player);
          this.flush();
        }, this)
      });
      this.complete();
      this.flush();
      this.onStop(function() {
        handle.stop();
      });
    });

  }
  })();
  (function() {
  Meteor.methods({
    /**
     * When a user joins the round the client calls this method.
     */
    joinRound: function() {
      var player, playerRound;
      console.log('joining');
      player = Players.findOne({});
      if (player.currentRound !== 1) {
        console.log('updating player round', player, 1);
        player.currentRound = 1;
        Players.update({_id: player._id}, player);
      } else {
        console.log('not updating player round', player, 1);
      }
      console.log('join done', Players.findOne());
    },
  });
})();

var Players;

function startRound() {
}

/**
 * Players store additional information for users.
 * @type {Meteor.Collection}
 */
Players = new Meteor.Collection('players');

(function() {
  if (Meteor.isClient) {
    var currentRoundSub;

    /**
     * @param {Object} event
     */
    function joinRound(event) {
      Meteor.call('joinRound');
      Session.set('currentRound', 1);
    }


    /**
     * @return {boolean}
     */
    Template.playerStatus.isPlaying = function() {
      var player;
      console.log('is playering?');
      player = Players.findOne();
      if (!player) {
        console.log('no player', player);
        return false;
      }
      console.log('player.currentRound', player.currentRound);
      return player.currentRound > 0;
    };

    Template.playerStatus.events({
      'click .join-round': joinRound
    });

    Meteor.autorun(function() {
      console.log('Players updated!', Players.findOne());
    });

    Meteor.autosubscribe(function() {
    Meteor.subscribe('player-game', Session.get('currentRound'));
    });
    Meteor.autosubscribe(function() {
      console.log('round updates', Session.get('currentRound'));
      Meteor.subscribe('player-round-updates', Session.get('currentRound'));
    });
  }
})();
