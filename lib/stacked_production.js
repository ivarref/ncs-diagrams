function init(root, dat, config) {
    var margin = {top: 40, right: 40, bottom: 70, left: 40},
        width = 960 - margin.left - margin.right,
        height = 450 - margin.top - margin.bottom;

    var svg_base = root.append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);

    var svg = svg_base.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var xAxis = svg.append('g')
    .attr('transform', 'translate(0,' + height+')')
    .attr('class', 'x axis');

    var yAxisLeft = svg.append('g')
        .attr('transform', 'translate(0,0)')
        .attr('class', 'y axis');

    var yAxisRight = svg.append('g')
        .attr('transform', 'translate('+width+',0)')
        .attr('class', 'y axis');

    var axisCaption1 = 
        svg.append('text')
        .style('text-anchor', 'middle')
        .attr('dy', yAxisDy)
        ;

    var axisCaption2 = svg.append('text')
        .attr('transform', 'translate('+width+',0)')
        .style('text-anchor', 'middle')
        .attr('dy', yAxisDy)
        ;

    var title = 
        svg.append('text')
        .attr('class', 'headline')
        .attr('dy', '-1.75em')
        .attr('x', width/2)
        .style('text-anchor', 'middle')
        ;

    var subtitle =
        svg.append('text')
        .attr('dy', '-0.75em')
        .attr('x', width/2)
        .style('text-anchor', 'middle')
        ;

    var colors = d3.scale.category10();

    var g = svg.append('g')
    .attr('transform', 'translate(' + (width/2) + "," + (height+35) +')');

    var datpos = function(d) { return d-(dat.decades.length/2); };

    var gg = g.selectAll('g').data(dat.decades)
    .enter().append('g')
    .attr('transform', function(d,i) { return 'translate(' + (datpos(i)*80) + ',5)'; });

    gg
    .append('rect')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', 10)
    .attr('height', 10)
    .style('fill', function(d, i) { return colors(i); });

    gg
    .append('text')
    .attr('dx', '1.4em')
    .attr('dy', '0.91em')
    .text(function(d) { return d; });

function graph(data) {
    subtitle.text(standard_subtitle())
    axisCaption1.text(config.axisCaption);
    axisCaption2.text(config.axisCaption);
    title.text(config.title);

    var x = d3.time.scale()
    .domain(d3.extent(data[0], function(d) { return d.date; }))
    .range([0, width]);

    var ymax = d3.max(data, function(d) { return d3.max(d, config.ysum); });

    var y = d3.scale.linear()
    .domain([0, ymax])
    .range([height, 0]);

    // TODO: improve this
    var sel = svg.selectAll('path').data([]);
    sel.exit().remove();

    var sel = svg.selectAll('path').data(data);
    sel.enter().append('path')
    .attr('class', 'area');

    sel
    .attr('d', d3.svg.area()
        .x(function(d) { return x(d.date); })
        .y(function(d) { return y(config.ysum(d)); })
        .y0(function(d) { return y(config.y0(d)); }))
    .style('fill', function(d, i) { return colors(i); })
    .style('stroke', '#000')
    .style('stroke-width', '1px')
    ;

    sel.exit().remove();

    xAxis.call(d3.svg.axis()
    .orient('bottom')
    .scale(x));

    yAxisLeft.call(d3.svg.axis()
    .orient('left')
    .scale(y));

    yAxisRight.call(d3.svg.axis()
    .orient('right')
    .scale(y));
}


    return graph;
}

