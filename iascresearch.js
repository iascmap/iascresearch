// based on worked example https://dc-js.github.io/dc.js/docs/stock.html



// VARIABLES
// colours = qualitative scale of 12 from colorbrewer
var colours = ['#a6cee3','#1f78b4','#b2df8a','#33a02c','#fb9a99','#e31a1c','#fdbf6f','#ff7f00','#cab2d6','#6a3d9a','#ffff99','#b15928'];
//var colours = ['#2E97CC']; // IASC bar = 0099cc; globe = #1A77AD; icons = #2E97CC

// pagination initial offset & no. records per page
var offset = 0,
	pagination = 25;  // 25


// CREATE OBJECTS & TIE TO HTML ie match to div IDs in the html
var ndx,
	typeRowChart = dc.rowChart("#chart-row-type"),
	interventionRowChart = dc.rowChart("#chart-row-intervention"),
	geographicalRowChart = dc.rowChart("#chart-row-geographical"),
	sectorRowChart = dc.rowChart("#chart-row-sector"),
	// later add year
    dataCount = dc.dataCount("#datacount"),
    dataSummaryTable = dc.dataTable("#table-datasummary");

// LOAD DATA
d3.csv('/iascresearch/data.csv', function (data) {
	// might want to format data a bit here
	// eg calculate month/year from timestamp
    data.forEach(function (d) {
    	d.output =  d.outputtitle; // + ' (' + d.year + ')';  '[' + d.id + '] ' +
			if (d.URL) {
				// console.log (d.id + ': ' + d.URL);
				d.output = d.output + ' <a href="' + d.URL + '">' + d.URL + '</a>';
			}
	});


	// CREATE CROSSFILTER DIMENSIONS AND GROUPS
	ndx = crossfilter(data),
		typeDim = ndx.dimension(function (d) {
		    return d.type;
		}),
		interventionDim = ndx.dimension(function (d) {
		    return d.intervention;
		}),
		geographicalDim = ndx.dimension(function (d) {
		    return d.geographical;
		}),
		sectorDim = ndx.dimension(function (d) {
		    return d.sector;
		}),
		all = ndx.groupAll(),
		typeGroup = typeDim.group(),
		interventionGroup = interventionDim.group(),
		geographicalGroup = geographicalDim.group(),
		sectorGroup = sectorDim.group();

		// remove sector = null (as biggest to overshadows others)
		// see https://github.com/dc-js/dc.js/wiki/FAQ#remove-particular-bins
		sectorGroupNoNulls = remove_empty_bins(sectorGroup);

		function remove_empty_bins(source_group)
		{
		    return {
		        all:function () {
		            return source_group.all().filter(function(d) {
										//console.log (d.key + ' => ' + d.value);
		                return d.key != ''; 			// only return non-null keys
		            });
		        }
		    };
		}




	// CONFIGURE DATA COUNT (x out of y records shown)
	dataCount
		.dimension(ndx)
	    .group(all)
	    .html({
	    	some: '<span class="filter-count">%filter-count</span> out of <span class="total-count">%total-count</span> outputs selected. <a href="javascript:viewAll();" class="btn btn-primary btn-sm">View all outputs</a>',
     		all: 'All <span class="total-count">%total-count</span> outputs displayed. <b>Click a bar to filter the data...</b> '
		});


	// CONFIGURE CHART ATTRIBUTES
	var w = 292, h = 300;
	typeRowChart
		.width(w).height(h)
	    .dimension(typeDim)
	    .group(typeGroup)
	    .ordinalColors(colours) 	// range of colours
	    .elasticX(true)				// NB elastic means rescale axis; may want to turn this off
	    .on("filtered", function() {
    		offset = 0;				// reset pagination (else stay on current page which may be outside new filtered dataset)
				updatePagination();
  		})
			.xAxis()
				.ticks(5)												// ~5 ticks = not too crowded
				.tickFormat(d3.format("d"));		// format: decimal, rounded to integer (ie so not 0.5)
				//.tickSubdivide(0);  					// to prevent sub ticks??


	interventionRowChart
		.width(w).height(h)
	    .dimension(interventionDim)
	    .group(interventionGroup)
	    .ordinalColors(colours)
	    .elasticX(true)
	    .on("filtered", function() {
    		offset = 0;				// reset pagination (else stay on current page which may be outside new filtered dataset)
				updatePagination();
  		})
			.xAxis()
				.ticks(5)												// ~5 ticks = not too crowded
				.tickFormat(d3.format("d"));		// format: decimal, rounded to integer (ie so not 0.5 - 1 - 1.5 - 2)


	geographicalRowChart
		.width(w).height(h)
	    .dimension(geographicalDim)
	    .group(geographicalGroup)
	    .ordinalColors(colours)
	    .elasticX(true)
	    .on("filtered", function() {
    		offset = 0;				// reset pagination (else stay on current page which may be outside new filtered dataset)
				updatePagination();
  		})
			.xAxis()
				.ticks(5)												// ~5 ticks = not too crowded
				.tickFormat(d3.format("d"));		// format: decimal, rounded to integer (ie so not 0.5 - 1 - 1.5 - 2)


	sectorRowChart
		.width(w).height(h)
	    .dimension(sectorDim)
	    //.group(sectorGroup)
			.group(sectorGroupNoNulls)
	    .ordinalColors(colours)
	    .elasticX(true)
	    .on("filtered", function() {
    		offset = 0;				// reset pagination (else stay on current page which may be outside new filtered dataset)
				updatePagination();
  		})
			.xAxis()
				.ticks(5)												// ~5 ticks = not too crowded
				.tickFormat(d3.format("d"));			// format: decimal, rounded to integer (ie so not 0.5 - 1 - 1.5 - 2)



	// CONFIGURE DATA TABLE
	dataSummaryTable
		.dimension(typeDim)
	    .group(function(d) {
        	return d.year;			// group by year
    	})
    	.size(Infinity)				// need all the records & let pagination handle display & offset
    	.sortBy(function (d) {
            return d.year;
        })
  		.showGroups(false)			// dont show extra group rows eg '2016' above all 2016 entries
    	.columns(['output', 'year', 'type', 'intervention', 'geographical', 'sector']);
    	// can change labels & format of data if desired


	// RENDER
/* DEBUG */
// console.log ('Size from within load ' + ndx.size());
	updatePagination();				// display initial values for pagination
	dc.renderAll();					// draw all charts

}); /* close load data */


// PAGINATION
// see https://github.com/dc-js/dc.js/blob/master/web/examples/table-pagination.html
function displayPagination() {
	//console.log ('Offset: ' + offset + ' NDX Size: ' + ndx.size() + ' Filtered: ' + ndx.groupAll().value());

	var filtered = ndx.groupAll().value();
	var end = (filtered < offset+pagination) ? (filtered) : (offset+pagination);

  d3.select('#begin')
      .text(offset+1);						// MJG add one so not start at zero
  d3.select('#end')
      .text(end); 								// MJG filtered if < offset+pagination
  d3.select('#previous')
      .attr('disabled', offset-pagination<0 ? 'true' : null)
  d3.select('#next')
      .attr('disabled', offset+pagination>=filtered ? 'true' : null); // filtered not ndx.size
  d3.select('#size').text(filtered);																	// filtered not ndx.size
}

function updatePagination() {
	//console.log ('Offset: ' + offset + ' NDX Size: ' + ndx.size() + ' Filtered: ' + ndx.groupAll().value());

  dataSummaryTable.beginSlice(offset);
  dataSummaryTable.endSlice(offset+pagination);
  displayPagination();
}
function next() {
  offset += pagination;
  updatePagination();
  dataSummaryTable.redraw();
}
function previous() {
      offset -= pagination;
      updatePagination();
      dataSummaryTable.redraw();
}

// RESET - view all records
function viewAll() {
	offset = 0;				// reset pagination
	updatePagination();
	dc.filterAll();			// reset filters (ie all records)
	dc.renderAll();			// redraw graphs & table
	displayPagination();	// display default pagination
}
