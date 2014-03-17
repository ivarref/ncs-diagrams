function yoy_by_field_init_and_update(root) {
    function enhanceData(data) {
        var dat = addAllFieldsProduction(prodbyDateAndStartDecade(data));
        var production = flatten(dat.production, Object);
        var productionWithYoY = cutFieldProductionFrom(productionWith12MMAByField(production), cutOffYear());
        return {decades: dat.decades, production: productionWithYoY};
    }
    var updatefn = yoy_by_field_init(root)
    var f = function(data) { updatefn(enhanceData(data)); return f}
    return f
}

function yoy_by_field_init(root) {
var margin = {top: 40, right: 40, bottom: 70, left: 40},
    width = g_width - margin.left - margin.right,
    height = g_height - margin.top - margin.bottom;

var svg_root = root.append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);

var svg = svg_root
    .append("g")
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

svg.append('text')
    .attr('class', 'axiscaption')
    .text('YoY change')
    .attr('dy', yAxisDy);

svg.append('text')
    .attr('transform', 'translate('+width+',0)')
    .style('text-anchor', 'middle')
    .attr('dy', yAxisDy)
    .text('YoY change');

svg.append('text')
    .attr('class', 'headline')
    .attr('dy', '-1.75em')
    .attr('x', width/2)
    .style('text-anchor', 'middle')
    .text('Year over Year 12 Month Moving Average Increase / Decline rate in percentage by Start Production Decade');

var subtitle = svg.append('text')
    .attr('dy', '-0.75em')
    .attr('x', width/2)
    .style('text-anchor', 'middle')

    var colors = d3.scale.category10();

    var g = svg.append('g')
    .attr('transform', 'translate(' + (width/2) + "," + (height+35) +')');

var tip = d3.tip()
  .attr('class', 'd3-tip')
  .offset([0, 0])
  .html(function(d) {
      return "<strong>" + d.field + "</strong> with YoY change of " + (Math.round(d.yoyChange*10)/10) + " on " + format(d.date);;
});
svg.call(tip);

function graph(dat) {
    var data = dat.production
    subtitle.text(standard_subtitle())
    showCategories(dat.decades, g, colors)

    var x = d3.time.scale()
    .domain([d3.min(data, function(d) { return d.values[0].date; }),
             d3.max(data, function(d) { return d.values[d.values.length-1].date; })])
    .range([0, width]);

    var y = d3.scale.linear()
    .domain([-20, 20])
    .range([height, 0]);

    // TODO: improve this
    var sel = svg.selectAll('path').data([]);
    sel.exit().remove();

    var sel = svg.selectAll('path').data(data);
    sel.enter()
    .append('path')
    .attr('class', 'line');

    var line = d3.svg.line()
        .interpolate('basis')
        .x(function(d) { return x(d.date); })
        .y(function(d) { return y(d.yoyChange); })
        ;
    sel
    .attr('d', function(d) { return line(d.values); })
    .on('mousemove', function(d) {
        d = d.values;
        var mouse = d3.mouse(this), xpixel = mouse[0], ypixel = mouse[1],
        date = x.invert(xpixel);
        var data = d.filter(function(d) { return d.date.getFullYear() == date.getFullYear() && d.date.getMonth() == date.getMonth(); }); 

        if (data.length==1) {
            d = data[0];
            tip.coords(function(bbox, node) {
                var left = x(d.date)-node.offsetWidth/2;
                return {top: bbox.n.y + margin.top + ypixel + 20, left: d3.max([left, margin.left])}
            });
            tip.show(d);
        }
    })
    .style('stroke', function(d, i) { return colors(i); })
    ;

    svg_root.on('mouseout', function(d) {
        var mouse = d3.mouse(this), xpixel = mouse[0], ypixel = mouse[1];
        if (ypixel<margin.top || ypixel>(height+margin.top) || xpixel>(width+margin.left+margin.right)) {
            tip.hide(d);
        }
    });

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

