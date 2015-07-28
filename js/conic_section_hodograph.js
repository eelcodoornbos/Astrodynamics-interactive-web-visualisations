function conicSectionHodograph() {
    var canvasWidth = 350;
    var canvasHeight = 350;
    var ranges = { xmin: -8, xmax: 8, ymin: 0, ymax: 12}
    var marginMin = { top: 0, right: 10, bottom: 10, left: 10};
    var margin = {};
    var xScale = d3.scale.linear();
    var yScale = d3.scale.linear();
    var arrowLength = 5;
    var arrowWidth = 3;
    var defaultVectorStrokeWidth = 3;

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

    
    function chart(selection) {
        selection.each(function(data) { // "this" now refers to each selection

            // Set plot width and height based on aspect ratio and margins
            // Investigate proportions of plot
            var dataAspectRatio = (ranges.xmax - ranges.xmin) / (ranges.ymax - ranges.ymin);
            // First assume data is very tall
            var plotHeight = canvasHeight - marginMin.top - marginMin.bottom;
            var plotWidth = dataAspectRatio * plotHeight;

            if (plotWidth > canvasWidth - marginMin.left - marginMin.right) 
            { 
                // If plot is very wide, adjust margins
                plotWidth = canvasWidth - marginMin.left - marginMin.right;
                plotHeight = plotWidth * (1 / dataAspectRatio);
                margin.left = marginMin.left;
                margin.right = marginMin.right;
                margin.top = (canvasHeight - plotHeight) / 2;
                margin.bottom = margin.top;
            }
            else 
            {
                margin.top    = marginMin.top;
                margin.bottom = marginMin.bottom;
                margin.left   = marginMin.left;
                margin.right  = marginMin.right;
            } 
                        
            xScale.range([0,plotWidth]).domain([ranges.xmin, ranges.xmax]);
            yScale.range([plotHeight,0]).domain([ranges.ymin, ranges.ymax]);


            // Select SVG, if it exists, and bind the data
            var svg = d3.select(this).selectAll("svg").data([data]);
            
            // Otherwise, create the svg for the skeletal chart
            var svgEnter = svg.enter().append("svg")
                .classed('conicSectionHodograph', true)
                .attr("preserveAspectRatio", "xMinYMin meet");            

            // Next, add the group to translate for the margins
            var gEnter = svgEnter.append("g");

            // Add the defs for the clipping path and arrowheads
            var defs = gEnter.append("defs");

            // Clipping path
            defs.append("svg:clipPath")
                .attr("id","clipHodograph")
                .append("svg:rect")
                    .attr("x",xScale(ranges.xmin))
                    .attr("y",yScale(ranges.ymax))
                    .attr("width", xScale(ranges.xmax)-xScale(ranges.xmin))
                    .attr("height",yScale(ranges.ymin)-yScale(ranges.ymax));
            
            var gEnterClipped = gEnter.append("g")
                .classed('hodographClippedCanvas', true);

            addArrowMarker({element: defs, id:"velocityArrowHead", 
                arrowLength: arrowLength, arrowWidth: arrowWidth });
            addArrowMarker({element: defs, id:"radialVelocityArrowHead", 
                arrowLength: arrowLength, arrowWidth: arrowWidth });        
            addArrowMarker({element: defs, id:"normalVelocityArrowHead", 
                arrowLength: arrowLength, arrowWidth: arrowWidth });
            addArrowMarker({element: defs, id:"trueAnomalyArrowHead", 
                arrowLength: arrowLength, arrowWidth: arrowWidth });                    
            addArrowMarker({element: defs, id:"flightPathAngleArrowHead", 
                arrowLength: arrowLength, arrowWidth: arrowWidth });
            
            // And add the skeletal elements to this group
            var xAxisHodograph = d3.svg.axis() 
              .scale(xScale)
              .tickValues([-8, -6,-4,-2, 0, 2, 4, 6, 8])
              .orient("bottom");
            var yAxisHodograph = d3.svg.axis()
              .scale(yScale)
              .tickValues([2,4,6,8,10,12])
              .orient("left");

            gEnter.append('svg:g') // Axes and annotation should not be clipped, so append to graph instead of clippedCanvas
              .classed('x axis', true)
              .attr('transform', 'translate(' + (0) + ',' + (plotHeight) + ')')
              .call(xAxisHodograph);
            gEnter.append('svg:g')
              .classed('y axis', true)
              .attr('transform', 'translate(' + (0.5*plotWidth) + ',' + (0) + ')')
              .call(yAxisHodograph);              
        
            gEnter.append('svg:text')
                .classed('axis label', true)
                .attr("x", xScale(8) )
                .attr("y", yScale(0) + 35)
                .style("text-anchor", "end")
                .text("Radial velocity (km/s)");
    
            gEnter.append('svg:text')
                .classed('axis label', true)
                .attr("x", xScale(0) )
                .attr("y", yScale(12) - 15)
                .style("text-anchor", "middle")
                .text("Normal velocity (km/s)");

            gEnterClipped.append("svg:circle")
                .classed('hodographCircle', true)
                .attr("cx",xScale(0));
                
            gEnter.append("path")
                .classed('trueAnomaly', true)
                .attr("transform","rotate(-90,"+ xScale(0) + "," + yScale(data.hodographCenter) + ")");

            gEnter.append("circle")
                .classed('escapeVelocityHodograph', true)
                .attr("cx",xScale(0))
                .attr("cy",yScale(0))
                .style("visibility","hidden");
                
            gEnter.append("path")
                .classed('flightPathAngle', true);
    
            gEnter.append("line")
                .classed('velocityRadius', true);
    
            gEnter.append("g").append("line")
                .classed('radialVelocity', true)
                .attr("x1",xScale(0))
                .attr("y1",yScale(0))
                .attr("y2",yScale(0));
    
            gEnter.append("g").append("line")
                .classed('normalVelocity', true)
                .attr("x1",xScale(0))
                .attr("y1",yScale(0))
                .attr("x2",xScale(0))
    
            gEnter.append("line")
                .classed('radialVelocityHelper', true);
    
            gEnter.append("line")
                .classed('normalVelocityHelper', true);
    
            gEnter.append("line")
                .classed('velocity', true)
                .attr("x1",xScale(0))
                .attr("y1",yScale(0));            
    
            gEnter.append("circle")
                .classed('circularVelocity', true)
                .attr("cx",xScale(0))
                .attr("r",4);            
    
            gEnter.append("circle") // Origin should not be clipped, so append to graph instead of clippedCanvas
                .classed('satCircle', true)
        		.attr("r",5)
                .attr("cx",xScale(0))
                .attr("cy",yScale(0));

            // 
            // UPDATE PART
            //
               
            // Update the outer dimensions.
            svg .attr("width", canvasWidth)
                .attr("height", canvasHeight);                

            // Update the inner dimensions
            var gUpdate = svg.select('g')
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");        

            var satRadialVelocity = gUpdate.select('.radialVelocity')
                .attr("x2",xScale(data.radialVelocity ));
            scaleArrowStyle(satRadialVelocity, xScale(data.radialVelocity)-xScale(0), arrowLength, defaultVectorStrokeWidth);
                            
            var satNormalVelocity = gUpdate.select('.normalVelocity')
                .attr("y2",yScale(data.normalVelocity ));
            scaleArrowStyle(satNormalVelocity, yScale(data.normalVelocity)-yScale(0), arrowLength, defaultVectorStrokeWidth);
                
            var satVelocity = gUpdate.select('.velocity')
                .attr("x2",xScale(data.radialVelocity))
                .attr("y2",yScale(data.normalVelocity));
            scaleArrowStyle(satVelocity,
                Math.sqrt( Math.pow(xScale(data.radialVelocity)-xScale(0),2) + Math.pow(yScale(data.normalVelocity)-yScale(0),2) ),
                           arrowLength, defaultVectorStrokeWidth );
                                        
            gUpdate.select('.radialVelocityHelper')
                .attr("x1",xScale(0))
                .attr("y1",yScale(data.normalVelocity))
                .attr("x2",xScale(data.radialVelocity))
                .attr("y2",yScale(data.normalVelocity));
            gUpdate.select('.normalVelocityHelper')
                .attr("x1",xScale(data.radialVelocity))
                .attr("y1",yScale(0))
                .attr("x2",xScale(data.radialVelocity))
                .attr("y2",yScale(data.normalVelocity));
    
            gUpdate.select('.circularVelocity')
                .attr("cy",yScale(data.circularVelocity))
    
            gUpdate.select('.escapeVelocity')
                .attr("r",yScale(0)-yScale(data.escapeVelocity));
    
            gUpdate.select('.flightPathAngle')
                .attr("d",anglesToClosedArcPath(xScale,yScale,0,0,1.6,Math.PI/2,Math.PI/2-data.flightPathAngle,0,0));
    
            var trueAnomaly = data.trueAnomaly;
            var fliplargearc = 0;
//            if (trueAnomaly < 0) { trueAnomaly += Math.PI * 2;}
            if (trueAnomaly > Math.PI) { fliplargearc = 1; }
            var startangle = 0;
            var endangle = -trueAnomaly;
    
            gUpdate.select('.trueAnomaly')
                .attr("transform","rotate(-90,"+ xScale(0) + "," + yScale(data.hodographCenter) + ")")           
                .attr("d",anglesToArcPath(xScale,yScale,0,data.hodographCenter,1,startangle,endangle,0,fliplargearc));
    
            gUpdate.select('.velocityRadius')
                .attr("x1",xScale(0))
                .attr("y1",yScale(data.hodographCenter))
                .attr("x2",xScale(data.radialVelocity))
                .attr("y2",yScale(data.normalVelocity));
            gUpdate.select('.hodographCircle')
                .attr("cy",yScale(data.hodographCenter))
                .attr("r",xScale(data.hodographRadius)-xScale(0));
                           
        }); // End of selection.each(function(data)...
    }
    return chart;
    
} // end of conicSectionHodograph