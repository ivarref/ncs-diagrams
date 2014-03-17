var format = d3.time.format("%Y-%m");
var parsed_data = null;

function get_reserves_map(url, result, cb) {
    d3.csv("data/" + url, function(reserves) {
        reserves.forEach(function(d) { 
            //result[d.fldName] = +d['fldRecoverableOil'] + +d['fldRecoverableCondensate'];
            result[d.fldName] = {
                gasngl: +d['fldRecoverableGas'] + +d['fldRecoverableNGL'],
                cc: +d['fldRecoverableOil'] + +d['fldRecoverableCondensate'],
                all: +d['fldRecoverableOil'] + +d['fldRecoverableCondensate'] + +d['fldRecoverableGas'] + +d['fldRecoverableNGL'],
            }
        });
        cb(result);
    });
    //Om jeg husker riktig så pågår det ”prøveproduksjon” fra ”Delta 33/9-6". Funnet ble gjort i 1976 er nå formelt vedtatt utbygd og estimert utvinnbart er rundt 0,074 millioner Sm3 (0,47 millioner fat) olje.
}

function getCorrectResourceTypes(data) {
    data.forEach(function(d) {
        d.production = resourceType.get(d.productionAll)
        d.reserves = resourceType.get(d.reservesAll)
    })
    return data
}

function get_data_actual(reserves, data_callback) {
    d3.csv("data/" + "fpm3.csv", function(data) {
        var newdata = data.map(function(d) {
            return {
                field : d['prfInformationCarrier'],
                /*'npdid' : +d['prfNpdidInformationCarrier'],
                'condensateMillSm3' : +d['prfPrdCondensateNetMillSm3'],
                'gasBillSm3' : +d['prfPrdGasNetBillSm3'],
                'nglNetMillSm3' : +d['prfPrdNGLNetMillSm3'],
                'oeMillSm3' : +d['prfPrdOeNetMillSm3'],
                'oilMillSm3' : d3.max([0, +d['prfPrdOilNetMillSm3']]),
                'waterMillSm3' : +d['prfPrdProducedWaterInFieldMillSm3'],
                */
                //'val' : (d3.max([0, +d['prfPrdGasNetBillSm3']]) +d3.max([0, +d['prfPrdNGLNetMillSm3']])),
                reservesAll : reserves[d['prfInformationCarrier']],
                //reserves : reserves[d['prfInformationCarrier'].gasngl],
                //production : (d3.max([0, +d['prfPrdOilNetMillSm3']]) +d3.max([0, +d['prfPrdCondensateNetMillSm3']])),
                //production : (d3.max([0, +d['prfPrdGasNetBillSm3']]) +d3.max([0, +d['prfPrdNGLNetMillSm3']])),
                productionAll : {
                    gasngl: (d3.max([0, +d['prfPrdGasNetBillSm3']]) +d3.max([0, +d['prfPrdNGLNetMillSm3']])),
                    cc: (d3.max([0, +d['prfPrdOilNetMillSm3']]) +d3.max([0, +d['prfPrdCondensateNetMillSm3']])),
                    all: (d3.max([0, +d['prfPrdGasNetBillSm3']]) +d3.max([0, +d['prfPrdNGLNetMillSm3']])) + (d3.max([0, +d['prfPrdOilNetMillSm3']]) +d3.max([0, +d['prfPrdCondensateNetMillSm3']]))
                },
                dateStr : d['prfYear'] + "-" + d['prfMonth'],
                date : format.parse(d['prfYear'] + "-" + d['prfMonth'])
            };
        });
        parsed_data = newdata;
        data_callback(getCorrectResourceTypes(parsed_data));
    });
}

function get_data(data_callback) {
    if (parsed_data != null) {
        data_callback(getCorrectResourceTypes(parsed_data));
    } else {
        get_reserves_map('field_reserves2.csv', {}, function(reserves) {
        get_reserves_map('field_reserves_extra.csv', reserves, function(r) {
        get_data_actual(r, data_callback); }); });
    }
}

function getDistinctStartProductionDecades(data) {
    data = productionWith12MMAflat(data);
    var res = d3.set(data.map(function(d) { return d.startProductionDecade; })).values();
    res.sort();
    return res;
}
function cutFieldProductionFromAndFlatten(data, year) {
    return flatten(cutFieldProductionFrom(data, year), function(d) { return d.values; });
}

function cutFieldByStartDecade(data, decade) {
    return data.filter(function(d) { return d.startProductionDecade == decade; });
}

function cutFieldProductionFrom(data, year) {
    var newFields = data.map(function(d) {
        var values = d.values.filter(function(d) { return d.date.getFullYear() >= year; });
        return {field: d.field,
                values: values,
                startProductionDecade: d.startProductionDecade,
                startProduction: d.startProduction
               };
    });
    return newFields.filter(function(d) {
        return d.values.length>0;
    });
}

function productionWith12MMAByField(data) {
    var byfield = d3.nest().key(function(d) { return d.field; }).entries(data);

    byfield.forEach(function(field) {
        // remove empty values that come first
        while (field.values.length>0 && field.values[0].production == 0.0)
            field.values.shift();
        // remove last value as long as last 12 months as empty
        while (field.values.length>=12 && d3.sum(field.values.slice(-12), function(d) { return d.production; })==0.0) 
            field.values.pop();
    });

    byfield = byfield.filter(function(d) { return d.values.length > 0; });

    byfield.forEach(function(field) {
        var values = [];
        field.startProduction = field.values[0].date;
        var year = field.startProduction.getFullYear();
        field.startProductionDecade = year - (year%10);
        field.reserves = field.values[0].reserves;

        field.values.forEach(function(d) {
            values.push(d.production);
            if (values.length==25)
                values.shift();
            var previousYearProduction = values.length>=12 ? d3.sum(values.slice(0, 12)) : 0.0;
            var last12MonthsProduction = d3.sum(values.slice(-12));
            var change = ((last12MonthsProduction/previousYearProduction)-1.0)*100.0;
            var c = (change > 20) ? 20 : ((change<-20) ? -20 : change);
            if (previousYearProduction ==0 && last12MonthsProduction == 0) {
                c = 0;
                //console.log("ERROR " + field.key);
            }
            d.yoyChange = c;
            d.last12MonthsProduction = last12MonthsProduction;
            d.startProductionDecade = field.startProductionDecade;
        });
    });
    return byfield;
}

function productionWith12MMAflat(data) {
    /* So now we have a flat production with (rolling):
     * - last12MonthsProduction
     * - startProductionDecade
     * - yoyChange
    */
    return flatten(productionWith12MMAByField(data), function(d) { return d.values; });
}

function productionByDateAnd(data, category, categoryData) {
    var productionByDateAndCategory = d3.nest()
    .key(function(d) { return format(d.date); })
    .key(function(d) { return category(categoryData(d)); })
    .entries(data);
    productionByDateAndCategory.sort(function(a,b) { return d3.ascending(a.key, b.key); });

    var dataByCategory = category.range().map(function(d) { return []; });
    var pushData = function(key, newEntry) {
        var idx = category.range().indexOf(key);
        dataByCategory[idx].push(newEntry);
        return newEntry;
    }

    productionByDateAndCategory.forEach(function(prodEntry) {
        var values = category.range().map(function(key) {
            var c = prodEntry.values.filter(function(d) { return d.key == key; });
            return {key: key, values: c.length==1?(c[0].values):[]};
        });
        var y0 = 0;
        var relativeY = 0;
        var sumValues = function(values) { return d3.sum(values, function(d) { return d.last12MonthsProduction; }); };
        var sum = d3.sum(values, function(d) { return sumValues(d.values); });
        var relativeY0 = 0;
        values.forEach(function(d) {
            var key = d.key;
            var y = sumValues(d.values);
            var entry = pushData(key,
                {field: key,
                 fields : d.values.map(function(d) { return d.field; }),
                 relativeY : 100.0*(y/sum),
                 y : y*6.29/365.0,
                 values : d.values,
                 y0 : y0,
                 relativeY0 : relativeY0,
                 category: key,
                 date: format.parse(prodEntry.key)});
            y0 += entry.y;
            relativeY0 += entry.relativeY;
        });
    });
    return dataByCategory;
}

function productionByDateAndStartDecade(production) {
    var productionByDateAndStartDecade = d3.nest()
    .key(function(d) { return format(d.date); })
    .key(function(d) { return d.startProductionDecade; })
    .entries(production);
    productionByDateAndStartDecade.sort(function(a,b) { return d3.ascending(a.key, b.key); });

    var decades = d3.set(production.map(function(d) { return d.startProductionDecade; })).values();
    decades.sort();

    var decadeProduction = decades.map(function(d) { return []; });

    var decadeAccumulative = decades.map(function(d) { return 0; });

    productionByDateAndStartDecade.forEach(function(d) {
        var decadeTo12MonthsProduction = zeroDict(d.values.map(function(d) { return [d.key, d3.sum(d.values, function(d) { return d.last12MonthsProduction; })]; }));
        var decadeToProduction = zeroDict(d.values.map(function(d) { return [d.key, d3.sum(d.values, function(d) { return d.production; })]; }));
        var sum = d3.sum(decades.map(function(d) { return decadeTo12MonthsProduction(d); }));
        var y0 = 0;
        var relativeY0 = 0;
        decades.forEach(function(decade, i) {
            var accumulatetiveY0 = (i==0) ? 0 : d3.sum(decadeAccumulative.slice(0, i));
            var last12MonthsProduction = decadeTo12MonthsProduction(decade);
            var y = last12MonthsProduction*6.29/365.0;
            var relativeY = (last12MonthsProduction / sum) * 100.0;
            var cumulativeProduced = decadeAccumulative[i];
            decadeAccumulative[i] += decadeToProduction(decade);
            decadeProduction[i].push(
                {
                 field: decade,
                 production: decadeToProduction(decade),
                 cumulativeProduced: cumulativeProduced,
                 date: format.parse(d.key), 
                 dateStr: d.key,
                 startProductionDecade: decade, 
                 y0: y0, 
                 y: y,
                 last12MonthsProduction: last12MonthsProduction,
                 accumulativeY0 : ((accumulatetiveY0*6.29)/1000.0),
                 accumulativeY : ((decadeAccumulative[i]*6.29)/1000.0),
                 relativeY0: relativeY0, 
                 relativeY: relativeY});
            y0 += y;
            relativeY0 += relativeY;
        });
    });
    /* decadeProduction is now:
     * [[//1970s production],
     *  [//1980s production],
     *  [{field: decade, date: date, production: ...}, ...]
     * ]
     * All arrays have equal length.
     */
    return {decades: decades, production: decadeProduction};
}

/* input: {decades: decades, production: decadeProduction} */
function addAllFieldsProduction(data) {
    var allFields = data.production[0].map(function(d, i) { // use 1970s production as "base"
        return {field: 'All',
                date: d.date,
                dateStr: d.dateStr,
                production: d3.sum(data.production, function(d) { return d[i].production; })
               };
    });
    data.production.push(allFields);
    data.decades.push('All');
    return data;
}

