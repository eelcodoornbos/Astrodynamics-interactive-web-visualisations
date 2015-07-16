// =============================================================================
// Model
// =============================================================================

    
var model = {
    centralBody: astro.earth,
    eccentricity: 1.33,
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
            model.maxTrueAnomaly = Math.acos(-1/model.eccentricity);
            model.minTrueAnomaly = -1 * Math.acos(-1/model.eccentricity);
        }
        model.angularMomentum = Math.sqrt(model.semiLatusRectum*model.centralBody.gravitationalParameter)

        // Compute the orbit trajectory
        for (i=0; i< model.numSteps; i++)
        {
            trueAnomaly = model.minTrueAnomaly + (i / (model.numSteps-1)) * (model.maxTrueAnomaly - model.minTrueAnomaly);
            model.twoBodyData[i] = {};
            model.twoBodyData[i].trueAnomaly = trueAnomaly;
            model.twoBodyData[i].radialVelocity = (model.centralBody.gravitationalParameter/model.angularMomentum)
                    * model.eccentricity * Math.sin(model.twoBodyData[i].trueAnomaly);
            model.twoBodyData[i].normalVelocity = (model.centralBody.gravitationalParameter/model.angularMomentum)
                    * (1 + model.eccentricity * Math.cos(model.twoBodyData[i].trueAnomaly));
            model.twoBodyData[i].velocity = Math.sqrt(Math.pow(model.twoBodyData[i].normalVelocity,2) + Math.pow(model.twoBodyData[i].radialVelocity,2));            
            model.twoBodyData[i].r = model.semiLatusRectum / (1 + model.eccentricity * Math.cos(model.twoBodyData[i].trueAnomaly));
            if (model.twoBodyData[i].r > 1e6) { model.twoBodyData[i].r = 1e6; }
            if (model.twoBodyData[i].r < 0) { model.twoBodyData[i].r = 1e6; }
            model.twoBodyData[i].x = model.twoBodyData[i].r * Math.cos(model.twoBodyData[i].trueAnomaly);
            model.twoBodyData[i].y = model.twoBodyData[i].r * Math.sin(model.twoBodyData[i].trueAnomaly);
            model.twoBodyData[i].flightPathAngle = Math.atan2((model.eccentricity * Math.sin(model.twoBodyData[i].trueAnomaly)),(1+model.eccentricity * Math.cos(model.twoBodyData[i].trueAnomaly)));
            
        }
        
        // Compute the position of the current point
        model.computeCurrentDataFromTrueAnomaly(model.trueAnomaly);

        // Compute the perigee height
        //model.perigeeHeight = model.semiLatusRectum * (1-model.eccentricity) / (1-Math.pow(model.eccentricity,2));

        // Set the minimum and maximum distances for scaling the plot
        model.yMin = -50000; model.yMax = 50000;
        model.xMin = -200000; model.xMax = 50000;
    },
    computeCurrentDataFromTrueAnomaly: function(trueAnomaly)
    {
        if (trueAnomaly < model.minTrueAnomaly) 
        { 
            trueAnomaly = model.minTrueAnomaly; 
        }
        if (trueAnomaly > model.maxTrueAnomaly) {
            trueAnomaly = model.maxTrueAnomaly; 
        }

        model.trueAnomaly = trueAnomaly;
        model.trueAnomalyDeg = model.trueAnomaly * 180 / Math.PI;
        model.r =  model.semiLatusRectum / 
            (1 + model.eccentricity * Math.cos(model.trueAnomaly));
        if (model.r > 1e12 || model.r < 0) { model.r = 1e12; }
        model.x = model.r * Math.cos(model.trueAnomaly);
        model.y = model.r * Math.sin(model.trueAnomaly); 
        model.radialVelocity = (model.centralBody.gravitationalParameter/model.angularMomentum)
                    * model.eccentricity * Math.sin(model.trueAnomaly);
        model.normalVelocity = (model.centralBody.gravitationalParameter/model.angularMomentum)
                    * (1 + model.eccentricity * Math.cos(model.trueAnomaly));
        model.velocity = Math.sqrt(Math.pow(model.normalVelocity,2) + Math.pow(model.radialVelocity,2));
        model.flightPathAngle = Math.atan2((model.eccentricity * Math.sin(model.trueAnomaly)),(1+model.eccentricity * Math.cos(model.trueAnomaly)));
        model.flightPathAngleDeg = model.flightPathAngle * 180 / Math.PI;
        model.escapeVelocity = Math.sqrt(2 * model.centralBody.gravitationalParameter / model.r);
        model.circularVelocity = Math.sqrt(model.centralBody.gravitationalParameter / model.r);
        model.hodographCenter = model.centralBody.gravitationalParameter / model.angularMomentum;
        model.hodographRadius = model.centralBody.gravitationalParameter * model.eccentricity / model.angularMomentum;
        model.perigeeHeight = (model.semiLatusRectum / (1 + model.eccentricity)) - model.centralBody.radius;
    }
};

function conicSectionInputOutput() {
    
    var outputs = [];
    var graphSetPrefix = "noprefix";
    var maxValue = 1e12;

    controls.graphSetPrefix = function(value) {
        if (!arguments.length) return graphSetPrefix;
        graphSetPrefix = value;
        return controls;
    };

    function updateOutput() {
        outputs.forEach(function(currentOutput) { // Loop over each of the outputs to make it display the current value
            var content;
            var currentValue = model[currentOutput.property] * currentOutput.multiplier;
            if (currentValue > -maxValue && currentValue < maxValue) 
            {
                content = currentOutput.prefix + currentValue.toFixed(currentOutput.digits) + currentOutput.units;
            } 
            else            
            {
                content = currentOutput.prefix + "&infin;" + currentOutput.units;    
            }
            d3.select('.' + graphSetPrefix + "_" + currentOutput.property + '_value')
                .html(content);
        });
    };

    function addSlider(element, input) {
        // Create a div for the slider and the label
        var div = element.append("div")
            .classed('sliderController', true)
            .attr('float','left');

        var slider = div.append('input')
            .classed(input.property, true)
            .attr('type','range')
            .attr('min',input.min)
            .attr('max',input.max)
            .attr('step',input.step)
            .property('value',model[input.property]*input.multiplier);

        var label = div.append('span')
            .classed('sliderAnnotation' + " " + input.property, true)
            .html(input.label);

        var formattedValue = label.append('span')
            .classed('sliderValue', true);
        
        formattedValue.append('span')
            .html(input.prefix);
        formattedValue.append('span')
            .classed(graphSetPrefix + "_" + input.property + '_value', true)
            .html((model[input.property]*input.multiplier).toFixed(input.digits));
        formattedValue.append('span')
            .html(input.units);

        slider.on('input', function() {                
                // Get the slider value and set the model
                var value = parseFloat(slider.property('value')) / input.multiplier;
                model[input.property] = value;

                // Recompute the orbit model
                model.init();

                // Get the displayValue from the recomputed model, so that, for example, the maximum true anomaly
                // for hyperbolic orbits cannot be exceeded.
                var displayValue = model[input.property] * input.multiplier;//

                // Set the displayValue in the slider and its annotation
                d3.select('input.'+input.property).property('value',displayValue);
                d3.select('.' + graphSetPrefix + "_" + input.property + '_value').html(displayValue.toFixed(input.digits));                
                
                // Update the output text fields
                updateOutput();

                // Update the true anomaly slider, in case eccentricity > 1
                if (model.eccentricity > 1) {
                    var trueAnomalyValue = model.trueAnomaly*180/Math.PI;
                    d3.select('input.trueAnomaly').property('value',model.trueAnomaly*180/Math.PI);
                    d3.select('.' + graphSetPrefix + '_trueAnomaly_value').html(trueAnomalyValue.toFixed(1));
                }
                
                // Update the orbit graph
                updateGraphs();
                
            } );
    };

    function addOutput(element, input) {
        outputs.push(input);
        var value = parseFloat(model[input.property]);
        
        var div = element.append("div")
            .classed('outputContainer', true)
            .attr('float','left');

        var label = div.append('span')
            .classed('outputAnnotation' + " " + input.property, true)
            .html(input.label);

        var valueSpan = label.append('span')
            .classed('outputValue' + " " + graphSetPrefix + "_" + input.property + '_value', true)
            .html(formatOutput(input,value));
    };
    
    function addHeader(element, input) {
        var div = element.append("div")
            .classed('headerInputOutput', true)
            .attr('float','left')
        var label = div.append('span')
            .html(input.label);
    };

    function formatOutput(input,value) {
        displayValue = value; // * input.multiplier;
        return input.prefix + displayValue.toFixed(input.digits) + input.units;
    };

    
    function controls(selection) {
        selection.each(function(data) { // "this" now refers to each selection
            that = d3.select(this);
            addHeader(that, { label: "Inputs:"} );
            
            addSlider(that, { label: "Semi latus rectum", 
                              property: "semiLatusRectum", 
                              prefix: "p = ",
                              multiplier: 1,                  
                              units: " km",
                              min: 100, 
                              max: 40000, 
                              step: 200, 
                              digits: 0 });
                        
            addSlider(that, { label: "Eccentricity",
                              property: "eccentricity",
                              prefix: "e = ",
                              multiplier: 1,
                              units: "",
                              min: 0,
                              max: 2,
                              step: 0.01,
                              digits: 2 });
    
            addSlider(that, { label: "True anomaly",
                              property: "trueAnomaly",
                              prefix: "&theta; = ",
                              multiplier: 180 / Math.PI,
                              units: "&deg;",
                              min: -180,
                              max: 180,
                              step: 1,
                              digits: 1 });
                        
            addHeader(that, { label: "Outputs:"} );                    
            
            addOutput(that, { label: 'Velocity',
                              property: 'velocity',
                              prefix: '<i>V</i> = ',
                              multiplier: 1,
                              units: ' km/s',
                              digits: 2 });
                        
            addOutput(that, { label: 'Radial velocity',
                              property: 'radialVelocity',
                              prefix: '<i>V<sub>r</sub></i> = ',
                              multiplier: 1,
                              units: ' km/s',
                              digits: 2 });
                        
            addOutput(that, { label: 'Normal velocity',
                              property: 'normalVelocity',
                              prefix: '<i>V<sub>n</sub></i> = ',
                              multiplier: 1,
                              units: ' km/s',
                              digits: 2 });                        
                        
            addOutput(that, { label: 'Flight path angle',
                              property: 'flightPathAngle',
                              prefix: '<i>&gamma;</i> = ',
                              multiplier: 180/Math.PI,
                              units: '&deg;',
                              digits: 1 });  
    
            addOutput(that, { label: 'Radius',
                              property: 'r',
                              prefix: '<i>r</i> = ',
                              multiplier: 1,
                              units: ' km',
                              digits: 0 });

            addOutput(that, { label: 'Perigee height',
                              property: 'perigeeHeight',
                              prefix: '<i>h<sub>p</sub></i> = ',
                              multiplier: 1,
                              units: ' km',
                              digits: 0 });

        }); // End of selection.each
                    

    };
    
    return controls;
};

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

            // First, add the defs for the arrowheads
            var defs = svgEnter.append("defs");
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

            // Next, add the group to translate for the margins
            var gEnter = svgEnter.append("g");
            
            // And add the skeletal elements to this group
            // 1. Central body
            gEnter.append("circle")
            	.classed('centralBody', true)

            // 2. Axes
            gEnter.append("line")
                .classed('orbitAxisX', true);
            gEnter.append("line")
                .classed('orbitAxisY', true);
                
            // 2a. Semi latus rectum
            if (showSemiLatusRectum) {
                gEnter.append("line")
                    .classed('semiLatusRectum', true);
            }
            
            // 3. Orbit
            gEnter.append("path")
                .classed('orbit', true);

            // 4. Radius (line connection central body to satellite)
            gEnter.append("line")
                .classed("satRadius", true)
                .attr("x1",xScale(0))
                .attr("y1",yScale(0));            
                
            // 5. Satellite group
            var satellite = gEnter.append("g")
                .classed('satellite', true);

            // 6. Flight path angle
            if (showFlightPathAngle) {
                satellite.append("path")
                    .classed("flightPathAngle", true);
            }
                
            if (showNormalRadialVelocity) {
            // 7. Velocity components
                satellite.append("line")
                    .classed("radialVelocity", true)
                    .attr("x1",0)
                    .attr("y1",0)
                    .attr("y2",0);
                satellite.append("line")
                    .classed("normalVelocity", true)
                    .attr("x1",0)
                    .attr("y1",0)
                    .attr("x2",0);
            
            // 8. Dashed helper-lines for velocity, parallel to the velocity components
                satellite.append("line")
                    .classed("radialVelocityHelper", true);
                satellite.append("line")
                    .classed("normalVelocityHelper", true);
            }
                
            // 9. Velocity
            if (showVelocity) {
            satellite.append("line")
                .classed("velocity",true)
                .attr("x1",0)
                .attr("y1",0)
                .attr("y2",0);
            }
            
            // 10. True anomaly angle
            gEnter.append("path")
                .classed("trueAnomaly", true);

            // 11. Satellite circle
            satellite.append("circle")
                .classed("satCircle", true)
        		.attr("r",5);
        
            if (showHodographCircle) {
            // 12. Hodograph circle at satellite
                var hodographCircle = satellite.append("circle")
                    .classed('hodographCircle', true);
            }
                
                
            // 
            // UPDATE PART
            //
               
            // Update the outer dimensions.
            svg .attr("width", canvasWidth)
                .attr("height", canvasHeight);                

            // Update the inner dimensions
            var gUpdate = svg.select('g')
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");        

            // Update the graph elements
            // 1. Central body
            gUpdate.select('.centralBody')
                .attr("cx",xScale(0))
            	.attr("cy",yScale(0))
            	.attr("r",plotScale*data.centralBody.radius);
    
            gUpdate.select('.orbitAxisX')
                .attr("x1",xScale(data.xMin)-marginMin.left)
                .attr("y1",yScale(0))
                .attr("x2",xScale(data.xMax)+marginMin.left)
                .attr("y2",yScale(0));
    
            gUpdate.select('.orbitAxisY')
                .attr("x1",xScale(0))
                .attr("y1",yScale(data.yMin)+marginMin.top)
                .attr("x2",xScale(0))
                .attr("y2",yScale(data.yMax)-marginMin.top);
                       
            gUpdate.select('.semiLatusRectum')
                .attr("x1",xScale(0))
                .attr("y1",yScale(0))                         
                .attr("x2",xScale(0))
                .attr("y2",yScale(data.semiLatusRectum));
                                
            if (data.eccentricity < 1)
            {
                gUpdate.select('.orbit').attr("d",orbitLineFunction(data.twoBodyData) + "Z");
            } else {
                gUpdate.select('.orbit').attr("d",orbitLineFunction(data.twoBodyData));            
            }

            // Set up transformations of the satellite and its velocity
            var transformPosition = "translate(" + xScale(model.x) + "," + yScale(model.y) + ")";
            var transformVelocity = "rotate("+ (-1*(data.trueAnomalyDeg+90-data.flightPathAngleDeg)) +")";
            var transformRadialVelocity = "rotate("+ (-1*data.trueAnomalyDeg) +")";
            
            // Satellite position and radius fom central body
            var satUpdate = gUpdate.select('.satellite')
                .attr("transform",transformPosition);
                
            gUpdate.select('.satRadius')
                .attr("x1",xScale(0))
                .attr("y1",yScale(0))
                .attr("x2",xScale(model.x))
                .attr("y2",yScale(model.y));
    
            // Velocity vector and orthogonal components
            satVelocity = satUpdate.select('.velocity')
                .attr("x2",data.velocity * velocityScale)
                .attr("transform",transformVelocity);
            scaleArrowStyle(satVelocity,data.velocity * velocityScale, arrowLength, defaultVectorStrokeWidth);
    
            var satRadialVelocity = satUpdate.select('.radialVelocity')
                .attr("x2",data.radialVelocity * velocityScale)
                .attr("transform",transformRadialVelocity);
            scaleArrowStyle(satRadialVelocity,data.radialVelocity * velocityScale, arrowLength, defaultVectorStrokeWidth);
    
            var satNormalVelocity = satUpdate.select('.normalVelocity')
                .attr("y2",-1 * (model.normalVelocity * velocityScale))
                .attr("transform",transformRadialVelocity);
            scaleArrowStyle(satNormalVelocity, data.normalVelocity * velocityScale, arrowLength, defaultVectorStrokeWidth);
    
            // Dashed helper lines for velocity components
            satUpdate.select('.radialVelocityHelper')
                .attr("x1", 0)
                .attr("y1", -1 * (data.normalVelocity * velocityScale))
                .attr("x2", +1 * (data.radialVelocity * velocityScale))
                .attr("y2", -1 * (data.normalVelocity * velocityScale))
                .attr("transform", transformRadialVelocity);
    
            satUpdate.select('.normalVelocityHelper')
                .attr("x1", +1 * (data.radialVelocity * velocityScale))
                .attr("y1", 0)
                .attr("x2", +1 * (data.radialVelocity * velocityScale))
                .attr("y2", -1 * (data.normalVelocity * velocityScale))
                .attr("transform",transformRadialVelocity);
    
            // Flight path angle
            var endAngle   = -1 * data.trueAnomaly+3/2*Math.PI;
            var startAngle = -1 * data.trueAnomaly+3/2*Math.PI + data.flightPathAngle;
            satUpdate.select('.flightPathAngle')
                .attr("d",anglesToClosedArcPath(function(d){return d;}, function(d){return d;}, 0, 0, 30, startAngle, endAngle, 1, 0));
    
            // True anomaly angle
            gUpdate.select('.trueAnomaly')
                .attr("d",anglesToClosedArcPath(xScale, yScale, 0, 0, data.centralBody.radius*1.8, 0, data.trueAnomaly, 0, 0, 0));

            satUpdate.select('.hodographCircle')
                .attr("transform", transformRadialVelocity)
                .attr("cx",0)
                .attr("cy",-1 * data.hodographCenter * velocityScale)
                .attr("r", +1 * data.hodographRadius * velocityScale);
           
        }); // End of selection.each(function(data)...
    }
    return chart;

} // end of conicSectionOrbit


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
                .attr("d",anglesToClosedArcPath(xScale,yScale,0,data.hodographCenter,1,startangle,endangle,0,fliplargearc));
    
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