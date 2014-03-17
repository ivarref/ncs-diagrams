function percentageOfMaxProductionVsProducedPercentage_graph(data) {
    function enhanceData(data) {
        var totalReserves = addDict();
        productionWith12MMAByField(data).forEach(function(d) {
            totalReserves.add(d.startProductionDecade, d.reserves);
            totalReserves.add('All', d.reserves);
        });
        var orgdata = prodbyDateAndStartDecade(data);
        orgdata.production.forEach(function(dd) {
            var maxProduction = d3.max(dd, function(d) { return d.last12MonthsProduction; });
            dd.forEach(function(d, i) {
                d.reserves = totalReserves.get(d.startProductionDecade);
                d.producedPercentage = (d.cumulativeProduced / d.reserves)*100.0;
                d.y = (d.last12MonthsProduction / maxProduction)*100.0;
            });
        });
        var maxProduction = d3.max(orgdata.production[0].map(function(dd, i) {
            return d3.sum(orgdata.production, function(d) { return d[i].last12MonthsProduction; });
        }));
        var entry = orgdata.production[0].map(function(dd, i) {
            var reserves     = d3.sum(orgdata.production, function(d) { return d[i].reserves; });
            var cumulative   = d3.sum(orgdata.production, function(d) { return d[i].cumulativeProduced; });
            var last12Months = d3.sum(orgdata.production, function(d) { return d[i].last12MonthsProduction; });
            var percentageOfMaxProduction = (last12Months/maxProduction)*100.0;
            return {reserves: reserves,
                    producedPercentage: (cumulative/reserves)*100.0,
                    y: percentageOfMaxProduction,
                    field: 'All'
                   };
        });
        orgdata.production.push(entry);
        orgdata.decades.push('All');
        return orgdata;
    }
    var updateFn = percentageOfMaxProductionVsProducedPercentage(body)
    function config(data) {
        return {
        title: 'Percentage of All Time High Production VS Percentage Produced of Estimated Ultimately Recoverable (EUR)',
        axisCaption : 'Percentage of all-time-high production',
        hoverText : function(cat, d) { return cat + ' producing ' + d + ' % of all time high production' },
        extraText : '',
        yMax : 100.0,
        data: data
        }
    }
    var f = function(d) { updateFn(config(enhanceData(data))); return f }
    f(data)
    return f
}

function percentageOfMaxProductionVsProducedPercentage(root) {
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
        .style('text-anchor', 'start')
        .attr('dy', yAxisDy)
        .attr('dx', '-22px')
        ;

    var axisCaption2 = svg.append('text')
        .attr('transform', 'translate('+width+',0)')
        .style('text-anchor', 'end')
        .attr('dy', yAxisDy)
        .attr('dx', '22px')
        ;

    svg.append('text')
        .attr('transform', 'translate('+width+','+height+')')
        .style('text-anchor', 'end')
        .attr('dy', '27px')
        .attr('dx', '0px')
        .text('Percentage Produced of Estimated Ultimately Recoverable (EUR)')
        ;

    var extraText = svg.append('text')
        .attr('transform', 'translate('+0+','+(height+margin.bottom)+')')
        .style('text-anchor', 'start')
        .attr('dy', '-0.71em')
        .attr('dx', '0px')

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

    function addLabels(dat) {
        var datpos = function(d) { return d-(dat.decades.length/2); };

        var gg = g.selectAll('g').data(dat.decades, function(d,i) { return d+""+i })

        var entr = gg
        .enter().append('g')
        .attr('transform', function(d,i) { return 'translate(' + (datpos(i)*80) + ',5)'; });

        entr
        .append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', 10)
        .attr('height', 10)
        .style('fill', function(d, i) { return colors(i); });

        entr
        .append('text')
        .attr('dx', '1.4em')
        .attr('dy', '0.91em')
        .text(function(d) { return d; });

        gg.exit().remove()
    }

    var dotCtx = svg.append('g');
    var pathCtx = svg.append('g');
    var dotCtx2 = svg.append('g');

var tip = d3.tip()
  .attr('class', 'd3-tip')
  .offset([0, 0])
  .html(function(d) {
      return "Hello world";
});
svg.call(tip);

function graph(config) {
    var data = config.data.production;
    extraText.text(config.extraText)
    subtitle.text(standard_subtitle())
    addLabels(config.data)
    axisCaption1.text(config.axisCaption);
    axisCaption2.text(config.axisCaption);
    title.text(config.title);

    var x = d3.scale.linear()
    .domain([0, 100.0])
    .range([0, width]);

    var y = d3.scale.linear()
    .domain([0, config.yMax])
    .range([height, 0]);

    svg_base.on('mouseout', function(d) {
        var mouse = d3.mouse(this), xpixel = mouse[0], ypixel = mouse[1];
        if (ypixel<margin.top || ypixel>(height+margin.top) || xpixel>(width+margin.left+margin.right)) {
            tip.hide(d);
        }
    });

    var sel = svg.selectAll('path').data([]);
    sel.exit().remove();

    var sel = svg.selectAll('path').data(data);
    sel.enter()
    .append('path')
    .attr('class', 'line');

    var line = d3.svg.line()
        .interpolate('basis')
        .x(function(d) { return x(d.producedPercentage); })
        .y(function(d) { return y(d.y); })
        ;

    // TODO: improve this
    var sel = pathCtx.selectAll('path').data([]);
    sel.exit().remove();

    var mnth = data[0][data[0].length-1].date.getMonth()
    /*
    var dots = data.map(function(d) {
        return d.filter(function(d) { return ((d.date.getFullYear()%10)==0) && d.date.getMonth() == 0 })
    })
    */


    var decades = [1970, 1980, 1990, 2000, 2010]
    var decade = function(d) {
        var dc = d.getFullYear() - (d.getFullYear()%10)
        return dc
    }
    
    //var conv = data.map(function(d) { return d3.nest().key(function(d) { return decade(d.date) }).entries(d) })

/*
    var conv1 = conv.map(function(d) { return d.filter(function(d, i) { return i%2==0 }) })
    var conv2 = conv.map(function(d) { return d.filter(function(d, i) { return i%2!=0 }) })
    console.log(conv)
    console.log(conv[0])
*/

    var col = ["#aec7e8", "#ffbb78", "#98df8a", "#ff9896", "#c5b0d5", "#c49c94"];
    sel = dotCtx.append('g').selectAll('path').data(data)
    sel.enter().append('path')
    .attr('class', 'line');
    sel
    .attr('d', function(d) { return line(d); })
    .style('stroke', function(d, i) { return colors(i) })
    .on('mousemove', function(d) {
        var mouse = d3.mouse(this), xpixel = mouse[0], ypixel = mouse[1],
        producedPercentage = x.invert(xpixel);
        var data = d.filter(function(d) { return Math.round(d.producedPercentage) == Math.round(producedPercentage); });

        if (data.length>=1) {
            d = data[data.length-1];
            tip.coords(function(bbox, node) {
                var left = x(d.producedPercentage)-node.offsetWidth/2;
                return {top: bbox.n.y + margin.top + ypixel + 20, left: d3.max([left, margin.left])}
            });
            tip.html(function(d) { 
                return config.hoverText(d.field, (Math.round(d.y*10.0)/10.0)) + 
                '<br/>Percentage produced of EUR: ' + (Math.round(d.producedPercentage*10.0)/10.0); });
            tip.show(d);
        }
    })
    ;
    sel.exit().remove();

    /*
    var s = pathCtx.append('g').selectAll('g').data(conv1)
    s.enter().append('g')
    var sel = s.selectAll('path').data(Object)
    sel
    .enter().append('path')
    .attr('class', 'line')
    .style('stroke', function(d, i, ii) { return colors(ii) })
    .attr('d', function(d) { return line(d.values) })

    var s = pathCtx.append('g').selectAll('g').data(conv2)
    s.enter().append('g')
    var sel = s.selectAll('path').data(Object)
    sel
    .enter().append('path')
    .attr('class', 'line')
    .style('stroke', '#cc00aa')
    .attr('d', function(d) { return line(d.values); })

    var sel = dotCtx2.append('g').selectAll('g').data(dots)
    sel.enter().append('g')
    sel.selectAll('circle').data(Object)
    .enter().append('circle')
    .attr('r', '3px')
    .style('fill', function(d, i, ii) { return colors(decades.indexOf(decade(d.date))) })
    .style('fill-opacity', 1.0)
    .style('stroke-width', '1px')
    //.style('shape-rendering', 'crispEdges')
    .style('stroke', '#000')
    .attr('cx', function(d) { return x(d.producedPercentage) })
    .attr('cy', function(d) { return y(d.y) })
    */


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

