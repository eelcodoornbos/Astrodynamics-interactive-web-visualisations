// =============================================================================
// Model
// =============================================================================

    
var model = {
    centralBody: astro.earth,
    eccentricity: 0.85,
    semiLatusRectum: 6378+10000,
    numSteps: 360,
    maxCoordinate: 100000,
    trueAnomaly: 30*Math.PI/180,
    twoBodyData: [],
    
    init: function model_init() {
        var trueAnomaly;
        // Compute the minimum and maximum true anomaly
        if (model.eccentricity < 1) {
            model.minTrueAnomaly = -1 * Math.PI;
            model.maxTrueAnomaly = 1 * Math.PI;
        } else {
            model.maxTrueAnomaly = Math.acos(-1/model.eccentricity)/1.01;
            model.minTrueAnomaly = -1 * Math.acos(-1/model.eccentricity)/1.01;
        }
        model.angularMomentum = Math.sqrt(model.semiLatusRectum*model.centralBody.gravitationalParameter)

        // Compute the orbit trajectory
        for (i=0; i< model.numSteps; i++)
        {
            trueAnomaly = model.minTrueAnomaly + (i / model.numSteps) * (model.maxTrueAnomaly - model.minTrueAnomaly);
            model.twoBodyData[i] = {};
            model.twoBodyData[i].theta = trueAnomaly;
            model.twoBodyData[i].r = model.semiLatusRectum / (1 + model.eccentricity * Math.cos(model.twoBodyData[i].theta));
            model.twoBodyData[i].x = model.twoBodyData[i].r * Math.cos(model.twoBodyData[i].theta);
            model.twoBodyData[i].y = model.twoBodyData[i].r * Math.sin(model.twoBodyData[i].theta);                
        }
        
        // Compute the position of the current point
        model.computeCurrentDataFromTrueAnomaly(model.trueAnomaly);

        // Compute the perigee height
        model.perigeeHeight = model.semiLatusRectum * (1-model.eccentricity) / (1-Math.pow(model.eccentricity,2));

        // Set the minimum and maximum distances for scaling the plot
        model.yMin = -30000; model.yMax = 30000;
        model.xMin = -150000; model.xMax = 25000;
    },
    computeCurrentDataFromTrueAnomaly: function(trueAnomaly)
    {
        if (trueAnomaly < model.minTrueAnomaly) { trueAnomaly = model.minTrueAnomaly; }
        if (trueAnomaly > model.maxTrueAnomaly) { trueAnomaly = model.maxTrueAnomaly; }

        model.trueAnomaly = trueAnomaly;
        model.trueAnomalyDeg = model.trueAnomaly * 180 / Math.PI;
        model.r =  model.semiLatusRectum / 
            (1 + model.eccentricity * Math.cos(model.trueAnomaly));
        model.x = model.r * Math.cos(model.trueAnomaly);
        model.y = model.r * Math.sin(model.trueAnomaly); 
        model.radialVelocity = (model.centralBody.gravitationalParameter/model.angularMomentum)
                    * model.eccentricity * Math.sin(model.trueAnomaly);
        model.normalVelocity = (model.centralBody.gravitationalParameter/model.angularMomentum)
                    * (1 + model.eccentricity * Math.cos(model.trueAnomaly));
        model.velocity = Math.sqrt(Math.pow(model.normalVelocity,2) + Math.pow(model.radialVelocity,2));
        model.flightPathAngle = Math.atan((model.eccentricity * Math.sin(model.trueAnomaly)) / (1+model.eccentricity * Math.cos(model.trueAnomaly)));
        model.flightPathAngleDeg = model.flightPathAngle * 180 / Math.PI;
        model.escapeVelocity = Math.sqrt(2*model.centralBody.gravitationalParameter/model.r);
        model.circularVelocity = Math.sqrt(model.centralBody.gravitationalParameter/model.r);
    }
};

function conicSectionInputOutput() {
    
}

function conicSectionOrbit() {
    
}

function conicSectionHodograph() {
    
}

function conicSectionVelocityComponents() {

    function chart() {
        
        // Settings
        
        
        
        
        // =============================================================================
        // viewController
        // =============================================================================
        
        
        var viewController = {
            marginMin: { top: 40, right: 40, bottom: 40, left: 40},
            margin: { top: 50, right: 40, bottom: 50, left: 50 },
            orbitMaxWidthFraction: 0.5,
            hodographMaxWidthFraction: 0.4,
            arrowLength: 5,
            arrowWidth: 3,
            aspectRatio: 1.5,
            defaultVectorStrokeWidth: 3,
            outputs: [],
            
            init: function viewController_init() {
                // Get the element that should contain the SVG
                viewController.container = d3.select("#conic_section_velocity_components")
                    .style("position","relative"); // Position relative to be able to absolutely position the button
                viewController.controllerContainer = d3.select("#conic_section_velocity_components_controls");
                    
                viewController.canvasWidth = parseInt(viewController.container.style('width'), 10);
                viewController.canvasHeight = viewController.canvasWidth / viewController.aspectRatio;
        
                // Add the SVG
                viewController.svg = viewController.container.append("svg")
                    .attr("width", viewController.canvasWidth)
                    .attr("height", viewController.canvasHeight);
                viewController.addControls();              
                viewController.addMarkers();
        
                viewOrbit.init();
                viewHodograph.init();
            },
            updateOutput: function() {
                viewController.outputs.forEach(function(currentOutput) { // Loop over each of the outputs to display the current value
                    var currentValue = model[currentOutput.property] * currentOutput.multiplier;
                    d3.select('.' + currentOutput.property + '_value').html(currentOutput.prefix + 
                                currentValue.toFixed(currentOutput.digits) + currentOutput.units)
                });
            },
            addMarkers: function() {
                // Markers for arrowheads
                function addArrowMarker(config) {
                    var arrowPath = "M 0 0 " + config.arrowLength + " "+ config.arrowWidth  / 2 + " 0 "+ config.arrowWidth +" Z";
                    config.element.append("marker")
                        .attr("id",config.id)
                        .attr("markerWidth",config.arrowLength)
                        .attr("markerHeight",config.arrowWidth)
                        .attr("refX",config.arrowLength)
                        .attr("refY",config.arrowWidth/2)
                        .attr("orient","auto")
                        .append("path")
                            .attr("d",arrowPath); 
                }
                viewController.defs = viewController.svg.append("defs");
                addArrowMarker({element: viewController.defs, id:"velocityArrowHead", 
                    arrowLength: viewController.arrowLength, arrowWidth:viewController.arrowWidth });
                addArrowMarker({element: viewController.defs, id:"radialVelocityArrowHead", 
                    arrowLength: viewController.arrowLength, arrowWidth:viewController.arrowWidth });        
                addArrowMarker({element: viewController.defs, id:"normalVelocityArrowHead", 
                    arrowLength: viewController.arrowLength, arrowWidth:viewController.arrowWidth });
                addArrowMarker({element: viewController.defs, id:"trueAnomalyArrowHead", 
                    arrowLength: viewController.arrowLength, arrowWidth:viewController.arrowWidth });                    
                addArrowMarker({element: viewController.defs, id:"flightPathAngleArrowHead", 
                    arrowLength: viewController.arrowLength, arrowWidth:viewController.arrowWidth });
            },
            
            formatOutput: function formatOutput(input,value) {
                displayValue = value * input.multiplier;
                return input.prefix + displayValue.toFixed(input.digits) + input.units;
            },
                    
            addControls: function() {
        
                function addSlider(input) {
                    var value = parseFloat(model[input.property]);
        
                    var div = viewController.controllerContainer.append("div")
                        .classed('sliderController', true)
                        .attr('float','left');
        
                    var slider = div.append('input')
                        .classed(input.property, true)
                        .attr('type','range')
                        .attr('min',input.min)
                        .attr('max',input.max)
                        .attr('step',input.step)
                        .property('value',model[input.property]);
        
                    var label = div.append('span')
                        .classed('sliderAnnotation' + " " + input.property, true)
                        .html(input.label);
        
                    var valueSpan = label.append('span')
                        .classed('sliderValue' + " " + input.property + '_value', true)
                        .html(viewController.formatOutput(input,value));
        
                    slider.on('input', function() {
                            var value = parseFloat(slider.property('value'));
                            model[input.property] = value;
                            var displayValue = value * input.multiplier;
                            d3.select('.' + input.property + '_value').html(viewController.formatOutput(input,value));
                            model.init();
                            viewController.updateOutput();
                            viewOrbit.updateOrbit();
                            viewOrbit.updateSatellitePosition();
                            viewHodograph.updateOrbit();
                            viewHodograph.updateSatellitePosition();
                        } );
                }
        
                function addOutput(input) {
                    viewController.outputs.push(input);
                    var value = parseFloat(model[input.property]);
                    
                    var div = viewController.controllerContainer.append("div")
                        .classed('outputContainer', true)
                        .attr('float','left');
        
                    var label = div.append('span')
                        .classed('outputAnnotation' + " " + input.property, true)
                        .html(input.label);
        
                    var valueSpan = label.append('span')
                        .classed('outputValue' + " " + input.property + '_value', true)
                        .html(viewController.formatOutput(input,value));
                }
                
                function addHeader(input) {
                    var div = viewController.controllerContainer.append("div")
                        .classed('headerInputOutput', true)
                        .attr('float','left')
                    var label = div.append('span')
                        .html(input.label);
                }        
                
                addHeader({ label: "Inputs:"} );
                
                addSlider({ label: "Semi latus rectum", 
                            property: "semiLatusRectum", 
                            prefix: "p = ",
                            multiplier: 1,                  
                            units: " km",
                            min: 100, 
                            max: 40000, 
                            step: 200, 
                            digits: 0 });
                            
                addSlider({ label: "Eccentricity",
                            property: "eccentricity",
                            prefix: "e = ",
                            multiplier: 1,
                            units: "",
                            min: 0,
                            max: 2,
                            step: 0.01,
                            digits: 2 });
        
                addSlider({ label: "True anomaly",
                            property: "trueAnomaly",
                            prefix: "𝜃 = ",
                            multiplier: 180 / Math.PI,
                            units: "˚",
                            min: -Math.PI,
                            max: Math.PI,
                            step: 1.0e-09,
                            digits: 1 });
                            
                addHeader({ label: "Outputs:"} );                    
                
                addOutput({ label: 'Velocity',
                            property: 'velocity',
                            prefix: 'V = ',
                            multiplier: 1,
                            units: ' km/s',
                            digits: 2 });
                            
                addOutput({ label: 'Radial velocity',
                            property: 'radialVelocity',
                            prefix: 'Vr = ',
                            multiplier: 1,
                            units: ' km/s',
                            digits: 2 });
                            
                addOutput({ label: 'Normal velocity',
                            property: 'normalVelocity',
                            prefix: 'Vn = ',
                            multiplier: 1,
                            units: ' km/s',
                            digits: 2 });                        
                            
                addOutput({ label: 'Flight path angle',
                            property: 'flightPathAngle',
                            prefix: '𝛾 = ',
                            multiplier: 180/Math.PI,
                            units: '˚',
                            digits: 1 });  
        
                addOutput({ label: 'Radius',
                            property: 'r',
                            prefix: 'r = ',
                            multiplier: 1,
                            units: 'km',
                            digits: 0 });                    
                                                  
            },
            scaleArrowStyle: function scaleArrowStyle(element,length) {
                // Scales down the linewidth of a vector 
                // if the length is shorter than the length of the arrowhead.
                var linewidth;
                if (Math.abs(length) < viewController.arrowLength * viewController.defaultVectorStrokeWidth)
                {
                    linewidth = Math.abs(length) / (viewController.arrowLength) + "px";
                } 
                else 
                {
                    linewidth = viewController.defaultVectorStrokeWidth + "px";
                }
                element.style("stroke-width",linewidth);
            }
        };
        
        // =============================================================================
        // viewOrbit
        // =============================================================================
        
        var viewOrbit = {
            init: function viewOrbit_init() {
                viewOrbit.graph = viewController.svg.append("g");
                viewOrbit.setOrbitPlotGeometry();
                viewOrbit.setScale();
                viewOrbit.addOrbit();
                viewOrbit.addSatellite();
                viewOrbit.updateOrbit();
                viewOrbit.updateSatellitePosition(model.currentData);
            },
            
            setOrbitPlotGeometry: function setOrbitPlotGeometry() 
            {
                var dataAspectRatio = (model.xMax - model.xMin) / (model.yMax - model.yMin);
                // Assume data is very tall (hyperbolic orbit)
                viewController.plotHeight = viewController.canvasHeight - viewController.marginMin.top - viewController.marginMin.bottom;
                viewController.plotWidth = dataAspectRatio * viewController.plotHeight;
                if (viewController.plotWidth > ( (viewController.canvasWidth - viewController.marginMin.left - viewController.marginMin.right) * viewController.orbitMaxWidthFraction)) 
                { 
                    // Plot is very wide (elliptical orbit)
                    viewController.plotWidth = ( viewController.canvasWidth - viewController.marginMin.left - viewController.marginMin.right) * viewController.orbitMaxWidthFraction;
                    viewController.plotHeight = viewController.plotWidth * (1 / dataAspectRatio);
                    viewController.margin.left = viewController.marginMin.left;
                    viewController.margin.right = viewController.marginMin.right;
                    viewController.margin.top = (viewController.canvasHeight - viewController.plotHeight) / 2;
                    viewController.margin.bottom = viewController.margin.top;
        //            viewController.margin.top = viewController.marginMin.top;
                }
                else 
                {
                    viewController.margin.top = viewController.marginMin.top;
                    viewController.margin.bottom = viewController.marginMin.bottom;
                    viewController.margin.left = viewController.marginMin.left;
                    viewController.margin.right = viewController.marginMin.right;
                } 
                viewOrbit.graph.attr("transform", "translate(" + viewController.margin.left + "," + viewController.margin.top + ")");        
            },
            
            setScale: function setScale() {
                viewOrbit.xScale = d3.scale.linear().range([0,  viewController.plotWidth]).domain([model.xMin,model.xMax]);
                viewOrbit.yScale = d3.scale.linear().range([viewController.plotHeight, 0]).domain([model.yMin,model.yMax]);
                viewOrbit.plotScale = (viewController.plotWidth)/(model.xMax - model.xMin);
                viewOrbit.velocityScale = 200/16; // 200 pixels for 16 km/s
            },
            
            addOrbit: function() 
            {
                // Central body
                viewOrbit.centralBody = viewOrbit.graph.append("circle")
                	.classed('centralBody', true)
        
                // X-axis line    
                viewOrbit.xAxis = viewOrbit.graph.append("line")
                    .classed('orbitAxis', true);
        
                // Y-axis line
                viewOrbit.yAxis = viewOrbit.graph.append("line")
                    .classed('orbitAxis', true);
        
                // Orbit
                viewOrbit.orbit = viewOrbit.graph.append("path")
                    .classed('orbit', true);
            },
            
            addSatellite: function() 
            {
                viewOrbit.satellite = viewOrbit.graph.append("g");
        
                viewOrbit.satRadius = viewOrbit.graph.append("line")
                    .classed("satRadius", true)
                    .attr("id","satradius")
                    .attr("x1",viewOrbit.xScale(0))
                    .attr("y1",viewOrbit.yScale(0));            
        
                viewOrbit.flightPathAngle = viewOrbit.satellite.append("path")
                    .classed("flightPathAngle", true);
        
                viewOrbit.satRadialVelocity = viewOrbit.satellite.append("line")
                    .classed("radialVelocity", true)
                    .attr("x1",0)
                    .attr("y1",0)
                    .attr("y2",0);
        
                viewOrbit.satNormalVelocity = viewOrbit.satellite.append("line")
                    .classed("normalVelocity", true)
                    .attr("x1",0)
                    .attr("y1",0)
                    .attr("x2",0);
        
                viewOrbit.satRadialVelocityHelper = viewOrbit.satellite.append("line")
                    .classed("velocityHelper", true);
        
                viewOrbit.satNormalVelocityHelper = viewOrbit.satellite.append("line")
                    .classed("velocityHelper", true);
        
                viewOrbit.satVelocity = viewOrbit.satellite.append("line")
                    .classed("velocity",true)
                    .attr("x1",0)
                    .attr("y1",0)
                    .attr("y2",0);
        
                viewOrbit.trueanomaly = viewOrbit.graph.append("path")
                    .classed("trueAnomaly", true);
        
                viewOrbit.satCircle = viewOrbit.satellite.append("circle")
                    .classed("satcircle", true)
            		.attr("r",5);
        
                viewOrbit.hodographCircle = viewOrbit.satellite.append("circle")
                    .classed('hodographCircle', true);
                    
            },    
            updateSatellitePosition: function updateSatellitePosition() {
                        
                d3.select("#v").html(model.velocity.toFixed(1));
                d3.select("#vr").html(model.radialVelocity.toFixed(1));
                d3.select("#vtheta").html(model.normalVelocity.toFixed(1));        
        
                // Set up transformations
                var transformPosition = "translate(" + viewOrbit.xScale(model.x) + "," + viewOrbit.yScale(model.y) + ")";
                var transformVelocity = "rotate("+ (-1*(model.trueAnomalyDeg+90-model.flightPathAngleDeg)) +")";
                var transformRadialVelocity = "rotate("+ (-1*model.trueAnomalyDeg) +")";
                
                // Satellite position and radius fom central body
                viewOrbit.satellite
                    .attr("transform",transformPosition);
                viewOrbit.satRadius
                    .attr("x1",viewOrbit.xScale(0))
                    .attr("y1",viewOrbit.yScale(0))
                    .attr("x2",viewOrbit.xScale(model.x))
                    .attr("y2",viewOrbit.yScale(model.y));
        
                // Velocity vector and orthogonal components
                viewOrbit.satVelocity
                    .attr("x2",model.velocity * viewOrbit.velocityScale)
                    .attr("transform",transformVelocity);
                viewController.scaleArrowStyle(viewOrbit.satVelocity,model.velocity*viewOrbit.velocityScale);
        
                viewOrbit.satRadialVelocity
                    .attr("x2",model.radialVelocity * viewOrbit.velocityScale)
                    .attr("transform",transformRadialVelocity);
                viewController.scaleArrowStyle(viewOrbit.satRadialVelocity,model.radialVelocity*viewOrbit.velocityScale);
        
                viewOrbit.satNormalVelocity
                    .attr("y2",-1 * (model.normalVelocity * viewOrbit.velocityScale))
                    .attr("transform",transformRadialVelocity);
                viewController.scaleArrowStyle(viewOrbit.satNormalVelocity,model.normalVelocity*viewOrbit.velocityScale);            
        
                // Dashed helper lines for velocity components
                viewOrbit.satRadialVelocityHelper
                    .attr("x1",0)
                    .attr("y1",-1 * (model.normalVelocity * viewOrbit.velocityScale))
                    .attr("x2",model.radialVelocity * viewOrbit.velocityScale)
                    .attr("y2",-1 * (model.normalVelocity * viewOrbit.velocityScale))
                    .attr("transform",transformRadialVelocity);
        
                viewOrbit.satNormalVelocityHelper
                    .attr("x1",model.radialVelocity * viewOrbit.velocityScale)
                    .attr("y1",0)
                    .attr("x2",model.radialVelocity * viewOrbit.velocityScale)
                    .attr("y2",-1 * (model.normalVelocity * viewOrbit.velocityScale))
                    .attr("transform",transformRadialVelocity);
        
                // Flight path angle
                var endAngle = -model.trueAnomaly+3/2*Math.PI;
                var startAngle = -model.trueAnomaly+3/2*Math.PI+model.flightPathAngle;
                viewOrbit.flightPathAngle
                    .attr("d",anglesToClosedArcPath(function(d){return d;},function(d){return d;},0,0,30,startAngle,endAngle,1,0));
        
                // True anomaly angle
                var trueAnomaly = model.trueAnomaly;
                if (trueAnomaly < 0) { trueAnomaly += Math.PI * 2;}
                viewOrbit.trueanomaly
                    .attr("d",anglesToClosedArcPath(viewOrbit.xScale,viewOrbit.yScale,0,0,model.centralBody.radius*0.8,0,trueAnomaly,0,0));
                    
                var hodographCenter = model.centralBody.gravitationalParameter/model.angularMomentum;
                var hodographRadius = model.centralBody.gravitationalParameter*model.eccentricity/model.angularMomentum
                viewOrbit.hodographCircle
                    .attr("transform",transformRadialVelocity)
                    .attr("cx",0)
                    .attr("cy",-1 * hodographCenter * viewOrbit.velocityScale)
                    .attr("r",hodographRadius * viewOrbit.velocityScale);
                    
                    
            },    
            updateOrbit: function() {
                d3.select("#e").html(model.eccentricity.toFixed(2));
                d3.select("#rp").html(model.perigeeHeight.toFixed(1));
                
                viewOrbit.centralBody
                    .attr("cx",viewOrbit.xScale(0))
                	.attr("cy",viewOrbit.yScale(0))
                	.attr("r",viewOrbit.plotScale*model.centralBody.radius);
        
                viewOrbit.xAxis
                    .attr("x1",viewOrbit.xScale(model.xMin)-viewController.marginMin.left)
                    .attr("y1",viewOrbit.yScale(0))
                    .attr("x2",viewOrbit.xScale(model.xMax)+viewController.marginMin.left)
                    .attr("y2",viewOrbit.yScale(0));
        
                viewOrbit.yAxis
                    .attr("x1",viewOrbit.xScale(0))
                    .attr("y1",viewOrbit.yScale(model.yMin)+viewController.marginMin.top)
                    .attr("x2",viewOrbit.xScale(0))
                    .attr("y2",viewOrbit.yScale(model.yMax)-viewController.marginMin.top);
        
                if (model.eccentricity < 1)
                {
                    viewOrbit.orbit.attr("d",viewOrbit.orbitLineFunction(model.twoBodyData) + "Z");
                } else {
                    viewOrbit.orbit.attr("d",viewOrbit.orbitLineFunction(model.twoBodyData));            
                }
            },
            
            orbitLineFunction: d3.svg.line()
                        .x( function (d) { return (viewOrbit.xScale(d.x)); } )
                        .y( function (d) { return (viewOrbit.yScale(d.y)); } )
                        
        };
        
        // =============================================================================
        // viewHodograph
        // =============================================================================
        
        
        var viewHodograph = {
            init: function() {
                viewHodograph.graph = viewController.svg.append("g");
                viewHodograph.clippedCanvas = viewHodograph.graph.append("g")
                    .classed("hodographClippedCanvas", true);
                viewHodograph.hodographHeight = 0.5 * (viewController.canvasHeight - viewController.marginMin.top - viewController.marginMin.bottom);
                viewHodograph.hodographWidth = viewHodograph.hodographHeight * 16/12;
                if (viewHodograph.hodographWidth > viewController.hodographMaxWidthFraction * viewController.canvasWidth) 
                {
                    viewHodograph.hodographWidth = viewController.hodographMaxWidthFraction * viewController.canvasWidth;
                    viewHodograph.hodographHeight = viewHodograph.hodographWidth * 12/16;
                }
                    
                viewHodograph.xScale = d3.scale.linear().range([0,viewHodograph.hodographWidth]).domain([-8,8]);
                viewHodograph.yScale = d3.scale.linear().range([viewHodograph.hodographHeight,0]).domain([0,12]);
                // Clipping path
                viewController.defs.append("svg:clipPath").attr("id","cliphodograph").append("svg:rect")
                    .attr("x",viewHodograph.xScale(-8))
                    .attr("y",viewHodograph.yScale(12))
                    .attr("width",viewHodograph.xScale(8)-viewHodograph.xScale(-8))
                    .attr("height",viewHodograph.yScale(0)-viewHodograph.yScale(12));
        
                viewHodograph.graph.attr("transform", 
                                                  "translate(" + (viewController.canvasWidth - viewController.marginMin.right - viewHodograph.hodographWidth) + "," +
                                                                  viewController.marginMin.top + ")");
                viewHodograph.addAxes();
                viewHodograph.addOrbit();
                viewHodograph.updateOrbit();
                viewHodograph.addSatellite();
                viewHodograph.updateSatellitePosition();
            },
            addAxes: function()
            {
                var xAxisHodograph = d3.svg.axis() 
                  .scale(viewHodograph.xScale)
                  .tickValues([-8, -6,-4,-2, 0, 2, 4, 6, 8])
                  .orient("bottom");
                viewHodograph.graph.append('svg:g') // Axes and annotation should not be clipped, so append to graph instead of clippedCanvas
                  .classed('x axis', true)
                  .attr('transform', 'translate(' + (0) + ',' + (viewHodograph.hodographHeight) + ')')
                  .call(xAxisHodograph);
                  
                var yAxisHodograph = d3.svg.axis()
                  .scale(viewHodograph.yScale)
                  .tickValues([2,4,6,8,10,12])
                  .orient("left");
                viewHodograph.graph.append('svg:g')
                  .classed('y axis', true)
                  .attr('transform', 'translate(' + (0.5*viewHodograph.hodographWidth) + ',' + (0) + ')')
                  .call(yAxisHodograph);              
        
                viewHodograph.graph.append('svg:text')
                    .classed('axis label', true)
                    .attr("x", viewHodograph.xScale(8) )
                    .attr("y", viewHodograph.yScale(0) + 35)
                    .style("text-anchor", "end")
                    .text("Radial velocity (km/s)");
        
                viewHodograph.graph.append('svg:text')
                    .classed('axis label', true)
                    .attr("x", viewHodograph.xScale(0) )
                    .attr("y", viewHodograph.yScale(12) - 15)
                    .style("text-anchor", "middle")
                    .text("Normal velocity (km/s)");
                    
            },
        
            addOrbit: function() 
            {
                viewHodograph.hodographCircle = viewHodograph.clippedCanvas.append("svg:circle")
                    .classed('hodographCircle', true)
                    .attr("cx",viewHodograph.xScale(0));
                viewHodograph.trueAnomaly = viewHodograph.clippedCanvas.append("path")
                    .classed('trueAnomaly', true)
                    .attr("transform","rotate(-90,"+ viewHodograph.xScale(0) + "," + viewHodograph.yScale(viewHodograph.hodographCenter) + ")");
        
            },
        
            addSatellite: function() 
            {
                viewHodograph.escapeVelocityHodograph = viewHodograph.clippedCanvas.append("circle")
                    .classed('escapeVelocity', true)
                    .attr("cx",viewHodograph.xScale(0))
                    .attr("cy",viewHodograph.yScale(0))
                    .style("visibility","hidden");
                    
                viewHodograph.flightPathAngle = viewHodograph.clippedCanvas.append("path")
                    .classed('flightPathAngle', true);
        
                viewHodograph.velocityRadius = viewHodograph.clippedCanvas.append("line")
                    .classed('satRadius', true);
        
                viewHodograph.satRadialVelocity = viewHodograph.graph.append("g").append("line")
                    .classed('radialVelocity', true)
                    .attr("x1",viewHodograph.xScale(0))
                    .attr("y1",viewHodograph.yScale(0))
                    .attr("y2",viewHodograph.yScale(0));
        
                viewHodograph.satNormalVelocity = viewHodograph.clippedCanvas.append("g").append("line")
                    .classed('normalVelocity', true)
                    .attr("x1",viewHodograph.xScale(0))
                    .attr("y1",viewHodograph.yScale(0))
                    .attr("x2",viewHodograph.xScale(0))
        
                viewHodograph.satRadialVelocityHelper = viewHodograph.clippedCanvas.append("line")
                    .classed('velocityHelper', true);
        
                viewHodograph.satNormalVelocityHelper = viewHodograph.clippedCanvas.append("line")
                    .classed('velocityHelper', true);
        
                viewHodograph.satVelocity = viewHodograph.clippedCanvas.append("line")
                    .classed('velocity', true)
                    .attr("x1",viewHodograph.xScale(0))
                    .attr("y1",viewHodograph.yScale(0));            
        
                viewHodograph.circularVelocityHodograph = viewHodograph.clippedCanvas.append("circle")
                    .classed('circularVelocity', true)
                    .attr("cx",viewHodograph.xScale(0))
                    .attr("r",4);            
        
                viewHodograph.hodographOrigin = viewHodograph.graph.append("circle") // Origin should not be clipped, so append to graph instead of clippedCanvas
                    .classed('satCircle', true)
            		.attr("r",5)
                    .attr("cx",viewHodograph.xScale(0))
                    .attr("cy",viewHodograph.yScale(0));
            },  
              
            updateSatellitePosition: function updateSatellitePosition() 
            {        
                viewController.scaleArrowStyle(viewHodograph.satRadialVelocity,viewHodograph.xScale(model.radialVelocity)-viewHodograph.xScale(0));
                viewController.scaleArrowStyle(viewHodograph.satNormalVelocity,viewHodograph.yScale(model.normalVelocity)-viewHodograph.yScale(0));
                viewController.scaleArrowStyle(viewHodograph.satVelocity,
                    Math.sqrt(  Math.pow(viewHodograph.xScale(model.radialVelocity)-viewHodograph.xScale(0),2) +
                                Math.pow(viewHodograph.yScale(model.normalVelocity)-viewHodograph.yScale(0),2) ));
                viewHodograph.satRadialVelocity
                    .attr("x2",viewHodograph.xScale(model.radialVelocity ));
                viewHodograph.satNormalVelocity
                    .attr("y2",viewHodograph.yScale(model.normalVelocity ));            
                viewHodograph.satVelocity
                    .attr("x2",viewHodograph.xScale(model.radialVelocity))
                    .attr("y2",viewHodograph.yScale(model.normalVelocity));
                viewHodograph.satRadialVelocityHelper
                    .attr("x1",viewHodograph.xScale(0))
                    .attr("y1",viewHodograph.yScale(model.normalVelocity))
                    .attr("x2",viewHodograph.xScale(model.radialVelocity))
                    .attr("y2",viewHodograph.yScale(model.normalVelocity));
                viewHodograph.satNormalVelocityHelper
                    .attr("x1",viewHodograph.xScale(model.radialVelocity))
                    .attr("y1",viewHodograph.yScale(0))
                    .attr("x2",viewHodograph.xScale(model.radialVelocity))
                    .attr("y2",viewHodograph.yScale(model.normalVelocity));
        
                viewHodograph.circularVelocityHodograph
                    .attr("cy",viewHodograph.yScale(model.circularVelocity))
        
                viewHodograph.escapeVelocityHodograph
                    .attr("r",viewHodograph.yScale(0)-viewHodograph.yScale(model.escapeVelocity));
        
                viewHodograph.flightPathAngle
                    .attr("d",anglesToClosedArcPath(viewHodograph.xScale,viewHodograph.yScale,0,
                        0,1.6,Math.PI/2,Math.PI/2-model.flightPathAngle,0,0));
        
                var trueAnomaly = model.trueAnomaly;
                var fliplargearc = 0;
                if (trueAnomaly < 0) { trueAnomaly += Math.PI * 2;}
                if (trueAnomaly > Math.PI) { fliplargearc = 1; }
                var startangle = 0;
                var endangle = -trueAnomaly;
        
                viewHodograph.trueAnomaly
                    .attr("d",anglesToClosedArcPath(viewHodograph.xScale,viewHodograph.yScale,0,
                        viewHodograph.hodographCenter,1,startangle,endangle,0,fliplargearc));
        
                viewHodograph.velocityRadius
                    .attr("x1",viewHodograph.xScale(0))
                    .attr("y1",viewHodograph.yScale(viewHodograph.hodographCenter))
                    .attr("x2",viewHodograph.xScale(model.radialVelocity))
                    .attr("y2",viewHodograph.yScale(model.normalVelocity));
            },
                   
            updateOrbit: function() {
                viewHodograph.hodographCenter = model.centralBody.gravitationalParameter/model.angularMomentum;
                viewHodograph.hodographRadius = model.centralBody.gravitationalParameter*model.eccentricity/model.angularMomentum
                viewHodograph.hodographCircle
                    .attr("cy",viewHodograph.yScale(viewHodograph.hodographCenter))
                    .attr("r",viewHodograph.xScale(viewHodograph.hodographRadius)-viewHodograph.xScale(0));
                viewHodograph.trueAnomaly
                    .attr("transform","rotate(-90,"+ viewHodograph.xScale(0) + "," + viewHodograph.yScale(viewHodograph.hodographCenter) + ")");
                    
            },
            
            hodographLineFunction: d3.svg.line()
                        .x( function (d) { return (viewHodograph.xScale(d.radialVelocity)); } )
                        .y( function (d) { return (viewHodograph.yScale(d.normalVelocity)); } )
        
        };
            
        viewController.init();
    }
    return chart;
    
};
model.init();
var myChart = conicSectionVelocityComponents();
myChart();

