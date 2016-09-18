/////////////
// CLASSES //
/////////////

var Geotag = Backbone.Model.extend({
    defaults: {
        "title": "",
        "note": "",
        "tags": [""],
        "mark": null,
        "editing": false
    },
    initialize: function(params) {
        if (params == undefined || params.mark == undefined) {
            console.error("A marker is required to initialize a Geotag.", params);
            return;
        }

        this.set({
            title: params.title || "",
            note: params.note || "",
            tags: params.tags || [""],
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
    template: _.template(
        '<div class="note-title"><%= title %></div>' +
        '<button class="note-button delete">X</button>' +
        '<button class="note-button edit">Edit</button>' +
        '<p class="note-data"><%= note %></p>' +
        '<% if (tags.length > 0) { %>' + // moar hax
        '   <% for(var tag in tags) { %>' +
        '       <div class="note-tag"><%= tags[tag] %></div>' +
        '   <% } %>' +
        '<% } %>'
    ),
    editingTemplate: _.template(
        '<input class="note-title edit-title" placeholder="SITE B36" ' +
            'value="<%= title %>">' +
        '<button class="note-button delete">X</button>' +
        '<button class="note-button save">Save</button>' +
        '<textarea class="note-data edit-data" placeholder="Approximately 13 ' +
            'weeds in this area. Spray advised. 90% of field infested by ' +
            'Soybean Aphids." rows="3"><%= note %></textarea>' +
        '<input class="note-tags edit-tags" placeholder="soybean, aphids' +
            ', spray advised, weeds" value="<%=tags.join(", ") %>">' // hax
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

        this.edit(); // Edit new geotags for information.
        this.select(undefined, true);
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
        this.model.set("editing", true);
    },
    save: function(noAutofill) {
        var title = this.$(".edit-title").val();
        title = title == ""? "UNTITLED" : title;
        var note = this.$(".edit-data").val();
        note = note == "" ? "N/A" : note;

        this.model.set("title", title);
        this.model.set("note", note);

        // For some reason the string input is blank the first time?
        var strs = this.$(".edit-tags").val().split(",");
        console.log(this.$(".edit-tags").val(), "\n", this.$(".edit-tags").attr("value"), "\n", strs);
        var tags = [];
        var i = 0;
        strs.forEach(function(str) {
            var trm = str.trim();
            if (trm != "") {
                tags[i] = trm;
                i++;
            }
        });
        console.log("strs: ", strs);
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
 * Initializes a Google Map focused on Purdue Research Park at zoom level 17.
 * Fired after Google Maps API has loaded.
 */
function init() {
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
