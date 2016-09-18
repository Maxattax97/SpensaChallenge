var Geotag = Backbone.Model.extend({
    defaults: {
        "title": "untitled",
        "note": "(no note)",
        "tags": {},
        "mark": null
    },
    initialize: function(params) {
        if (params.mark == undefined) {
            console.error("A marker is required to initialize a Geotag.");
            return null;
        }

        this.set({
            title: params.title || "untitled",
            note: params.note || "(no note)",
            tags: params.tags || {},
            mark: params.mark
        });
    },
    select: function() {
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
