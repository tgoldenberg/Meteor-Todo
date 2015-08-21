Tasks = new Mongo.Collection("tasks");

if (Meteor.isServer) {
 // This code only runs on the server
 // Only publish tasks that are public or belong to the current user
 Meteor.publish("tasks", function () {
   return Tasks.find({
     $or: [
       { private: {$ne: true} },
       { owner: this.userId }
     ]
   });
 });
}
if (Meteor.isClient) {
  // This code only runs on the client
  Meteor.subscribe("tasks");
  Template.body.helpers({
    tasks: function () {
      return Tasks.find({}, {sort: {createdAt: -1}});
    }
  });

  Template.body.events({
    "submit .new-task": function(event) {
      console.log(event);
      event.preventDefault();
      var text = event.target.text.value;
      Meteor.call("addTask", text);
      event.target.text.value = "";
    },
    "change .hide-completed input": function(event) {
      Session.set("hideCompleted", event.target.checked);
    }
  });

  Template.body.helpers({
    tasks: function() {
      if (Session.get("hideCompleted")) {
        return Tasks.find({checked: {$ne: true}}, {sort: {createdAt: -1}});
      } else {
        return Tasks.find({}, {sort: {createdAt: -1}});
      }
    },
    hideCompleted: function() {
      return Session.get("hideCompleted");
    },
    incompleteCount: function() {
      return Tasks.find({checked: {$ne: true}}).count();
    }
  });

  Template.task.events({
    "click .toggle-checked": function() {
      Meteor.call("setChecked", this._id, ! this.checked);
    },

    "click .delete": function() {
      Meteor.call("deleteTask", this._id);
    },

    "click .toggle-private": function() {
      Meteor.call("setPrivate", this._id, ! this.private);
    }
  });

  Accounts.ui.config({
    passwordSignupFields: "USERNAME_ONLY"
  });

  Template.task.helpers({
    isOwner: function() {
      return this.owner === Meteor.userId();
    }
  });
}

Meteor.methods({
  addTask: function(text) {
    if (! Meteor.userId()) {
      throw new Meteor.Error("not-authorized");
    }

    Tasks.insert({
      text: text,
      createdAt: new Date(),
      owner: Meteor.userId(),
      username: Meteor.user().username
    });
  },

  deleteTask: function(taskId) {
    Tasks.remove(taskId);
  },

  setChecked: function(taskId, setChecked) {
    Tasks.update(taskId, { $set: { checked: setChecked}});
  },

  setPrivate: function(taskId, setToPrivate) {
    var task = Tasks.findOne(taskId);

    if (task.owner !== Meteor.userId()) {
      throw new Meteor.Error("not-authorized");
    }

    Tasks.update(taskId, { $set: { private: setToPrivate} });
  }
});
