function flatten(values, fn) {
    return values.reduce(function(prevValue, currValue, index, ar) {
        return prevValue.concat(fn(currValue));
    }, []);
}

function flatten2(values) {
  var result = []
  for (var i=0; i<values.length; i++) {
    var v = values[i]
    for (var j=0; j<v.length; j++) {
      result.push(v[j])
    }
  }
  return result
}

function nestedMinMax(dat, level1Prop, level2Prop) {
  var mmin = dat[0][level1Prop][0][level2Prop]
  var mmax = dat[0][level1Prop][0][level2Prop]

  for (var i=0; i<dat.length; i++) {
    for (var j=0; j<dat[i][level1Prop].length; j++) {
      var val = dat[i][level1Prop][j][level2Prop]
      mmin = val < mmin ? val : mmin
      mmax = val > mmax ? val : mmax
    }
  }
  return [mmin, mmax]
}

function defaultDict(map, def) {
    return function(key) {
        if (key in map) 
            return map[key];
        if (typeof def == "function")
            return def(key);
        return def;
    }
};

function zeroDict(values) {
    var dict = {};
    values.forEach(function(val) {
        dict[val[0]] = val[1];
    });
    return defaultDict(dict, 0);
}

function addDict() {
    var data = {};
    return { 
    get: function(k) {
        if (!(k in data))
            return 0.0;
        else 
            return data[k];
    },
    add: function(k,v) {
        if (!(k in data)) {
            data[k] = 0.0;
        }
        data[k] = data[k]+v;
        },
    getData: function() { return data; }
    };
}

function showCategories(dat, g, colors) {
    var datpos = function(d) { return d-(dat.length/2); };

    var gg = g.selectAll('g').data(dat)
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
}

