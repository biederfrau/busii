var utils = {
    'addSeconds': (t, s) => {
        return new Date(t.getTime() + s*1000);
    },
    'substractSeconds': (t, s) => {
        return new Date(t.getTime() - s*1000);
    },
    'noData': (canvas, width, height) => {
        canvas.append("text")
            .classed("no-data", true)
            .text(":(")
            .attr("x", width / 2)
            .attr("y", height / 2)
            .attr("fill", "grey")
            .attr("font-size", 80)
            .attr("alignment-baseline", "middle")
            .attr("text-anchor", "middle");
    }
}
