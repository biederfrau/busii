function setup_scatter(state) {
    let style = window.getComputedStyle(document.getElementById('scatter')),
        margin = {top: 20, right: 20, bottom: 23, left: 37},
        width = parseFloat(style.width),
        height = parseFloat(style.height),
        canvas = d3.select("#scatter");

    let angle = Math.PI/1.15, scale = 0.65, origin = [384, 400];

    let grid = d3._3d()
        .shape('GRID', 40)
        .origin(origin)
        .x(d => d[0])
        .y(d => d[2])
        .z(d => d[1])
        .rotateX(-angle)
        .rotateY( angle)
        .scale(scale);

    let d3point_proj = d3._3d()
        .x(d => d[0])
        .y(d => d[2])
        .z(d => d[1])
        .origin(origin)
        .rotateX(-angle)
        .rotateY( angle)
        .scale(scale);

    let ctx = { "d3point_proj": d3point_proj, "grid": grid };

    let mx, my, mouseX, mouseY;
    let drag = d3.drag().on('drag', () => {
        mouseX = mouseX || 0;
        mouseY = mouseY || 0;

        let beta = (d3.event.x - mx + mouseX) * Math.PI / 530,
            alpha = (d3.event.y - my + mouseY) * Math.PI / 530;

        d3point_proj.rotateY(beta + angle).rotateX(alpha - angle);
        grid.rotateY(beta + angle).rotateX(alpha - angle);

        draw_scatter(state.data.cluster_coords, state, ctx);
    }).on('start', () => {
        mx = d3.event.x;
        my = d3.event.y;
    }).on('end', () => {
        mouseX = d3.event.x - mx + mouseX;
        mouseY = d3.event.y - my + mouseY;
    });

    canvas.on("contextmenu", () => d3.event.preventDefault());
    canvas.call(drag);

    let zoom = d3.zoom().on('zoom', () => {
        let trafo = d3.event.transform;

        let points = canvas.selectAll(".point, .cluster-point");
        points.attr("transform", trafo.toString());

        canvas.selectAll(".grid").attr("transform", trafo.toString());
    });//.filter(() => d3.event.buttons == 2 || d3.event.button == 0);

    // canvas.append("rect").attr("width", "100%").attr("height", "100%").style("opacity", 0.0).raise().call(zoom);
    canvas.call(zoom);

    canvas.on("dblclick.zoom", null);
    canvas.on("dblclick", () => {
        canvas.call(zoom.transform, d3.zoomIdentity);
    });

    state.dispatcher.on("control:step.scatter control:step-drag.scatter", t => {
        canvas.selectAll(".point").classed("inactive", d => {
            let parse_time = d3.timeParse('%Y-%m-%dT%H:%M:%S.%f%Z')
            let tp = parse_time(d[3]);
            return tp >= t;
        });
    });

    state.dispatcher.on("data:change.scatter", () => {
        console.log(state.data)
        draw_scatter(state.data.cluster_coords, state, ctx);
    });

    draw_scatter(state.data.cluster_coords, state, ctx);
}

function draw_scatter(data, state, context) {
    let style = window.getComputedStyle(document.getElementById('scatter')),
        margin = {top: 20, right: 20, bottom: 23, left: 37},
        width = parseFloat(style.width),
        height = parseFloat(style.height),
        canvas = d3.select("#scatter");

    if(!data) {
        utils.noData(canvas, width, height);
        return;
    }
    canvas.selectAll(".no-data").remove();

    let grid_points = [];
    for(let x = -400; x < 400; x += 20) {
        for(let z = -400; z < 400; z += 20) {
            grid_points.push([x, z, 0]);
        }
    }

    let grid = canvas.selectAll('path').data(context['grid'](grid_points));
    grid.enter().append("path")
        .classed("_3d", true)
        .classed("grid", true)
        .merge(grid)
        .attr("stroke", "black")
        .attr("stroke-width", 0.3)
        .attr("fill", d => !d.ccw ? 'lightgrey' : '#717171')
        .attr("fill-opacity", 0.9)
        .attr("d", context['grid'].draw);

    let centroids = _.map(data, d => [d.centroid, d.min_time]);
    let x_min = d3.median(centroids, d => d[0][0]), y_min = d3.median(centroids, d => d[0][1]), z_min = d3.min(centroids, d => d[0][2]);
    centroids = _.map(centroids, d => [d[0][0] - x_min, d[0][1] - y_min, d[0][2] - z_min, d[1]]);

    let points = canvas.selectAll(".point").data(context["d3point_proj"](centroids));
    points.enter().append("circle")
        .classed("point", true)
        .classed("_3d", true)
        .merge(points)
        .classed("inactive", d => {
            let parse_time = d3.timeParse('%Y-%m-%dT%H:%M:%S.%f%Z')
            let time = parse_time(d[3]);
            return time >= state.step;
        }).attr("cx", d => d.projected.x)
        .attr("cy", d => d.projected.y)
        .attr("data-tippy-content", (d, i) => `${_.round(d[0], 3)}, ${_.round(d[1], 3)}, ${_.round(d[2], 3)} (${data[i].points.length})`)
        .on("mouseover", function() { d3.select(this).raise(); })
        .on("click", function(d, i) {
            d.expanded = !d.expanded;
            d3.select(this).classed("expanded", d.expanded);
            // TODO
        });

    tippy("#scatter .point");
    points.exit().remove();
}

function setup_activity(state) {
    let style = window.getComputedStyle(document.getElementById('activity')),
        margin = {top: 20, right: 20, bottom: 23, left: 37},
        width = parseFloat(style.width),
        height = parseFloat(style.height),
        canvas = d3.select("#activity");

    canvas.append("g").classed("xaxis", true).attr("transform", "translate(" + [0, height - margin.bottom] + ")");
    canvas.append("g").classed("yaxis", true).attr("transform", "translate(" + [margin.left, 0] + ")");

    let x = d3.scaleTime().range([margin.left, width - margin.right]),
        y = d3.scaleBand().rangeRound([height - margin.bottom, margin.top]).padding(0.1);

    state.dispatcher.on("control:step.activity", t => {
        let x12 = x(t);
        canvas.select(".time-line")
            .attr("x1", x12)
            .attr("x2", x12)
            .raise();
    });

    let time_line = canvas.append("line")
        .classed("time-line", true)
        .attr("x1", width - margin.right)
        .attr("y1", height - margin.bottom + 13)
        .attr("x2", width - margin.right)
        .attr("y2", margin.top - 10)
        .attr("stroke", "grey")
        .attr("stroke-width", 4)
        .attr("stroke-dasharray", 0)
        .style("opacity", 0.8)
        .style("display", "none");

    let drag = d3.drag().on('drag', () => {
        if(d3.event.x <= margin.left || d3.event.x >= width - margin.right) { return; }
        time_line.attr("x1", d3.event.x).attr("x2", d3.event.x);

        let time = x.invert(d3.event.x);
        time = _.max([_.first(state.timestamps), time]);
        time = _.min([_.last(state.timestamps), time]);

        state.dispatcher.call("control:step-drag", this, time);
    }).on('end', () => {
        let time = x.invert(d3.event.x);
        time = _.max([_.first(state.timestamps), time]);
        time = _.min([_.last(state.timestamps), time]);
        time_line.attr("x1", x(time)).attr("x2", x(time));

        state.step = time;
        state.dispatcher.call("control:step", this, time);
    });

    time_line.call(drag);
    canvas.on('click', drag.on('end'));

    let ctx = { "x": x, "y": y };
    state.dispatcher.on("data:change.activity", () => {
        draw_activity(state.data.activity, state, ctx);
    });

    draw_activity(state.data.activity, state, ctx);
}

function draw_activity(data, state, context) {
    let canvas = d3.select("#activity"),
        style = window.getComputedStyle(document.getElementById('activity'))
        width = parseFloat(style.width),
        height = parseFloat(style.height);

    if(!data) {
        utils.noData(canvas, width, height);
        return;
    }
    canvas.selectAll(".no-data").remove();
    canvas.select(".time-line").style("display", undefined);

    let parse_time = d3.timeParse('%Y-%m-%dT%H:%M:%S.%L%Z'),
        parsed_data = _.map(data.sections, x => [parse_time(x[0]), parse_time(x[1])]);

    context.x.domain([parsed_data[0][0], _.last(parsed_data)[1]]);
    context.y.domain([state.proc_id]);

    canvas.select(".xaxis").call(d3.axisBottom(context.x));
    canvas.select(".yaxis").call(d3.axisLeft(context.y));

    let bars = canvas.selectAll(".bar").data(parsed_data);

    bars.enter().insert("rect", ".time-line")
        .classed("bar", true)
        .merge(bars)
        .attr("x", d => context.x(d[0]))
        .attr("y", d => context.y(state.proc_id))
        .attr("height", context.y.bandwidth())
        .attr("width", d => context.x(d[1]) - context.x(d[0]))
        .attr("fill", data.color);

    bars.exit().remove();
}

function setup_misc(state) {
    _.each(state.misc_keys, name => {
        if(name == 'actToolIdent') {
            setup_gantt(name);
        } else {
            setup_step(name);
        }
    });
}

function setup_gantt(name, data) {
    let style = window.getComputedStyle(document.getElementById(name + '-svg')),
        margin = {top: 30, right: 20, bottom: 23, left: 100},
        width = parseFloat(style.width),
        height = parseFloat(style.height),
        canvas = d3.select("#" + name + '-svg');

    canvas.append("g").classed("xaxis", true).attr("transform", "translate(" + [0, height - margin.bottom] + ")");
    canvas.append("g").classed("yaxis", true).attr("transform", "translate(" + [margin.left, 0] + ")");

    let x = d3.scaleTime().range([margin.left, width - margin.right]),
        y = d3.scaleBand().rangeRound([height - margin.bottom, margin.top]).padding(0.1);

    canvas.append("rect")
        .classed("time-mask", true)
        .attr("x", width - margin.right)
        .attr("y", margin.top)
        .attr("width", 0)
        .attr("height", height - margin.top - margin.bottom);

    state.dispatcher.on(`control:step.${name} control:step-drag.${name}`, t => {
        let xcoord = x(t);
        canvas.select(".time-mask")
            .attr("x", xcoord + 1)
            .attr("width", width - margin.right - xcoord);
    });

    let ctx = { "x": x, "y": y };
    state.dispatcher.on(`data:change.${name}`, () => {
        draw_gantt(name, state.data.misc[name], state, ctx);
    });

    draw_gantt(name, data, state, ctx);
}

function draw_gantt(name, data, state, context) {
    let style = window.getComputedStyle(document.getElementById(name + '-svg')),
        margin = {top: 20, right: 20, bottom: 23, left: 100},
        width = parseFloat(style.width),
        height = parseFloat(style.height),
        canvas = d3.select("#" + name + '-svg');

    if(!data) {
        utils.noData(canvas, width, height);
        return;
    }
    canvas.selectAll(".no-data").remove();

    let parse_time = d3.timeParse('%Y-%m-%dT%H:%M:%S.%L%Z'),
        parsed_data = _.map(data, x => [parse_time(x[0]), parse_time(x[1]), x[2]]);

    context.x.domain([parsed_data[0][0], _.last(parsed_data)[1]]);
    context.y.domain(_.map(parsed_data, x => x[2]));

    let colors = d3.scaleOrdinal(d3.schemeSet2).domain(context.y.domain());

    canvas.select(".xaxis").call(d3.axisBottom(context.x));
    canvas.select(".yaxis").call(d3.axisLeft(context.y));

    let bars = canvas.selectAll(".bar").data(parsed_data);

    bars.enter().insert("rect", ".time-mask")
        .classed("bar", true)
        .merge(bars)
        .attr("x", d => context.x(d[0]))
        .attr("y", d => context.y(d[2]))
        .attr("height", context.y.bandwidth())
        .attr("width", d => context.x(d[1]) - context.x(d[0]))
        .attr("fill", d => colors(d[2]));

    bars.exit().remove();
}

function setup_step(name, data) {
    let style = window.getComputedStyle(document.getElementById('actToolIdent-svg')), // XXX non-hidden one
        margin = {top: 20, right: 20, bottom: 23, left: 35},
        width = parseFloat(style.width),
        height = parseFloat(style.height),
        canvas = d3.select("#" + name + '-svg');

    canvas.append("g").classed("xaxis", true).attr("transform", "translate(" + [0, height - margin.bottom] + ")");
    canvas.append("g").classed("yaxis", true).attr("transform", "translate(" + [margin.left, 0] + ")");

    let x = d3.scaleTime().range([margin.left, width - margin.right]),
        y = d3.scaleLinear().range([height - margin.bottom, margin.top]);

    canvas.append("rect")
        .classed("time-mask", true)
        .attr("x", width - margin.right)
        .attr("y", margin.top - 5)
        .attr("width", 0)
        .attr("height", height - margin.top - margin.bottom + 5);

    state.dispatcher.on(`control:step.${name} control:step-drag.${name}`, t => {
        let xcoord = x(t);
        canvas.select(".time-mask")
            .attr("x", xcoord + 1)
            .attr("width", width - margin.right - xcoord + 5);
    });

    let ctx = { "x": x, "y": y, "height": height };

    state.dispatcher.on(`data:change.${name}`, () => {
        draw_step(name, state.data.misc[name], state, ctx);
    });

    draw_step(name, data, state, ctx);
}

function draw_step(name, data, state, context) {
    let style = window.getComputedStyle(document.getElementById('actToolIdent-svg')), // XXX non-hidden one
        width = parseFloat(style.width),
        height = parseFloat(style.height),
        canvas = d3.select("#" + name + '-svg');

    if(!data) {
        utils.noData(canvas, width, height);
        return;
    }
    canvas.selectAll(".no-data").remove();

    let parse_time = d3.timeParse('%Y-%m-%dT%H:%M:%S.%L%Z'),
        parsed_data = _.map(data, x => [parse_time(x[0]), x[1]]);

    let colors = {
        'feedRateOvr': "#736AFF",
        'actToolRadius': "#728C00",
        'actToolLength1': "#E8A317"
    };

    context.x.domain([parsed_data[0][0], _.last(parsed_data)[0]]);
    context.y.domain([0, d3.max(parsed_data, x => x[1])]);

    canvas.select(".xaxis").call(d3.axisBottom(context.x));
    canvas.select(".yaxis").call(d3.axisLeft(context.y));

    let line = d3.line()
        .x(d => context.x(d[0]))
        .y(d => context.y(d[1]))
        .curve(d3.curveStepAfter);

    let lines = canvas.selectAll(".line").data([parsed_data]);
    lines.enter().insert("path", ".time-mask")
        .classed("line", true)
        .merge(lines)
        .attr("d", line)
        .attr("stroke", colors[name])
        .attr("fill", "none");
}

function setup_time(state) {
    let style = window.getComputedStyle(document.getElementById('time')),
        margin = {top: 40, right: 30, bottom: 30, left: 60},
        width = parseFloat(style.width),
        height = parseFloat(style.height),
        canvas = d3.select("#time");

    let gutter_x = 60, gutter_y = 100;
    let width_cols = (width - margin.left - margin.right - 2*gutter_x)/3,
        height_rows = (height - margin.top - margin.bottom - 2*gutter_y)/3;

    let axes = [];
    for(let i = 0; i < 3; ++i) {
        axes.push([]);
        for(let j = 0; j < 3; ++j) {
            let left = margin.left + i*(width_cols + gutter_x),
                down = margin.top + j*(height_rows + gutter_y) + height_rows;

            canvas.append("g").classed(`xaxis-${i}-${j}`, true).attr("transform", "translate(" + [left, down] + ")");
            let x = d3.scaleTime().range([0, width_cols]);

            canvas.append("g").classed(`yaxis-${i}-${j}`, true).attr("transform", "translate(" + [left, down - height_rows] + ")");
            let y = d3.scaleLinear().range([height_rows, 0]);

            canvas.append("g").classed(`group-${i}-${j}`, true).attr("transform", "translate(" + [left, down - height_rows] + ")");
            axes[i].push({ "x": x, "y": y });

            canvas.append("rect")
                .classed("time-mask", true)
                .classed(`mask-${i}-${j}`, true)
                .attr("x", left + width_cols)
                .attr("y", down - height_rows)
                .attr("height", height_rows);
        }
    }

    state.dispatcher.on("control:step.time control:step-drag.time", t => {
        for(let i = 0; i < 3; ++i) {
            for(let j = 0; j < 3; ++j) {
                let left = margin.left + i*(width_cols + gutter_x);
                let xcoord = axes[i][j].x(t);
                canvas.select(`.mask-${i}-${j}`)
                    .attr("x", left + Math.max(xcoord, 0) + 1)
                    .attr("width", Math.max(width_cols - xcoord, 0)); // FIXME
            }
        }
    });

    let ctx = { "axes": axes, "width_cols": width_cols, "height_rows": height_rows, "gutter_x": gutter_x, "gutter_y": gutter_y };

    state.dispatcher.on("data:change.time", () => {
        draw_time(state.data.timeseries, state, ctx);
    });

    draw_time(state.data.timeseries, state, ctx);
}

function draw_time(data, state, context) {
    let canvas = d3.select("#time"),
        style = window.getComputedStyle(document.getElementById('time')),
        margin = {top: 40, right: 30, bottom: 30, left: 60},
        width = parseFloat(style.width),
        height = parseFloat(style.height),
        parse_time = d3.timeParse('%Y-%m-%dT%H:%M:%S.%L%Z');

    if(!data) {
        utils.noData(canvas, width, height);
        return;
    }
    canvas.selectAll(".no-data").remove();

    let keys_i = _.map(data, (_, k) => k), keys_j = ['X', 'Y', 'Z'];

    let colors = {
        'aaVactB': "#2B65EC",
        'aaLoad': "#4E9258",
        'aaTorque': "#F87217"
    };

    for(let i = 0; i < 3; ++i) {
        if(canvas.selectAll(".title-text").size() < 3) {
            canvas.append("text").text(keys_i[i])
                .attr("x", margin.left + i*(context.width_cols + context.gutter_x) + context.width_cols/2)
                .attr("y", 20)
                .attr("text-anchor", "middle")
                .classed("title-text", true);
        }

        for(let j = 0; j < 3; ++j) {
            let cur_data = data[keys_i[i]][keys_j[j]];
            let parsed_data = _.map(cur_data, x => [parse_time(x[0]), x[1]]);

            context.axes[i][j].x.domain([parsed_data[0][0], _.last(parsed_data)[0]]);
            canvas.select(`.xaxis-${i}-${j}`).call(d3.axisBottom(context.axes[i][j].x).ticks(8));

            context.axes[i][j].y.domain(d3.extent(parsed_data, x => x[1]));
            canvas.select(`.yaxis-${i}-${j}`).call(d3.axisLeft(context.axes[i][j].y).ticks(8));

            let line = d3.line().x(d => context.axes[i][j].x(d[0])).y(d => context.axes[i][j].y(d[1]));

            let group = canvas.select(`.group-${i}-${j}`);
            let lines = group.selectAll('.line').data([parsed_data]);
            lines.enter().append("path")
                .classed("line", true)
                .merge(lines)
                .attr("d", line)
                .attr("stroke", colors[keys_i[i]])
                .attr("fill", "none");

            lines.exit().remove();
        }
    }
}

function fetch_data(primary, others) {
    let p = fetch(`/proc/${primary}/activities`).then(response => response.json()).then(json => {
        state.data.activity = json;
    }).catch(() => {
        console.log("activity fetch failed");
        delete state.data.activity;
    });

    let q = fetch(`/proc/${primary}/cluster_coords`).then(response => response.json()).then(json => {
        state.data.cluster_coords = json;
    }).catch(() => {
        console.log("cluster coords fetch failed");
        delete state.data.cluster_coords;
    });

    let r = fetch(`/proc/${primary}/misc`).then(response => response.json()).then(json => {
        state.data.misc = json;
    }).catch(() => {
        console.log("misc fetch failed");
        delete state.data.misc;
    });

    let s = fetch(`/proc/${primary}/timeseries`).then(response => response.json()).then(json => {
        state.data.timeseries = json;
    }).catch(() => {
        console.log("timeseries fetch failed");
        delete state.data.timeseries;
    });

    let t = fetch(`/proc/${primary}/timestamps`).then(response => response.json()).then(json => {
        let parse_time = d3.timeParse('%Y-%m-%dT%H:%M:%S.%L%Z')
        state.timestamps = _.map(json, t => parse_time(t));
        state.step = _.last(state.timestamps);
    }).catch(() => {
        console.log("timestamp fetch failed");
        delete state.data.timeseries;
    });

    return [p, q, r, s, t];
}

var state;
function do_the_things() {
    state = {
        stepsize: 60,
        interval: 1,
        timestamps: [],
        dispatcher: d3.dispatch("time:brush", "control:step", "control:step-drag", "data:change"),
        proc_id: new URL(window.location.href).searchParams.get("p"),
        misc_keys: ['actToolIdent', 'actToolLength1', 'actToolRadius', 'feedRateOvr'],
        data: {}
    };

    if(!state.proc_id) {
        alert("error p query param not set");
    }

    setup_scatter(state);
    setup_activity(state);
    spawn_tabs(state.misc_keys);
    setup_misc(state);
    setup_time(state);

    let u = fetch(`/tree`).then(response => response.json()).then(json => {
        state.tree = json;
    });

    let int;
    $("#control #play").click(function() {
        $(this).attr("disabled", true);
        $("#control #pause").attr("disabled", false);
        int = setInterval(() => {
            $("#control #step-forward").triggerHandler("click");
        }, 1000*state.interval);
    });

    $("#control #pause").click(function() {
        $(this).attr("disabled", true);
        $("#control #play").attr("disabled", false);
        clearInterval(int);
    });

    $("#control #step-forward").click(function() {
        state.step = utils.addSeconds(state.step, state.stepsize);
        state.step = _.min([state.step, _.last(state.timestamps)]);

        state.dispatcher.call("control:step", this, state.step);
    });

    $("#control #step-backward").click(function() {
        state.step = utils.substractSeconds(state.step, state.stepsize);
        state.step = _.max([_.first(state.timestamps), state.step]);

        state.dispatcher.call("control:step", this, state.step);
    });

    $("#control #to-start").click(function() {
        state.step = _.first(state.timestamps);
        state.dispatcher.call("control:step", this, state.step);
    });

    $("#control #to-end").click(function() {
        state.step = _.last(state.timestamps);
        state.dispatcher.call("control:step", this, state.step);
    });

    state.dispatcher.on("control:step.buttons control:step-drag", t => {
        $("#control #step-forward").attr("disabled", false);
        $("#control #to-end").attr("disabled", false);
        $("#control #step-backward").attr("disabled", false);
        $("#control #to-start").attr("disabled", false);

        if(t >= _.last(state.timestamps)) {
            $("#control #step-forward").attr("disabled", true);
            $("#control #to-end").attr("disabled", true);
        } else if(t <= _.first(state.timestamps)) {
            $("#control #step-backward").attr("disabled", true);
            $("#control #to-start").attr("disabled", true);
        }
    })

    tippy("#control #select", {
        trigger: "click",
        arrow: true,
        interactive: true,
        content: "loading...",
        size: "large",
        maxWidth: "800px",
        onShown: (tip) => {
            let template = `
              <div style="height: 500px; width: 500px; overflow-y: auto;">
                <table class="treetable">
                  <tbody>
                    {{#nodes}}
                    <tr data-tt-id="{{id}}" data-tt-parent-id="{{parent}}">
                      <td>{{name}}</td>
                    </tr>
                    {{/nodes}}
                  </tbody>
                </table>
              </div>
              <div id="process-select" style="margin-top: 0.5em">
                <label for="procselection">primary process: &nbsp;</span>
                <select name="procselection" id="procselection" style="width: 370px">
                </select>
              </div>
            `;

            Mustache.parse(template);

            let rendered = Mustache.render(template, {
                nodes: state.tree
            });

            tip.setContent(rendered);
            $(".treetable").treetable({ expandable: true });

            $(".treetable tbody").off("click.select").on("click.select", "tr.leaf", function() {
                let pid = $(this).data('tt-id');
                $(this).toggleClass("selected");
                if($(this).hasClass("selected")) {
                    $("#procselection").append($(`<option value="${pid}">${pid}</option>`));
                } else {
                    $(`#procselection option[value="${pid}"]`).remove();
                }
            });
        },
        onHide: (tip) => {
            let selected = _.map($(".treetable tr.leaf.selected"), e => $(e).data('tt-id'));
            let primary = +$("#procselection").val();
            let other = _.difference(selected, [primary]);

            let promises = fetch_data(primary);
            Promise.all(promises).then(() => {
                state.dispatcher.call("data:change");
                state.step = _.last(state.timestamps);
                state.dispatcher.call("control:step", this, state.step);
            });
        },
        theme: "light-border"
    });

    tippy("#control #settings", {
        trigger: "click",
        arrow: true,
        interactive: true,
        content: "loading...",
        size: "large",
        maxWidth: "400px",
        onShown: (tip) => {
            let template = $("template#settings-template").html();
            Mustache.parse(template);

            let rendered = Mustache.render(template, {
                stepsize: state.stepsize,
                interval: state.interval
            });

            $("input#stepsize").change(function() {
                let stepsize = +$("input#stepsize").val();
                state.stepsize = stepsize;
            });

            $("input#interval").change(function() {
                let interval = +$("input#interval").val();
                state.interval = interval;
            });

            tip.setContent(rendered);
        },
        theme: "light-border",
    })
}
