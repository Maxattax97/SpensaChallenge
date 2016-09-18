/////////////
// CLASSES //
/////////////

var Geotag = Backbone.Model.extend({
    defaults: {
        "title": "untitled",
        "note": "(no note)",
        "tags": {},
        "mark": null
    },
    initialize: function(params) {
        if (params == undefined || params.mark == undefined) {
            console.error("A marker is required to initialize a Geotag.", params);
            return null;
        }

        this.set({
            title: params.title || "untitled",
            note: params.note || "(no note)",
            tags: params.tags || {},
            mark: params.mark
        });

        var that = this; // 'this' will be passed to window otherwise.
        setTimeout(function() {
            that.select();
        }, 700);
    },
    select: function(wait) {
        if (selection != undefined) {
            selection.get("mark").setAnimation(null);
        }

        selection = this;

        this.get("mark").setAnimation(google.maps.Animation.BOUNCE);
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
        //'<div id="geotagTemplate" class="note">' +
        '    <div class="note-title"><%= title %></div>' +
        '    <button class="note-button delete">X</button>' +
        '    <button class="note-button edit">Edit</button>' +
        '    <p class="note-data"><%= note %></p>'),// +
        //'</div>'),
    events: {
        "click .note": "select",
        "click .note-button.edit": "edit",
        "click .note-button.delete": "delete"
    },
    initialize: function() {
        this.listenTo(this.model, "change", this.render);
    },
    render: function() {
        this.$el.html(this.template(this.model.toJSON()));
        //this.$el.removeClass("hidden");
        console.log(this.$el);
        return this;
    },
    edit: function() {
        console.log("EDIT");
    },
    delete: function() {
        console.log("DELETE");
    }
});

var AtlasView = Backbone.View.extend({
    el: "#notes",
    events: {
        "click #map": "addGeotag"
    },
    initialize: function() {
        this.$list = $("#notes");

        this.listenTo(atlas, "add", this.addItem);
    },
    addItem: function(tag) {
        var geotagView = new GeotagView({model: tag});
        this.$list.append(geotagView.render().el);
        return this;
    },
    addGeotag: function(event) {
        console.log(event);
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
