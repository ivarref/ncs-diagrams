function rpVsPercentageProducedOfEUR(data) {
    // Remaining Recoverable Reserves / Production = number of years remaining at current rate of production...
    function enhanceData(data, mx) {
        var totalReserves = addDict()
        productionWith12MMAByField(data).forEach(function(d) {
            totalReserves.add(d.startProductionDecade, d.reserves)
            totalReserves.add('All', d.reserves)
        })
        var orgdata = prodbyDateAndStartDecade(data)
        //mx = function(d) { return (1/d)*100 }
        orgdata.production.forEach(function(dd) {
            dd.forEach(function(d, i) {
                d.reserves = totalReserves.get(d.startProductionDecade)
                d.producedPercentage = (d.cumulativeProduced / d.reserves)*100.0
                d.y = mx((d.reserves-d.cumulativeProduced+d.last12MonthsProduction) / d.last12MonthsProduction)
            })
        })
        var entry = orgdata.production[0].map(function(dd, i) {
            var reserves     = d3.sum(orgdata.production, function(d) { return d[i].reserves })
            var cumulative   = d3.sum(orgdata.production, function(d) { return d[i].cumulativeProduced })
            var last12Months = d3.sum(orgdata.production, function(d) { return d[i].last12MonthsProduction })
            return {reserves: reserves,
                    producedPercentage: (cumulative/reserves)*100.0,
                    y: mx((reserves-cumulative+last12Months) / last12Months),
                    field: 'All'
                   }
        })
        orgdata.production.push(entry)
        orgdata.decades.push('All')
        return orgdata
    }
    var updateFns = [percentageOfMaxProductionVsProducedPercentage(body), percentageOfMaxProductionVsProducedPercentage(body)]
    var yMax = function(data) { return d3.max(data.production, function(d) { return d3.max(d, function(d) { return d.y }) }) }

    var cutOff = function(mx) { return function(d) { return d>mx ? mx : d; }; }
    function configRP(data) {
        return {
        title: 'Remaining Recoverable Reserves / 12 Month Moving Sum of Production vs Percentage Produced of EUR',
        axisCaption : 'Remaining Recoverable Reserves / Production',
        hoverText : function(cat, d) { return cat + ' has a R/P of ' + d },
        extraText: '* Essentially this means how many years of production is left at the current rate of production. R/P is cut to [0, 30]',
        yMax : yMax(data),
        data: data
        }
    }

    function configDRRR(data) {
        return {
        title: 'Yearly Depletion rate of Remaining Recoverable Reserves vs Percentage Produced of EUR',
        axisCaption : 'Depletion rate of Remaining Recoverable Reserves',
        hoverText : function(cat, d) { return cat + ' has a DRRR of ' + d },
        extraText: '* DRRR is cut to [0, 20]',
        yMax : yMax(data),
        data: data
        }
    }

    var f = function(d) { 
        updateFns[0](configRP(enhanceData(data, cutOff(30)))) 
        updateFns[1](configDRRR(enhanceData(data, function(d) { return cutOff(20)((1/d)*100) }))) 
        return f 
    }
    f(data)
    return f
}

