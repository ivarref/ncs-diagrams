function show_yearly_yield_as_percentage_of_eur(data) {
    function enhanceData(data) {
        var totalReserves = addDict()
        productionWith12MMAByField(data).forEach(function(d) {
            totalReserves.add(d.startProductionDecade, d.reserves)
            totalReserves.add('All', d.reserves)
        })
        var orgdata = prodbyDateAndStartDecade(data)
        orgdata.production.forEach(function(dd) {
            dd.forEach(function(d, i) {
                d.reserves = totalReserves.get(d.startProductionDecade)
                d.producedPercentage = (d.cumulativeProduced / d.reserves)*100.0
                d.y = (d.last12MonthsProduction / d.reserves)*100.0
            })
        })
        var entry = orgdata.production[0].map(function(dd, i) {
            var reserves     = d3.sum(orgdata.production, function(d) { return d[i].reserves })
            var cumulative   = d3.sum(orgdata.production, function(d) { return d[i].cumulativeProduced })
            var last12Months = d3.sum(orgdata.production, function(d) { return d[i].last12MonthsProduction })
            var percentageOfMaxProduction = (last12Months/reserves)*100.0
            return {reserves: reserves,
                    producedPercentage: (cumulative/reserves)*100.0,
                    y: percentageOfMaxProduction,
                    field: 'All',
                    date: dd.date
                   }
        })
        orgdata.production.push(entry)
        orgdata.decades.push('All')
        return orgdata
    }
    var updateFn = percentageOfMaxProductionVsProducedPercentage(body)
    function config(data) {
        return {
        title: '12 Month Moving Sum of Production as Percentage of EUR vs Percentage Produced of EUR',
        axisCaption : '12 Month Moving Sum Of Production as Percentage of EUR',
        hoverText : function(cat, d) { return cat + ' producing ' + d + ' % of EUR' },
        yMax : d3.max(data.production, function(d) { 
            return d3.max(d, function(d) { return d.y }) }),
        data: data
        }
    }
    var f = function(d) { updateFn(config(enhanceData(data))); return f }
    f(data)
    return f
}

