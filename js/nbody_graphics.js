function nBodyChart() 
{
    // Properties
    var canvasWidth = 500;
    var canvasHeight = 500;
    var margin = { top: 20, right: 20, bottom: 50, left: 50};
    var xScale = d3.scale.linear();
    var yScale = d3.scale.linear();
    var velocityScale = 50;
    var accelerationScale = 40000;
    var radiusScale = 3;
    var comRadius = 5;
    
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
    chart.accelerationScale = function(value) {
        if (!arguments.length) return accelerationScale;
        accelerationScale = value;
        return chart;
    };
    chart.velocityScale = function(value) {
        if (!arguments.length) return velocityScale;
        velocityScale = value;
        return chart;
    };

    // Behaviours
    var dragbody = d3.behavior.drag()
        .origin( function(d) { return { x: xScale(d.position.e(1)), y: yScale(d.position.e(2)) } } )
        .on("drag", function(d,i) {
            model.keepTrails = false;
            model.eraseTrails();
            var draggedPosition = Vector.create( [xScale.invert(d3.event.x), yScale.invert(d3.event.y), 0] );
            model.objects[i].position = draggedPosition;
            setModel();
            updateNeeded = true;
            model.keepTrails = true;

        });
    
    var dragvelocity = d3.behavior.drag()
        .on("drag", function(d,i) {
            model.objects[i].velocity = Vector.create(
            [ (xScale.invert(d3.event.x)-model.objects[i].displayPosition.e(1))/velocityScale + model.referenceObject.velocity.e(1),
              (yScale.invert(d3.event.y)-model.objects[i].displayPosition.e(2))/velocityScale + model.referenceObject.velocity.e(2),
              0 ]);
            setModel();
            updateNeeded = true;
        });

    
    // Chart function that can be called on a DOM element to draw the SVG chart
    function chart(selection) {
        
        // Set the transition duration
        var transitionDuration;
        if (inTransition) { 
            transitionDuration = 1000;
        } else {
            transitionDuration = 0;
        }        

        // Loop over the DOM elements to which the chart can be added
        selection.each(function(data) { // "this" now refers to the DOM element to which the SVG chart is added

            // Investigate proportions of plot
            var plotHeight = canvasHeight - margin.top - margin.bottom;
            var plotWidth = canvasWidth - margin.left - margin.right;
         
            // chartRangeOffset is used to keep the viewport centred on the centre of mass, in inertial view
                // zeroObject is a virtual object that always stays at the origin of the inertial reference frame
                // If the reference frame is centred on any other object, 
                // there is no need to change the centring of the viewport
            var chartRangeOffset = {};
            if (model.referenceObject === model.zeroObject) { 
                chartRangeOffset.x = model.com.position.e(1);
                chartRangeOffset.y = model.com.position.e(2);
            } else {
                chartRangeOffset.x = 0;
                chartRangeOffset.y = 0;
            }

            // Set the scales
            xScale.range([0,  plotWidth]).domain([-model.zoomLevel+chartRangeOffset.x,model.zoomLevel+chartRangeOffset.x]);
            yScale.range([plotHeight, 0]).domain([-model.zoomLevel+chartRangeOffset.y,model.zoomLevel+chartRangeOffset.y]);

            var orbitLineFunction = d3.svg.line()
                .x( function(d) { return (xScale(d.e(1))); } )
                .y( function(d) { return (yScale(d.e(2))); } );

            // Select SVG, if it exists, and bind the data
            var svg = d3.select(this).selectAll("svg").data([data]);
            
            // Otherwise, create the svg for the skeletal chart
            var svgEnter = svg.enter().append("svg")
                .attr("preserveAspectRatio", "xMinYMin meet")
                .style("position","relative")
                .classed('nbody', true);

            // Update the outer dimensions.
            svg .attr("width", canvasWidth)
                .attr("height", canvasHeight);                

            // Update the inner dimensions
            var gUpdate = svg.select('g')
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");        

            // First, add the defs
            var defs = svgEnter.append("defs");
            addArrowMarker({element: defs, id:"velocityArrowHead", arrowLength: 5, arrowWidth:3});
            addArrowMarker({element: defs, id:"accelerationArrowHead", arrowLength: 5, arrowWidth:3});

            // Next, add the group to translate for the margins
            var gEnter = svgEnter.append("g");
            
            // X axis
            var xAxis = d3.svg.axis() 
                .scale(xScale)
                .ticks(5)
                .orient("bottom");
            gEnter.append('svg:g') // Axes and annotation should not be clipped, so append to graph instead of clippedCanvas
                .classed('x axis', true)
                .attr('transform', 'translate(' + (0) + ',' + yScale(0) + ')')
                .call(xAxis);
            gUpdate.select('.x.axis')
                .transition()
                .duration(transitionDuration)
                .attr('transform', 'translate(' + (0) + ',' + (plotHeight) + ')')
                .call(xAxis);

            // Y axis
            var yAxis = d3.svg.axis()
              .scale(yScale)
              .ticks(5)
              .orient("left");
            gEnter.append('svg:g')
              .classed('y axis', true)
              .attr('transform', 'translate(' + xScale(0) + ',' + (0) + ')')
              .call(yAxis);              
            gUpdate.select('.y.axis')
                .transition()
                .duration(transitionDuration)
                .each("end", function() 
                {
                    if (animationInterrupted) { 
                        startStopAnimation(); animationInterrupted = false;
                    }
                })
                .attr('transform', 'translate(' + (0) + ',' + (0) + ')')
                .call(yAxis);              

            if (model.showSphereOfInfluence) {
                gUpdate.selectAll('.sphereOfInfluence').data(model.objects).enter()
                    .append("circle")
                    .classed('sphereOfInfluence', true)
                    .attr("fill", function(d,i) { return d.color} )
                    .attr("opacity",0.05)
                    .attr("stroke", "black")
                    .attr("stroke-width","1px")
                    
                gUpdate.selectAll('.sphereOfInfluence')
                        .attr("cx", function(d) { return xScale(d.displayPosition.e(1)) } )
                        .attr("cy", function(d) { return yScale(d.displayPosition.e(2)) } )
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


            // Grid
            var horizontalGridLines = gridLines().orient("horizontal").ticks(5).xScale(xScale).yScale(yScale);
            gUpdate.call(horizontalGridLines);
            var verticalGridLines = gridLines().orient("vertical").ticks(5).xScale(xScale).yScale(yScale);
            gUpdate.call(verticalGridLines);
            
            // Bodies
            var bodies = gEnter.selectAll('.body').data(model.objects).enter();
            var body = bodies
                .append("g")
                .classed('nBody', true);
            body.append('circle')
                .attr("fill", function(d,i) { return d.color})
                .attr("fill-opacity","0.25")
                .attr("stroke","none")
                .call(dragbody);
            bodies = gUpdate.selectAll('.nBody').data(model.objects);
            bodies.select('circle').transition().duration(transitionDuration)
                .attr("cx",function(d) { return xScale(d.displayPosition.e(1)) })
                .attr("cy",function(d) { return yScale(d.displayPosition.e(2)) })
                .attr("r",function(d) { return d3.max([xScale(radiusScale * Math.pow(d.mass,1/2))-xScale(0),5]); });
                                   
            // Velocity vectors
            if (model.showVelocities) {
                bodies.append('line')
                    .classed('nbodyvelocity', true)
                    .attr("stroke",function(d,i) { return model.objects[i].color })
                    .attr("stroke-opacity","1")
                    .call(dragvelocity);
                var velocityVecs = bodies.select('line.nbodyvelocity').transition().duration(transitionDuration)
                    .attr("x1",function(d) { return xScale(d.displayPosition.e(1)) })
                	.attr("y1",function(d) { return yScale(d.displayPosition.e(2)) })
                    .attr("x2",function(d) { return xScale(d.displayPosition.e(1) + d.displayVelocity.e(1) * velocityScale) })
                	.attr("y2",function(d) { return yScale(d.displayPosition.e(2) + d.displayVelocity.e(2) * velocityScale) });
            } else {
                bodies.select('line.nbodyvelocity').remove();                
            }

            // Acceleration
            if (model.showAccelerations) {
                bodies.append('line')
                    .classed('acceleration', true)
                    .attr("stroke",function(d,i) { return model.objects[i].color })
                    .attr("stroke-opacity","0.5");                    ;
                var accelerationVecs = bodies.select('line.acceleration').transition().duration(transitionDuration)
                    .attr("x1",function(d) {return xScale(d.displayPosition.e(1))})
                    .attr("y1",function(d) {return yScale(d.displayPosition.e(2))})
                    .attr("x2",function(d) {return xScale(d.displayPosition.e(1) + d.acceleration.e(1) * accelerationScale) })
                    .attr("y2",function(d) {return yScale(d.displayPosition.e(2) + d.acceleration.e(2) * accelerationScale) });
                accelerationVecs.each( function(d,i) {
                    scaleArrowStyle(
                        d3.select(this),
                        Math.sqrt(
                            Math.pow(xScale(model.objects[i].acceleration.e(1))-xScale(0),2) + 
                            Math.pow(yScale(model.objects[i].acceleration.e(2))-yScale(0),2)
                        ) * accelerationScale,
                        4,
                        2);
                } );            
            } else {
                bodies.select('line.acceleration').remove();
            }

            // Trails
            body.append('path')
                .classed('trail', true)
                .attr("stroke",function(d,i) { return model.objects[i].color });
            bodies.select('.trail').transition().duration(transitionDuration)
                .attr("d",function(d,i) { return orbitLineFunction(model.objects[i].displayTrail) } );
            
            // Centre of mass
            centreOfMassGroup = gEnter.append('g')
                .classed('centreOfMass', true);
            centreOfMassGroup.append('circle')
                .attr("cx",0)
                .attr("cy",0)
                .attr("r",comRadius)
                .style("stroke","black")
                .style("stroke-width","1px")
                .style("fill","white");
            centreOfMassGroup.append('path')
                .attr('d',"M 0,0 L 0," + comRadius + " A " + comRadius + "," + comRadius + " 0 0,0 " + comRadius + ",0 L 0,0")
                .style('stroke','none')
                .style('fill','black');
            centreOfMassGroup.append('path')
                .attr('d',"M 0,0 L 0," + (-comRadius) + " A " + comRadius + "," + comRadius + " 0 0,0 " + (-comRadius) + ",0 L 0,0")
                .style('stroke','none')
                .style('fill','black');
                
            gUpdate.select('g.centreOfMass').transition().duration(transitionDuration)
                .attr("transform","translate(" + 
                    (xScale(model.com.displayPosition.e(1))) + "," + 
                    (yScale(model.com.displayPosition.e(2))) + ")");
            
            inTransition = false;    
        }); // End of selection.each(function(data)...
    }
    return chart;

} // end of nBodyChart 


var element = d3.select("#nbody");
var canvasSize = d3.min([element.node().offsetWidth,1*window.innerHeight]);
var myChart = nBodyChart()
    .canvasWidth(canvasSize)
    .canvasHeight(canvasSize)
    .accelerationScale(50000)
    .velocityScale(100);

function initialize() {
    model.initialize();
    setModel();
    setViewLock();
    d3.select("#nbody").datum(model).call(myChart);    
}

function animate() {
    requestAnimationFrame( animate );
    if (animationRunning) {
        model.time += model.stepSize;
        computeNextTimeStep();
        setModel();        
        d3.select("#nbody").datum(model).call(myChart);
        updateOutput();
    } else {
        if (updateNeeded) {
            d3.select("#nbody").datum(model).call(myChart);    
            updateOutput();
            updateNeeded = false;
        }
    }
}

initialize();
animate();