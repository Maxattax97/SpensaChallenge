/////////////
// CLASSES //
/////////////

var Geotag = Backbone.Model.extend({
    defaults: {
        "title": "untitled",
        "note": "(no note)",
        "tags": ["#tag1", "tag2", "long tag"],
        "mark": null,
        "editing": false
    },
    initialize: function(params) {
        if (params == undefined || params.mark == undefined) {
            console.error("A marker is required to initialize a Geotag.", params);
            return;
        }

        this.set({
            title: params.title || "untitled",
            note: params.note || "(no note)",
            tags: params.tags || ["#tag1", "tag2", "long tag"],
            mark: params.mark,
            editing: params.editing || false
        });
    },
    select: function(noZoomOrPan) {
        if (!noZoomOrPan) {
            map.panTo(this.get("mark").getPosition());
            if (map.getZoom() < 15) {
                map.setZoom(15);
            }
        }

        this.get("mark").setAnimation(google.maps.Animation.BOUNCE);
    },
    delete: function() {
        this.get("mark").setMap(null);
        atlas.remove(this);
        this.destroy();
    }
});

var Atlas = Backbone.Collection.extend({
    model: Geotag,
    /*localStorage: new Backbone.LocalStorage("max-ocull-geotag-atlas"),*/
    comparator: "title"
});

var GeotagView = Backbone.View.extend({
    tagName: "div",
    className: "note",
    //template: _.template($("#geotagTemplate").html()),
    template: _.template(
        '<div class="note-title"><%= title %></div>' +
        '<button class="note-button delete">X</button>' +
        '<button class="note-button edit">Edit</button>' +
        '<p class="note-data"><%= note %></p>'
    ),
    editingTemplate: _.template(
        '<input class="note-title edit-title" value="<%= title %>">' +
        '<button class="note-button delete">X</button>' +
        '<button class="note-button save">Save</button>' +
        '<textarea class="note-data edit-data" rows="3"><%= note %></textarea>' +
        '<input class="note-tags edit-tags" value="<% tags.join(\", \"); %>">' // hax
    ),
    events: {
        "click": "select",
        "click .note-button.edit": "edit",
        "dblclick": "edit",
        "click .note-button.delete": "delete",
        "click .note-button.save": "save"
    },
    initialize: function() {
        this.listenTo(this.model, "change", this.render);

        // Add a listener to focus on the markers when clicked on.
        var that = this;
        that.model.get("mark").addListener("click", function() {
            that.select();
        });

        console.log(this.model.get("tags"));

        this.model.set("editing", true); // Edit new geotags for information.
        this.select(undefined, true);
        //this.model.bind('add', this.selectNew, this)
    },
    render: function() {
        if (this.model.get("editing")) {
            this.$el.html(this.editingTemplate(this.model.toJSON()));
        } else {
            this.$el.html(this.template(this.model.toJSON()));
        }
        return this;
    },
    edit: function() {
        console.log("EDIT");
        this.model.set("editing", true);
    },
    save: function() {
        console.log("SAVE");
        this.model.set("title", this.$(".edit-title").val());
        this.model.set("note", this.$(".edit-data").val());
        var tags = this.$(".edit-tags").val().split(",");
        for (var i = 0; i < tags.length; i++) {
            tags[i] = tags[i].trim();
        }
        this.model.set("tags", tags);

        this.model.set("editing", false);
    },
    delete: function() {
        this.model.delete();
        this.remove();
    },
    select: function(view, noZoomOrPan) {
        // Sometimes a click event will be passed. Ignore it by detecting no
        // model. If no object is passed, assume this.
        if (view == undefined || view.model == undefined) {
            view = this;
        }

        if (selection == view) {
            return; // No change.
        } else if (selection != undefined) {
            if (selection.model.get("editing")) {
                selection.save(); // Will close editing after saving.
            }
            selection.$el.removeClass("highlight");
            selection.model.get("mark").setAnimation(null);
        }

        selection = view;

        view.model.select(noZoomOrPan);
        view.$el.addClass("highlight");
    }
});

var AtlasView = Backbone.View.extend({
    el: "#notes",
    initialize: function() {
        this.$list = $("#notes");

        this.listenTo(atlas, "add", this.addItem);
    },
    addItem: function(tag) {
        var geotagView = new GeotagView({model: tag});
        this.$list.append(geotagView.render().el);
        return this;
    }
});

///////////////
// EXECUTION //
///////////////

var map;
var selection;
var atlas = new Atlas();
var atlasView = new AtlasView();

/**
 * Callback that is fired after Google Maps API has loaded.
 */
function init() {
    initMap();
    //var notes = document.getElementsByClass("");
    $(document).dblclick(function(event) {
        console.log("Double click: ", $(event.target));
    });


}

/**
 * Initializes a Google Map focused on Purdue Research Park at zoom level 17.
 */
function initMap() {
    var purdueResearchPark = {lat: 40.4655383, lng: -86.9294276};
    map = new google.maps.Map(document.getElementById('map'), {
        center: purdueResearchPark,
        zoom: 17
    });

    google.maps.event.addListener(map, 'click', function(event) {
        //var params = {};
        //params.mark = new google.maps.Marker({position: event.latLng, map: map});
        atlas.add(new Geotag({mark: new google.maps.Marker({position: event.latLng, map: map, animation: google.maps.Animation.DROP})}));
    });
}

/**
 * Creates a note with specified title, data, and tags.
 * @param  {string} title   Title for the note.
 * @param  {string} data    Content that will reside within the note.
 * @param  {string[]} tags  String array of tags for the note.
 * @param {Marker} mark  Marker object that this note is tied to.
 */
function makeNote(title, data, tags, mark) {
    var newNote = $("#notes").add("div").addClass(".note");
    newNote.add("div").addClass(".note-title").append(title);
    newNote.add("button").addClass(".note-button").append("X");
    newNote.add("button").addClass(".note-button").append("Edit");
    newNote.add("p").append(data);
}

function selectNote(mark) {
    mark.setAnimation(google.maps.Animation.BOUNCE);
}
