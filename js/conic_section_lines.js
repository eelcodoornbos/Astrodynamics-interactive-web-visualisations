function conicSectionLines() {
    var canvasWidth = 500;
    var canvasHeight = 250;
    var ranges = { xmin: -180, xmax: 180, ymin: -90, ymax: 90}
    var marginMin = { top: 20, right: 10, bottom: 40, left: 30};
    var xTickValues = [-180,-135,-90,-45,45,90,135,180];
    var yTickValues = [-15,-10,-5,0,5,10,15];
    var margin = {};
    var xScale = d3.scale.linear();
    var yScale = d3.scale.linear();
    var yScale = d3.scale.linear();
    var arrowLength = 5;
    var arrowWidth = 3;
    var defaultVectorStrokeWidth = 3;
    var rectSize = 5;
    var xAxisLabel = "True anomaly (deg)";
    var yAxisLabel = "Velocity (km/s)";
    
    var plotVariables = [
      {
         xAxisVariable: "trueAnomaly",
         xAxisScaleFactor: 180/Math.PI,
         yAxisVariable: "radialVelocity",
         yAxisScaleFactor: 1
      },
      {
         xAxisVariable: "trueAnomaly",
         xAxisScaleFactor: 180/Math.PI,
         yAxisVariable: "normalVelocity",
         yAxisScaleFactor: 1
      },
      {
         xAxisVariable: "trueAnomaly",
         xAxisScaleFactor: 180/Math.PI,
         yAxisVariable: "velocity",
         yAxisScaleFactor: 1
      }
    ];

    chart.ranges = function(value) {
      if (!arguments.length) return ranges;
      ranges = value;
      return chart;  
    };
    chart.xAxisLabel = function(value) {
      if (!arguments.length) return xAxisLabel;
      xAxisLabel = value;
      return chart;  
    };    
    chart.yAxisLabel = function(value) {
      if (!arguments.length) return yAxisLabel;
      yAxisLabel = value;
      return chart;  
    };        
    chart.plotVariables = function(value) {
      if (!arguments.length) return plotVariables;
      plotVariables = value;
      return chart;  
    };
    chart.canvasWidth = function(value) {
        if (!arguments.length) return canvasWidth;
        canvasWidth = value;
        return chart;
    };
    chart.canvasHeight = function(value) {
        if (!arguments.length) return canvasHeight;
        canvasHeight = value;
        return chart;
    };
    chart.rectSize = function(value) {
        if (!arguments.length) return rectSize;
        rectSize = value;
        return chart;
    };
    chart.xTickValues = function(value) {
        if (!arguments.length) return xTickValues;
        xTickValues = value;
        return chart;
    };
    chart.yTickValues = function(value) {
        if (!arguments.length) return yTickValues;
        yTickValues = value;
        return chart;
    };

    function addElement(parent,input) {
        parent.append("svg:path") // Curvy line showing data
            .classed(input.yAxisVariable, true);
        parent.append("svg:line") // Horizontal line intersecting with Y-axis 
            .classed(input.yAxisVariable, true);
        parent.append("svg:rect") // Small rounded rectangle, showing current data point
            .classed(input.yAxisVariable, true)
            .attr("width", rectSize)
            .attr("height", rectSize);                

    }
    
    function updateElement(parent,input) {
        var lineFunction = d3.svg.line()
                .x(function(d,i) { return xScale(d[input.xAxisVariable] * input.xAxisScaleFactor); })
                .y(function(d,i) { return yScale(d[input.yAxisVariable] * input.yAxisScaleFactor); });
        parent.select('path.' + input.yAxisVariable)
            .attr("d",lineFunction(model.twoBodyData));
        parent.select('rect.' + input.yAxisVariable)
            .attr("x", xScale(model[input.xAxisVariable] * input.xAxisScaleFactor)-rectSize/2)
            .attr("y", yScale(model[input.yAxisVariable] * input.yAxisScaleFactor)-rectSize/2)
            .attr('rx',3)
            .attr('ry',3);
        parent.select('line.' + input.yAxisVariable)
            .attr("x1",xScale(0)-2)
            .attr("y1",yScale(model[input.yAxisVariable] * input.yAxisScaleFactor))
            .attr("x2",xScale(0)+2)
            .attr("y2",yScale(model[input.yAxisVariable] * input.yAxisScaleFactor));
    }
    
    function chart(selection) {
        selection.each(function(data) { // "this" now refers to each selection

            var plotHeight = canvasHeight - marginMin.top - marginMin.bottom;
            var plotWidth = canvasWidth - marginMin.left - marginMin.right;

            margin.top    = marginMin.top;
            margin.bottom = marginMin.bottom;
            margin.left   = marginMin.left;
            margin.right  = marginMin.right;
                        
            xScale.range([0,plotWidth]).domain([-180,180]); // True anomaly range
            yScale.range([plotHeight,0]).domain([ranges.ymin, ranges.ymax]); // Velocity range

            // Select SVG, if it exists, and bind the data
            var svg = d3.select(this).selectAll("svg").data([data]);            
            // Otherwise, create the svg for the skeletal chart
            var svgEnter = svg.enter().append("svg")
                .attr("preserveAspectRatio", "xMinYMin meet")
                .classed('conicSectionLines', true);


            // First, add the defs for the clipping path and arrowheads
            var defs = svgEnter.append("defs");

            // Clipping path
            defs.append("svg:clipPath")
                .attr("id","clipLines")
                .append("svg:rect")
                    .attr("x",xScale(ranges.xmin))
                    .attr("y",yScale(ranges.ymin))
                    .attr("width",plotWidth)
                    .attr("height",plotHeight);
    
            // Next, add the group to translate for the margins
            var gEnter = svgEnter.append("g");
            
            // And add the skeletal elements to this group
    
            var xAxis = d3.svg.axis() 
              .scale(xScale)
              .tickValues(xTickValues)
              .orient("bottom");
            var yAxis = d3.svg.axis()
              .scale(yScale)
              .tickValues(yTickValues)
              .orient("left");
              
            gEnter.append('svg:g') // Axes and annotation should not be clipped, so append to graph instead of clippedCanvas
              .classed('x axis', true)
              .attr('transform', 'translate(' + (0) + ',' + yScale(0) + ')')
              .call(xAxis);
            gEnter.append('svg:g')
              .classed('y axis', true)
              .attr('transform', 'translate(' + xScale(0) + ',' + (0) + ')')
              .call(yAxis);  

            var gEnterClipped = gEnter.append("g")
            
            plotVariables.forEach(function(currentPlotVariable) {
                addElement(gEnterClipped,currentPlotVariable);                
            });
            
            gEnterClipped.append("svg:line")
                .classed('trueAnomaly', true);          

            gEnter.append('svg:text')
                .classed('axis label', true)
                .attr("x", xScale(ranges.xmax) )
                .attr("y", yScale(0) + 35)
                .style("text-anchor", "end")
                .text(xAxisLabel);
    
            gEnter.append('svg:text')
                .classed('axis label', true)
                .attr("x", xScale(0))
                .attr("y", yScale(ranges.ymax) - 10)
                .style("text-anchor", "middle")
                .text(yAxisLabel);

            // 
            // UPDATE PART
            //
               
            // Update the outer dimensions.
            svg .attr("width", canvasWidth)
                .attr("height", canvasHeight);                

            // Update the inner dimensions
            var gUpdate = svg.select('g')
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");        

            gUpdate.select('line.trueAnomaly')
                .attr("x1",xScale(model.trueAnomaly*180/Math.PI))
                .attr("y1",yScale(0)+2)
                .attr("x2",xScale(model.trueAnomaly*180/Math.PI))
                .attr("y2",yScale(0)-2);
                                                
            plotVariables.forEach(function(currentPlotVariable) {
                updateElement(gUpdate,currentPlotVariable);                
            });
                                                               
        }); // End of selection.each(function(data)...
    }
    return chart;
    
} // end of conicSectionLines