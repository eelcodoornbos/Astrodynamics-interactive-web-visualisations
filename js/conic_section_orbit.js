function conicSectionOrbit() {

    var canvasWidth = 500;
    var canvasHeight = 350;
    var marginMin = { top: 0, right: 0, bottom: 0, left: 0};
    var margin = {};
    var xScale = d3.scale.linear();
    var yScale = d3.scale.linear();
    var arrowLength = 5;
    var arrowWidth = 3;
    var velocityScale = 200/16; // 200 pixels for 16 km/s
    
    var showSemiLatusRectum = false;
    var showNormalRadialVelocity = true;
    var showHodographCircle = true;
    var showVelocity = true;
    var showFlightPathAngle = true;
    var showTrueAnomaly = true;
    var showArgumentOfPerigee = true;
    
    var defaultVectorStrokeWidth = 3;
    var orbitLineFunction = d3.svg.line()
            .x( function (d) { return (xScale(d.x)); } )
            .y( function (d) { return (yScale(d.y)); } );
    
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
    chart.velocityScale = function(value) {
        if (!arguments.length) return velocityScale;
        velocityScale = value;
        return chart;
    };    
    chart.showNormalRadialVelocity = function(value) {
        if (!arguments.length) return showVelocityComponents;
        showNormalRadialVelocity = value;
        return chart;
    };
    chart.showHodographCircle = function(value) {
        if (!arguments.length) return showHodographCircle;
        showHodographCircle = value;
        return chart;
    };      
    chart.showVelocity = function(value) {
        if (!arguments.length) return showVelocity;
        showVelocity = value;
        return chart;
    };
    chart.showFlightPathAngle = function(value) {
        if (!arguments.length) return showFlightPathAngle;
        showFlightPathAngle = value;
        return chart;
    };
    chart.showSemiLatusRectum = function(value) {
        if (!arguments.length) return showSemiLatusRectum;
        showSemiLatusRectum = value;
        return chart;
    };
    chart.showArgumentOfPerigee = function(value) {
        if (!arguments.length) return showArgumentOfPerigee;
        showArgumentOfPerigee = value;
        return chart;
    };
    
    function chart(selection) {
        selection.each(function(data) { // "this" now refers to each selection
            
            // Investigate proportions of plot
            var dataAspectRatio = (data.xMax - data.xMin) / (data.yMax - data.yMin);
            // First assume data is very tall (hyperbolic orbit)
            var plotHeight = canvasHeight - marginMin.top - marginMin.bottom;
            var plotWidth = dataAspectRatio * plotHeight;

            if (plotWidth > canvasWidth - marginMin.left - marginMin.right) 
            { 
                // If plot is very wide (elliptical orbit), adjust margins
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

            xScale.range([0,  plotWidth]).domain([data.xMin,data.xMax]);
            yScale.range([plotHeight, 0]).domain([data.yMin,data.yMax]);
            plotScale = (plotWidth)/(data.xMax - data.xMin);

            // Select SVG, if it exists, and bind the data
            var svg = d3.select(this).selectAll("svg").data([data]);
            
            // Otherwise, create the svg for the skeletal chart
            var svgEnter = svg.enter().append("svg")
                .attr("preserveAspectRatio", "xMinYMin meet")
                .classed('conicSectionOrbit', true);

            // Update the outer dimensions.
            svg .attr("width", canvasWidth)
                .attr("height", canvasHeight);

            // First, add the defs for the arrowheads
            var defs = svgEnter.append("defs");
            addArrowMarker({element: defs, id:"velocityArrowHead", arrowLength: arrowLength, arrowWidth: arrowWidth });
            addArrowMarker({element: defs, id:"radialVelocityArrowHead", arrowLength: arrowLength, arrowWidth: arrowWidth });        
            addArrowMarker({element: defs, id:"normalVelocityArrowHead", arrowLength: arrowLength, arrowWidth: arrowWidth });
            addArrowMarker({element: defs, id:"trueAnomalyArrowHead", arrowLength: arrowLength, arrowWidth: arrowWidth });                    
            addArrowMarker({element: defs, id:"flightPathAngleArrowHead", arrowLength: arrowLength, arrowWidth: arrowWidth });

            // Next, add the group to translate for the margins
            var gEnter = svgEnter.append("g");

            // and update the inner dimensions
            var gUpdate = svg.select('g')
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");        
            
            // And add the skeletal elements to this group
            // 1. Central body
            gEnter.append("circle")
            	.classed('centralBody', true)
            gUpdate.select('.centralBody')
                .attr("cx",xScale(0))
            	.attr("cy",yScale(0))
            	.attr("r",plotScale*data.centralBody.radius);

            // 2. Axes
            gEnter.append("line")
                .classed('orbitAxisX', true);
            gUpdate.select('.orbitAxisX')
                .attr("x1",xScale(data.xMin)-marginMin.left)
                .attr("y1",yScale(0))
                .attr("x2",xScale(data.xMax)+marginMin.left)
                .attr("y2",yScale(0));

            gEnter.append("line")
                .classed('orbitAxisY', true);
            gUpdate.select('.orbitAxisY')
                .attr("x1",xScale(0))
                .attr("y1",yScale(data.yMin)+marginMin.top)
                .attr("x2",xScale(0))
                .attr("y2",yScale(data.yMax)-marginMin.top);
                
            // 2a. Semi latus rectum
            if (showSemiLatusRectum) {
                gEnter.append("line")
                    .classed('semiLatusRectum', true);
                gUpdate.select('.semiLatusRectum')
                    .attr("x1",xScale(0))
                    .attr("y1",yScale(0))                         
                    .attr("x2",xScale(data.semiLatusRectum * -1* Math.sin(data.argumentOfPerigee) ) )
                    .attr("y2",yScale(data.semiLatusRectum * Math.cos(data.argumentOfPerigee) ) );                    
            }
            
            // 3. Orbit
            gEnter.append("path")
                .classed('orbit', true);
            if (data.eccentricity < 1)
            {
                gUpdate.select('.orbit').attr("d",orbitLineFunction(data.twoBodyData) + "Z");
            } else {
                gUpdate.select('.orbit').attr("d",orbitLineFunction(data.twoBodyData));            
            }
                

            // 4. Radius (line connection central body to satellite)
            gEnter.append("line")
                .classed("satRadius", true)
                .attr("x1",xScale(0))
                .attr("y1",yScale(0));
            gUpdate.select('.satRadius')
                .attr("x1",xScale(0))
                .attr("y1",yScale(0))
                .attr("x2",xScale(model.x))
                .attr("y2",yScale(model.y));
                
            // Set up transformations of the satellite and its velocity
            var argumentOfLatitude = data.trueAnomaly + data.argumentOfPerigee;
            var argumentOfLatitudeDeg = data.trueAnomalyDeg + data.argumentOfPerigeeDeg;
            var transformPosition = "translate(" + xScale(model.x) + "," + yScale(model.y) + ")";
            var transformVelocity = "rotate("+ (-1*(argumentOfLatitudeDeg+90-data.flightPathAngleDeg)) +")";
            var transformRadialVelocity = "rotate("+ (-1 * argumentOfLatitudeDeg) +")";
                
            // 5. Satellite group
            var satellite = gEnter.append("g")
                .classed('satellite', true);
            var satUpdate = gUpdate.select('.satellite')
                .attr("transform",transformPosition);

            // 6. Flight path angle
            if (showFlightPathAngle) {
                var flightPathAngle = satellite.append("path")
                    .classed("flightPathAngle", true);
                var endAngle   = -1 * (argumentOfLatitude)+3/2*Math.PI;
                var startAngle = -1 * (argumentOfLatitude)+3/2*Math.PI + data.flightPathAngle;
                svg.select(".flightPathAngle")
                    .attr("d",anglesToClosedArcPath(function(d){return d;}, function(d){return d;}, 
                                                                0, 0, 20, startAngle, endAngle, 1, 0));
            }

            // 7. Velocity components                
            if (showNormalRadialVelocity) {
                satellite.append("line")
                    .classed("radialVelocity", true)
                    .attr("x1",0)
                    .attr("y1",0)
                    .attr("y2",0);
                var satRadialVelocity = satUpdate.select('.radialVelocity')
                    .attr("x2",data.radialVelocity * velocityScale)
                    .attr("transform",transformRadialVelocity);
                scaleArrowStyle(satRadialVelocity,data.radialVelocity * velocityScale, arrowLength, defaultVectorStrokeWidth);
                    
                satellite.append("line")
                    .classed("normalVelocity", true)
                    .attr("x1",0)
                    .attr("y1",0)
                    .attr("x2",0);        
                var satNormalVelocity = satUpdate.select('.normalVelocity')
                    .attr("y2",-1 * (model.normalVelocity * velocityScale))
                    .attr("transform",transformRadialVelocity);
                scaleArrowStyle(satNormalVelocity, data.normalVelocity * velocityScale, arrowLength, defaultVectorStrokeWidth);
            
                // 8. Dashed helper-lines for velocity, parallel to the velocity components
                satellite.append("line")
                    .classed("radialVelocityHelper", true);
                satUpdate.select('.radialVelocityHelper')
                    .attr("x1", 0)
                    .attr("y1", -1 * (data.normalVelocity * velocityScale))
                    .attr("x2", +1 * (data.radialVelocity * velocityScale))
                    .attr("y2", -1 * (data.normalVelocity * velocityScale))
                    .attr("transform", transformRadialVelocity);

                satellite.append("line")
                    .classed("normalVelocityHelper", true);        
                satUpdate.select('.normalVelocityHelper')
                    .attr("x1", +1 * (data.radialVelocity * velocityScale))
                    .attr("y1", 0)
                    .attr("x2", +1 * (data.radialVelocity * velocityScale))
                    .attr("y2", -1 * (data.normalVelocity * velocityScale))
                    .attr("transform",transformRadialVelocity);
                    
            }
                
            // 9. Velocity
            if (showVelocity) {
                satellite.append("line")
                    .classed("velocity",true)
                    .attr("x1",0)
                    .attr("y1",0)
                    .attr("y2",0);
                var satVelocity = satUpdate.select('.velocity')
                    .attr("x2",data.velocity * velocityScale)
                    .attr("transform",transformVelocity);
                scaleArrowStyle(satVelocity,data.velocity * velocityScale, arrowLength, defaultVectorStrokeWidth);                    
            }
            
            // 10. True anomaly angle
            if (showTrueAnomaly) {
                gEnter.append("path")
                    .classed("trueAnomaly", true);
                gUpdate.select('.trueAnomaly')
                    .attr("d",anglesToArcPath(xScale, yScale, 
                                                    0, 0, 
                                                    data.centralBody.radius*0.8, 
                                                    data.argumentOfPerigee, argumentOfLatitude, 
                                                    0, 0, 0));
            }

            // 10. Argument of perigee angle            
            if (showArgumentOfPerigee) {
                gEnter.append("path")
                    .classed("argumentOfPerigee", true);
                // Argument of perigee angle
                gUpdate.select('.argumentOfPerigee')
                    .attr("d",anglesToClosedArcPath(xScale, yScale, 
                                                    0, 0, 
                                                    data.centralBody.radius*0.8, 
                                                    0, data.argumentOfPerigee, 
                                                    0, 0, 0));                    
            }

            // 11. Satellite circle
            satellite.append("circle")
                .classed("satCircle", true)
        		.attr("r",5);
            gUpdate.select(".satCircle")
                .attr("cx",0)
                .attr("cy",0);
        
            if (showHodographCircle) {
                // 12. Hodograph circle at satellite
                var hodographCircle = satellite.append("circle")
                    .classed('hodographCircle', true);
                satUpdate.select('.hodographCircle')
                    .attr("transform", transformRadialVelocity)
                    .attr("cx",0)
                    .attr("cy",-1 * data.hodographCenter * velocityScale)
                    .attr("r", +1 * data.hodographRadius * velocityScale);
            }
                           
        }); // End of selection.each(function(data)...
    }
    return chart;

} // end of conicSectionOrbit