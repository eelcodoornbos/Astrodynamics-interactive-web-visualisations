view = {
    refFrame: "inertial"
};
model.trailRefObject = model.zeroObject;
model.viewRefObject = model.zeroObject;


function nBodyChart() 
{
    // Properties
    var canvasWidth = 500;
    var canvasHeight = 500;
    var margin = { top: 20, right: 20, bottom: 50, left: 50};
    var xScale = d3.scale.linear();
    var yScale = d3.scale.linear();
    var velocityScale = 0.5;
    var accelerationScale = 1;
    var radiusScale = 0.15;
    var comRadius = 5;
    
    // Chart function that can be called on a DOM element to draw the SVG chart
    function chart(selection) {
                
        // Set the transition duration
        var transitionDuration;
        if (inTransition) { 
            transitionDuration = 0;
        } else {
            transitionDuration = 0;
        }        

        // Loop over the DOM elements to which the chart can be added
        selection.each(function(data) { // "this" now refers to the DOM element to which the SVG chart is added

            // Set proportions of plot
            var plotHeight = canvasHeight - margin.top - margin.bottom;
            var plotWidth = canvasWidth - margin.left - margin.right;
            
            // panView is used to keep the viewport centred on the centre of mass, in inertial view
                // zeroObject is a virtual object that always stays at the origin of the inertial reference frame
                // If the reference frame is centred on any other object, 
                // there is no need to change the centring of the viewport
            if (view.refFrame === "corotating") {
                panView = model.viewRefObject.position;
            } else {
                panView = model.viewRefObject.position.rotate(-model.rotationAngle,model.rotationLine);                             
            }


            // Set the scales
            xScale.range([0,  plotWidth]).domain([-model.zoomLevel+panView.e(1),model.zoomLevel+panView.e(1)]);
            yScale.range([plotHeight, 0]).domain([-model.zoomLevel+panView.e(2),model.zoomLevel+panView.e(2)]);
            
            // Select SVG, if it exists, and bind the data
            var svg = d3.select(this).selectAll("svg").data([data]);
            
            // Otherwise, create the svg for the skeletal chart
            var svgEnter = svg.enter().append("svg")
                .classed('threeBody', true)
                .attr("width",canvasWidth)
                .attr("height",canvasHeight);

            // First, add the defs
            var defs = svgEnter.append("defs");
            addArrowMarker({element: defs, id:"velocityArrowHead", arrowLength: 5, arrowWidth:3});
            addArrowMarker({element: defs, id:"accelerationArrowHead", arrowLength: 5, arrowWidth:3});

            // Next, add the group to translate for the margins
            gPlotArea = svgEnter.append("g")
                .classed("plotArea", true);
            svg.select('g.plotArea')
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
            
            // Now add the group for the axes and grid
            gAxesAndGrids = gPlotArea.append("g")
                .classed("axesAndGrids", true);
            
            // X axis
            var xAxis = d3.svg.axis() 
                .scale(xScale)
                .ticks(5)
                .orient("bottom");
            gAxesAndGrids.append('svg:g') // Axes and annotation should not be clipped, so append to graph instead of clippedCanvas
                .classed('x axis', true)
            svg.select('.x.axis')
                .attr('transform', 'translate(' + (0) + ',' + (plotHeight) + ')')
                .call(xAxis);

            // Y axis
            var yAxis = d3.svg.axis()
                .scale(yScale)
                .ticks(5)
                .orient("left");
            gAxesAndGrids.append('svg:g')
                .classed('y axis', true)
            svg.select('.y.axis')
                .attr('transform', 'translate(' + (0) + ',' + (0) + ')')
                .call(yAxis);              

            // Grid
            var horizontalGridLines = gridLines().orient("horizontal").ticks(5).xScale(xScale).yScale(yScale);
            var verticalGridLines = gridLines().orient("vertical").ticks(5).xScale(xScale).yScale(yScale);
            gAxesAndGrids.append('svg:g').classed('gridLines horizontal', true);
            gAxesAndGrids.append('svg:g').classed('gridLines vertical', true);
            svg.select('.gridLines.horizontal').call(horizontalGridLines);
            svg.select('.gridLines.vertical').call(verticalGridLines);

            gCorotate = gPlotArea.append("svg:g").classed("corotate", true);
            gCorotate.append("svg:g").classed("lagrangePoints", true);
            gCorotate.append("svg:g").classed("zeroVelocityCurve", true);

            // Grid
            var horizontalGridLines = gridLines().orient("horizontal").ticks(1).xScale(xScale).yScale(yScale);
            var verticalGridLines = gridLines().orient("vertical").ticks(1).xScale(xScale).yScale(yScale);

            gCorotate.append('svg:g').classed('rotatingGridLines horizontal', true);
//            gCorotate.append('svg:g').classed('rotatingGridLines vertical', true);
            svg.select('.rotatingGridLines.horizontal').call(horizontalGridLines);
//            svg.select('.rotatingGridLines.vertical').call(verticalGridLines);


            // Sphere of influence
            gCorotate.append("svg:g").classed("spheresOfInfluence", true);            
            if (model.showSphereOfInfluence) {
                gSpheresOfInfluence = svg.selectAll('.spheresOfInfluence');
                gSpheresOfInfluence.selectAll('.sphereOfInfluence')
                .data(model.objects).enter() 
                    .append("svg:circle")
                    .classed('sphereOfInfluence', true)
                    .attr("fill", function(d,i) { return d.color } )
                    .attr("opacity",0.05)
                    .attr("stroke", "black")
                    .attr("stroke-width","1px");

                svg.selectAll('.sphereOfInfluence')
                        .attr("cx", function(d) { return xScale(d.position.e(1)) } )
                        .attr("cy", function(d) { return yScale(d.position.e(2)) } )
                        .attr("r", function(d,i) 
                        {
                            var minrsoi = 1e12;
                            model.objects.forEach( function(secondObject,index) {
                                if (secondObject != d) {
                                    var massRatio = d.mass / secondObject.mass;
                                    var delta = d.position.subtract(secondObject.position);
                                    var rho = delta.modulus();
                                    var rsoi = rho * Math.pow(massRatio,2/5);
                                    if (rsoi < minrsoi) { minrsoi = rsoi; }
                                }
                            });
                            return xScale(minrsoi) - xScale(0);
                        });
            } else {
               d3.selectAll('.sphereOfInfluence').remove();
            }

            
            if (view.refFrame === "corotating") {
                svg.select(".corotate").transition().duration(transitionDuration)
                    .attrTween("transform", function tween(d, i, a) {
                        return d3.interpolateString(
                            "rotate(" + (model.rotationAngle*180/Math.PI) + "," + (xScale(0)) + "," + (yScale(0)) + ")",
                            "rotate(" + (0) + "," + (xScale(0)) + "," + (yScale(0)) + ")");
                    })
            } else {
                svg.select(".corotate")
                    .transition()
                    .duration(transitionDuration)
                    .attrTween("transform", function tween(d, i, a) {
                        return d3.interpolateString(
                            a,
//                            "rotate(" + (0) + "," + (xScale(0)) + "," + (yScale(0)) + ")", 
                            "rotate(" + (model.rotationAngle*180/Math.PI) + "," + (xScale(0)) + "," + (yScale(0)) + ")");
                    })
            }
            
            // Zero-velocity contour / surface of Hill            
            if (model.showHillSurface) {
                compoundContourPath = "";
                model.currentContours.forEach( function(contourdata,index) {
                    var contourPath = d3.svg.line();
                    contourPath
                        .x(function(d) { return xScale(d.x) } )
                        .y(function(d) { return yScale(d.y) } );
                    compoundContourPath = compoundContourPath + contourPath(contourdata);
                });
                
                svg.select('.zeroVelocityCurve')
                    .selectAll(".zeroVelocityContourPath")            
                    .data([compoundContourPath])
                    .enter().append("path")
                        .classed('zeroVelocityContourPath', true)
                        .style("fill","black")
                        .style("fill-opacity",0.05)
                        .style("fill-rule","evenodd")
                        .style("stroke","gray")
                        .style("stroke-width","1px");
                svg.selectAll('.zeroVelocityContourPath')
                         .attr("d", compoundContourPath );
                svg.selectAll('.zeroVelocityContourPath')
                    .data([compoundContourPath])
                    .exit()
                    .remove();
            } else {
                svg.selectAll('.zeroVelocityContourPath')
                    .remove();                
            }
            
            // Lagrange points
            if (model.showLagrangePoints) {
                svg.select('.lagrangePoints')
                    .selectAll(".lagrangePoint")
                    .data(model.lagrangePoints)
                    .enter()
                    .append("svg:circle")
                        .classed("lagrangePoint", true)
                        .style("fill","gray")
                        .style("stroke","black")
                        .style("stroke-width","1px")
                        .attr("r","2px");                    
                svg.selectAll(".lagrangePoint").data(model.lagrangePoints)
                    .attr("cx", function(d) { return xScale(d.position.e(1)) })
                    .attr("cy", function(d) { return yScale(d.position.e(2)) });
                //svg.selectAll(".lagrangePoint").data(model.lagrangePoints).exit().remove();
            } else {
                svg.selectAll(".lagrangePoint").remove();                
            }
                        
            // Bodies
            var body = gCorotate.append("svg:g").classed("bodies", true)
                .selectAll('.body')
                .data(model.objects)
                .enter()
                .append("g")
                .classed('nBody', true);
            body.append('circle')
                .attr("fill", function(d,i) { return d.color})
                .attr("fill-opacity","0.25")
                .attr("stroke", function(d,i) { return d.color});
//                .call(dragbody);
            bodies = svg.selectAll('.nBody').data(model.objects);
            bodies.select('circle').transition().duration(transitionDuration)
                .attr("cx",function(d) { return xScale(d.position.e(1)) })
                .attr("cy",function(d) { return yScale(d.position.e(2)) })
                .attr("r",function(d) { return d3.max([xScale(radiusScale * Math.pow(d.mass,1/3))-xScale(0),4]); });
                                   
            // Velocity vectors
            body.append('line')
                .classed('nbodyvelocity', true)
                .attr("stroke",function(d,i) { return model.objects[i].color })
                .attr("stroke-opacity","1");

            var velocityVecs = bodies.select('line.nbodyvelocity').transition().duration(transitionDuration)
                .attr("x1",function(d) { return xScale(d.position.e(1)) })
            	.attr("y1",function(d) { return yScale(d.position.e(2)) });
            if (view.refFrame === "inertial") {
                velocityVecs
                    .attr("x2",function(d) { return xScale(d.position.e(1) + d.inertialVelocity.e(1) * velocityScale) })
                	.attr("y2",function(d) { return yScale(d.position.e(2) + d.inertialVelocity.e(2) * velocityScale) });
            } else {
                velocityVecs
                    .attr("x2",function(d) { return xScale(d.position.e(1) + d.velocity.e(1) * velocityScale) })
                	.attr("y2",function(d) { return yScale(d.position.e(2) + d.velocity.e(2) * velocityScale) });
            }
            	
            // Trails
            var trailOffset = model.trailRefObject.position.rotate(-model.rotationAngle,model.rotationLine);
            var orbitLineFunction = d3.svg.line()
                .x( function(d,i) { return xScale( d.e(1) - model.trailRefObject.inertialTrail[i].subtract(trailOffset).e(1)  ); } )
                .y( function(d,i) { return yScale( d.e(2) - model.trailRefObject.inertialTrail[i].subtract(trailOffset).e(2)  ); } )            
            
            body.append('path')
                .classed('threebodytrail trail', true)
                .attr("stroke",function(d,i) { return model.objects[i].color });

            if ( (view.refFrame === "inertial" && !model.corotateTrail) || (view.refFrame === "corotating" && model.corotateTrail) ) {
                bodies.select('.trail').transition().duration(transitionDuration)
                    .attrTween("transform", function tween(d, i, a) {
                        return d3.interpolateString( a, "rotate(" + (0) + "," + (xScale(0)) + "," + (yScale(0)) + ")"); })
                    .attr("d",function(d,i) { return orbitLineFunction(model.objects[i].corotatingTrail) } );
            } else {
                bodies.select('.trail').transition().duration(0.5*transitionDuration)
                    .attrTween("transform", function tween(d, i, a) {
                        return d3.interpolateString(a, "rotate(" + (-model.rotationAngle*180/Math.PI) + "," + (xScale(0)) + "," + (yScale(0)) + ")"); })
                    .attr("d",function(d,i) { return orbitLineFunction(model.objects[i].inertialTrail) } );
            }

            // Centre of mass
            gCentreOfMass = gPlotArea.append('g')
                .classed('centreOfMass', true);
            gCentreOfMass.append('circle') // Outer circle of centre of mass symbol
                .attr("cx", 0)
                .attr("cy", 0)
                .attr("r",comRadius)
                .style("stroke","black")
                .style("stroke-width","1px")
                .style("fill","white");
            gCentreOfMass.append('path') // First black corner of centre of mass symbol
                .attr('d',"M 0,0 L 0," + comRadius + " A " + comRadius + "," + comRadius + " 0 0,0 " + comRadius + ",0 L 0,0")
                .style('stroke','none')
                .style('fill','black');
            gCentreOfMass.append('path') // Second black corner of centre of mass symbol
                .attr('d',"M 0,0 L 0," + (-comRadius) + " A " + comRadius + "," + comRadius + " 0 0,0 " + (-comRadius) + ",0 L 0,0")
                .style('stroke','none')
                .style('fill','black');
                
            svg.select('g.centreOfMass')
                .attr("transform","translate(" + 
                    (xScale(0)) + "," + 
                    (yScale(0)) + ")");
            
            inTransition = false;    
        }); // End of selection.each(function(data)...
    }

    // Getter-setters of the properties
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

    return chart;

} // end of nBodyChart 

var element = d3.select("#threeBody");
var canvasSize = d3.min([element.node().offsetWidth,0.8*window.innerHeight]);
var myChart = nBodyChart()
    .canvasWidth(canvasSize)
    .canvasHeight(canvasSize);

function initialize() {
    model.initThreeBodyProblemMainBodies();
    model.initThreeBodyProblemThirdBody();
    setModel();
    var inTransition = false;    
    updateNeeded = true;    
}

function animate() {
    requestAnimationFrame( animate );
    if (animationRunning) {
        computeNextTimeStep();
        model.initThreeBodyProblemThirdBody()        
        setModel();
        d3.select("#threeBody").datum(model).call(myChart);
        updateOutput();
    } else {
        if (updateNeeded) {
            d3.select("#threeBody").datum(model).call(myChart);    
            updateOutput();
            updateNeeded = false;
        }
    }
}

initialize();
animate();