function setup_scatter(state) {

}

function draw_scatter(data, state) {

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

    bars.enter().append("rect")
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

    bars.enter().append("rect")
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
    lines.enter().append("path")
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
        timestamps: [],
        dispatcher: d3.dispatch("time:filter", "control:step"),
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
        return;

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

    $("#control #play").click(() => {
        console.log("clicked play");
    });

    $("#control #pause").click(() => {
        console.log("clicked pause");
    });

    $("#control #step-forward").click(() => {
        console.log("stepped forward");
    });

    $("#control #step-backward").click(() => {
        console.log("stepped backward");
    });

    $("#control #to-start").click(() => {
        console.log("stepped to start");
    });

    $("#control #to-end").click(() => {
        console.log("stepped to end");
    });
}
