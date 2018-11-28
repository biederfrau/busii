function show_tab(tab) {
    $(".tab").removeClass("active");
    $(".tab-content").removeClass("active");

    $(`.tab#${tab}`).addClass("active");
    $(`.tab-content[data-tab="${tab}"]`).addClass("active");
}

function spawn_tabs(k) {
    let tabs_template = $("template#tabs-template").html();
    Mustache.parse(tabs_template);

    let rendered = Mustache.render(tabs_template, {
        "keys": _.map(k, (v) => {
            return { "key": v };
        })
    });

    $("#misc").html(rendered);
    $("#misc .tab:first").addClass("active");
    $("#misc .tab-content:first").addClass("active");
}
