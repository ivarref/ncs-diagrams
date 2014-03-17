function show_production_inc_dec_rate(data) {
var category = d3.scale.quantize()
.domain([-20, 20])
.range(d3.range(4))

var colors = d3.scale.ordinal()
.domain(category.range())
.range(colorbrewer.YlOrRd[category.range().length].reverse())

function enhanceData(data) {
    var decades = getDistinctStartProductionDecades(data)
    decades.reverse()
    var allFields = "All fields"
    decades.unshift(allFields)

    var newData = []

    decades.forEach(function(decade) {
        var d = productionWith12MMAByField(data)
        d = (decade==allFields) ? d : cutFieldByStartDecade(d, decade)

        var dat = productionByDateAnd(cutFieldProductionFromAndFlatten(d, cutOffYear()), category, function(d) { return d.yoyChange; })
        newData.push({
           title: 'Production by increase / decrease rate category, ' + (decade==allFields?allFields : ('fields with start production decade ' + decade)),
           axisCaption: 'Mboe/d',
           colors: colors,
           production: dat,
           //ysum: function(d) { return d.relativeY0 + d.relativeY; },
           //y0: function(d) { return d.relativeY0; },
           ysum: function(d) { return d.y0 + d.y; },
           y0: function(d) { return d.y0; },
           category_heading: 'Year over Year smoothed 12 Month Moving Average Increase / Decrease rate categories',
           categories: category.range().map(function(d) { 
               var extent = category.invertExtent(d)
               return extent[0] + " to " + extent[1]
           }),
        })

        newData.push({
           title: 'Share of production by increase / decrease rate category, ' + (decade==allFields?allFields : ('fields with start production decade ' + decade)),
           axisCaption: 'Percent',
           colors: colors,
           production: dat,
           ysum: function(d) { return d.relativeY0 + d.relativeY; },
           y0: function(d) { return d.relativeY0; },
           category_heading: 'Year over Year smoothed 12 Month Moving Average Increase / Decrease rate categories',
           categories: category.range().map(function(d) { 
               var extent = category.invertExtent(d);
               return extent[0] + " to " + extent[1];
           }),
        })
        //production_by_inc_dec_rate_init(d3.select('body'), config)(config);
    })
    return newData
}
var graphFns = enhanceData(data).map(function(data) { return production_by_inc_dec_rate_init(d3.select('body'), data) })
function redraw(data) {
    enhanceData(data).forEach(function(d, i) { graphFns[i](d) })
    return redraw
}
return redraw(data)
}

//var cb = function(data) { graphFns.forEach(function(fn) { fn(conf); return cb }


function production_by_inc_dec_rate_init(root, config) {
var colors = config.colors;

var margin = {top: 40, right: 40, bottom: 70, left: 40},
    width = g_width - margin.left - margin.right,
    height = g_height - margin.top - margin.bottom;

root = root.append('div')
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    ;

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
    .attr('dy', yAxisDy)
    .text(config.axisCaption);

svg.append('text')
    .attr('transform', 'translate('+width+',0)')
    .style('text-anchor', 'middle')
    .attr('dy', yAxisDy)
    .text(config.axisCaption);

svg.append('text')
    .attr('class', 'headline')
    .attr('dy', '-1.75em')
    .attr('x', width/2)
    .style('text-anchor', 'middle')
    .text(config.title);

var subtitle = svg.append('text')
    .attr('dy', '-0.75em')
    .attr('x', width/2)
    .style('text-anchor', 'middle')


var g = svg.append('g')
    .attr('transform', 'translate(' + (width/2) + "," + (height+35) +')');

var datpos = function(d) { return d-(config.categories.length/2); };

var gg = g.selectAll('g').data(config.categories)
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

svg.append('g')
.attr('transform', 'translate(' + (width/2) + "," + (height+35) +')')
.append('text')
.style('text-anchor', 'middle')
.style('font-weight', 'bold')
.text(config.category_heading)
;

var tip = d3.tip()
  .attr('class', 'd3-tip')
  .offset([0, 0])
  .html(function(d) {
      var fieldDetails = d.map(function(d) { return '<tr><td>'+d.field+'</td><td align="center">'+Math.round(d.yoyChange)+'</td></tr>'; }).join("");
      var heading = "<tr><th>Field</th><th>Increase / Decrease rate</th></tr>";
      return "<table width=250 cellspacing=0 cellpadding=0 border=0>"+heading+fieldDetails+"</table>"
      + "<br/>Data from " + format(d[0].date);
});
svg.call(tip);

function graph(config) {
    var data = config.production;
    subtitle.text(standard_subtitle())

    var x = d3.time.scale()
    .domain(d3.extent(data[0], function(d) { return d.date; }))
    .range([0, width]);

    var ymax = d3.max(data[data.length-1], config.ysum);

    var y = d3.scale.linear()
    .domain([0, ymax])
    .range([height, 0]);

    // TODO: improve this
    var sel = svg.selectAll('path').data([]);
    sel.exit().remove();

    var sel = svg.selectAll('path').data(data);
    sel.enter().append('path');

    svg_root.on('mouseout', function(d) {
        var mouse = d3.mouse(this), xpixel = mouse[0], ypixel = mouse[1];
        if (ypixel<margin.top || ypixel>(height+margin.top) || xpixel>(width+margin.left+margin.right)) {
            tip.hide(d);
        }
    });

    sel
    .attr('d', d3.svg.area()
        .x(function(d) { return x(d.date); })
        .y(function(d) { return y(config.ysum(d)); })
        .y0(function(d) { return y(config.y0(d)); }))
    .on('mousemove', function(d) {
        var mouse = d3.mouse(this), xpixel = mouse[0], ypixel = mouse[1],
        date = x.invert(xpixel);
        var data = d.filter(function(d) { return d.date.getFullYear() == date.getFullYear() && d.date.getMonth() == date.getMonth(); }); 

        if (data.length==1) {
            d = data[0];
            tip.coords(function(bbox, node) {
                var left = x(d.date)-node.offsetWidth/2;
                return {top: bbox.n.y + margin.top + ypixel + 20, left: d3.max([left, margin.left])}
            });
            tip.show(d.values);
        }
    })
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
