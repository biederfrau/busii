function setup_scatter(state) {
    let style = window.getComputedStyle(document.getElementById('activity')),
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
        if(d3.event.sourceEvent.buttons == 1) {
            let beta = (d3.event.x - mx + mouseX) * Math.PI / 530,
                alpha = (d3.event.y - my + mouseY) * Math.PI / 530;

            d3point_proj.rotateY(beta + angle).rotateX(alpha - angle);
            grid.rotateY(beta + angle).rotateX(alpha - angle);

            draw_scatter(state.data.cluster_coords, state, ctx);
        } else if(d3.event.sourceEvent.buttons == 2) {
            return;
            // FIXME
            canvas.selectAll(".point").attr("transform", function() {
                this.x = this.x || 0;
                this.y = this.y || 0;

                let scale = "scale(1)";
                if(d3.select(this).attr('transform')) {
                    let split = d3.select(this).attr("transform").split(" ");
                    if(split.length >= 2) {
                        scale = split[1];
                    }

                    let translate = split[0].slice(10, -1).split(",");
                    this.x = +translate[0];
                    this.y = +translate[1];
                }

                this.x += d3.event.dx;
                this.y += d3.event.dy;

                return "translate(" + [this.x, this.y] + ") " + scale;
            });

            canvas.selectAll(".grid").attr("transform", function() {
                this.x = this.x || 0;
                this.y = this.y || 0;

                let scale = "scale(1)";
                if(d3.select(this).attr('transform')) {
                    let split = d3.select(this).attr("transform").split(" ");
                    if(split.length >= 2) {
                        scale = split[1];
                    }

                    let translate = split[0].slice(10, -1).split(",");
                    this.x = +translate[0];
                    this.y = +translate[1];
                }

                this.x += d3.event.dx;
                this.y += d3.event.dy;

                this.x += d3.event.dx;
                this.y += d3.event.dy;

                return "translate(" + [this.x, this.y] + ")";
            });
        }
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

    draw_scatter(state.data.cluster_coords, state, ctx);
}

function draw_scatter(data, state, context) {
    let style = window.getComputedStyle(document.getElementById('activity')),
        margin = {top: 20, right: 20, bottom: 23, left: 37},
        width = parseFloat(style.width),
        height = parseFloat(style.height),
        canvas = d3.select("#scatter");

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
        .attr("cx", d => d.projected.x)
        .attr("cy", d => d.projected.y)
        .attr("fill", "#4863A0")
        .attr("r", 4)
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
        .attr("y1", height - margin.bottom + 12)
        .attr("x2", width - margin.right)
        .attr("y2", margin.top - 10)
        .attr("stroke", "black")
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", 8);

    // let handle_size = 4, handle = canvas.append("rect")
        // .classed("handle", true)
        // .attr("x", width - margin.right - handle_size/2)
        // .attr("y", margin.top - handle_size/2 - 10)
        // .attr("height", handle_size)
        // .attr("width", handle_size);

    let drag = d3.drag().on('drag', () => {
        if(d3.event.x <= margin.left || d3.event.x >= width - margin.right) { return; }
        time_line.attr("x1", d3.event.x).attr("x2", d3.event.x);

        let time = x.invert(d3.event.x);
        state.dispatcher.call("control:step-drag", this, time);
    }).on('end', () => {
        let time = x.invert(d3.event.x);
        let step = _.findIndex(state.timestamps, t => t >= time);
        if(step === -1) { step = state.timestamps.length - 1; }
        state.step = step;
        time_line.attr("x1", x(state.timestamps[step])).attr("x2", x(state.timestamps[step]));
        state.dispatcher.call("control:step", this, state.timestamps[step]);
    });
    time_line.call(drag);

    let ctx = { "x": x, "y": y, "height": height };
    draw_activity(state.data.activity, state, ctx);
}

function draw_activity(data, state, context) {
    let canvas = d3.select("#activity"),
        style = window.getComputedStyle(document.getElementById('activity'));

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
    _.each(state.data.misc, (data, name) => {
        if(name == 'actToolIdent') {
            setup_gantt(name, data);
        } else {
            setup_step(name, data);
        }
    });
}

function setup_gantt(name, data) {
    let style = window.getComputedStyle(document.getElementById(name + '-svg')),
        margin = {top: 20, right: 20, bottom: 23, left: 100},
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

    let ctx = { "x": x, "y": y, "height": height };
    draw_gantt(name, data, state, ctx);
}

function draw_gantt(name, data, state, context) {
    let canvas = d3.select("#" + name + '-svg');

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
    draw_step(name, data, state, ctx);
}

function draw_step(name, data, state, context) {
    let canvas = d3.select("#" + name + '-svg');

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
        canvas.append("text").text(Object.keys(state.data.timeseries)[i])
            .attr("x", margin.left + i*(width_cols + gutter_x) + width_cols/2)
            .attr("y", 20)
            .attr("text-anchor", "middle")
            .classed("title-text", true);

        for(let j = 0; j < 3; ++j) {
            let left = margin.left + i*(width_cols + gutter_x),
                down = margin.top + j*(height_rows + gutter_y) + height_rows;

            canvas.append("g").classed(`xaxis-${i}-${j}`, true).attr("transform", "translate(" + [left, down] + ")");
            let x = d3.scaleTime().range([0, width_cols]);

            canvas.append("g").classed(`yaxis-${i}-${j}`, true).attr("transform", "translate(" + [left, down - height_rows] + ")");
            let y = d3.scaleLinear().range([height_rows, 0]);

            canvas.append("g").classed(`group-${i}-${j}`, true).attr("transform", "translate(" + [left, down - height_rows] + ")");
            axes[i].push({ "x": x, "y": y });
        }
    }

    let ctx = { "axes": axes };
    draw_time(state.data.timeseries, state, ctx);
}

function draw_time(data, state, context) {
    let canvas = d3.select("#time"),
        parse_time = d3.timeParse('%Y-%m-%dT%H:%M:%S.%L%Z'),
        keys_i = _.map(data, (_, k) => k), keys_j = ['X', 'Y', 'Z'];

    let colors = {
        'aaVactB': "#2B65EC",
        'aaLoad': "#4E9258",
        'aaTorque': "#F87217"
    };

    for(let i = 0; i < 3; ++i) {
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

var state;
function do_the_things() {
    state = {
        step: 0,
        stepsize: 500,
        timestamps: [],
        dispatcher: d3.dispatch("time:filter", "control:step", "control:step-drag"),
        proc_id: new URL(window.location.href).searchParams.get("p"),
        data: {}
    };

    if(!state.proc_id) {
        alert("error p query param not set");
    }

    let p = fetch(`/proc/${state.proc_id}/activities`).then(response => response.json()).then(json => {
        state.data.activity = json;
        setup_activity(state);
    });

    let q = fetch(`/proc/${state.proc_id}/cluster_coords`).then(response => response.json()).then(json => {
        state.data.cluster_coords = json;
        setup_scatter(state);
    });

    let r = fetch(`/proc/${state.proc_id}/misc`).then(response => response.json()).then(json => {
        spawn_tabs(Object.keys(json));

        state.data.misc = json;
        setup_misc(state);
    });

    let s = fetch(`/proc/${state.proc_id}/timeseries`).then(response => response.json()).then(json => {
        state.data.timeseries = json;
        setup_time(state);
    });

    let t = fetch(`/proc/${state.proc_id}/timestamps`).then(response => response.json()).then(json => {
        let parse_time = d3.timeParse('%Y-%m-%dT%H:%M:%S.%L%Z')
        state.timestamps = _.map(json, t => parse_time(t));
        state.step = state.timestamps.length - 1;
    });

    let u = fetch(`/tree`).then(response => response.json()).then(json => {
        state.tree = json;
    });

    let int;
    $("#control #play").click(function() {
        $(this).attr("disabled", true);
        $("#control #pause").attr("disabled", false);
        int = setInterval(() => {
            $("#control #step-forward").trigger("click");
        }, 1000);
    });

    $("#control #pause").click(function() {
        $(this).attr("disabled", true);
        $("#control #play").attr("disabled", false);
        clearInterval(int);
    });

    $("#control #step-forward").click(function() {
        state.step += state.stepsize;
        state.step = Math.min(state.step, state.timestamps.length - 1);

        state.dispatcher.call("control:step", this, state.timestamps[state.step]);

        if(state.step >= state.timestamps.length - 1) {
            $(this).attr("disabled", true);
            $("#control #to-end").attr("disabled", true);
            return;
        }

        $("#control #step-backward").attr("disabled", false);
        $("#control #to-start").attr("disabled", false);
    });

    $("#control #step-backward").click(function() {
        console.log("stepped backward");
        state.step -= state.stepsize;
        state.step = Math.max(0, state.step);

        state.dispatcher.call("control:step", this, state.timestamps[state.step]);

        if(state.step === 0) {
            $(this).attr("disabled", true);
            $("#control #to-start").attr("disabled", true);
            return;
        }

        $("#control #step-forward").attr("disabled", false);
        $("#control #to-end").attr("disabled", false);
    });

    $("#control #to-start").click(function() {
        state.step = 0;
        $("#control #step-forward").attr("disabled", false);
        $("#control #step-backward").attr("disabled", true);
        $("#control #to-end").attr("disabled", false);

        state.dispatcher.call("control:step", this, state.timestamps[state.step]);
        $(this).attr("disabled", true);
    });

    $("#control #to-end").click(function() {
        state.step = state.timestamps.length - 1;
        $("#control #step-forward").attr("disabled", true);
        $("#control #step-backward").attr("disabled", false);
        $("#control #to-start").attr("disabled", false);

        state.dispatcher.call("control:step", this, state.timestamps[state.step]);
        $(this).attr("disabled", true);
    });

    tippy("#control #select", {
        trigger: "click",
        arrow: true,
        interactive: true,
        content: "loading...",
        size: "large",
        maxWidth: "800px",
        onShown: (tip) => {
            let template = `
              <div style="height: 600px; width: 500px; overflow-y: auto;">
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
            `;

            Mustache.parse(template);

            let rendered = Mustache.render(template, {
                nodes: state.tree
            });

            tip.setContent(rendered);
            $(".treetable").treetable({ expandable: true });

            $(".treetable tbody").off("click.select").on("click.select", "tr.leaf", function() {
                let selected = $(this).hasClass("selected");
                console.log(selected)
                if(selected) {
                    $(this).removeClass("selected");
                } else {
                    $(this).addClass("selected");
                }
            });
        },
        theme: "light-border"
    });
}
