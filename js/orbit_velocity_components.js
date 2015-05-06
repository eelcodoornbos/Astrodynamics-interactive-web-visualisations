function anglesToArcPath(xScale,yScale,x,y,radius,startangle,endangle,flipsweep,fliplargearc)
{
    var x1, x2, y1, y2, sweep, xrotation, largearc;
    x1 = xScale(x + radius * Math.cos(startangle));
    y1 = yScale(y + radius * Math.sin(startangle));
    x2 = xScale(x + radius * Math.cos(endangle));
    y2 = yScale(y + radius * Math.sin(endangle));
    xrotation = Math.PI/2;
    xrotation = 0;
    if (fliplargearc == 0) {
        endangle - startangle > Math.PI ? largearc = 1 : largearc = 0;
    } else {
        endangle - startangle < Math.PI ? largearc = 1 : largearc = 0;
    }
    if (flipsweep == 0) {
        endangle < startangle ? sweep = 1 : sweep = 0;
    } else {
        endangle > startangle ? sweep = 1 : sweep = 0;        
    }
    var xradius = xScale(radius)-xScale(0);
    var yradius = yScale(radius)-yScale(0);
    var d = "M" + x1 + "," + y1 + "A" + xradius + "," + yradius + " " + xrotation + " " + largearc + " " + sweep + " " + x2 + "," + y2;
    return d;
}

function anglesToClosedArcPath(xScale,yScale,x,y,radius,startangle,endangle,flipsweep,fliplargearc)
{
    var x1, x2, y1, y2, sweep, xrotation, largearc;
    x1 = xScale(x + radius * Math.cos(startangle));
    y1 = yScale(y + radius * Math.sin(startangle));
    x2 = xScale(x + radius * Math.cos(endangle));
    y2 = yScale(y + radius * Math.sin(endangle));
    xrotation = 0;
    if (fliplargearc == 0) {
        endangle - startangle > Math.PI ? largearc = 1 : largearc = 0;
    } else {
        endangle - startangle < Math.PI ? largearc = 1 : largearc = 0;
    }
    if (flipsweep == 0) {
        endangle < startangle ? sweep = 1 : sweep = 0;
    } else {
        endangle > startangle ? sweep = 1 : sweep = 0;        
    }
    var xradius = xScale(radius)-xScale(0);
    var yradius = yScale(radius)-yScale(0);
    var d = "M" + xScale(x) + "," + yScale(y) + " L" + x1 + "," + y1 + " " + "L" + x1 + "," + y1 + "A" + xradius + "," + yradius + " " + xrotation + " " + largearc + " " + sweep + " " + x2 + "," + y2 + " " + "Z";
    return d;
}

function sign(x){return x>0?1:x<0?-1:x;}
var ORBIT_VELOCITY_COMPONENTS = (function() {

var model = {
    
    eccentricity: 0.6,
    perigeeHeight: 500,
    framesPerSecond: 60,
    simulationTimeDuration: 10,

    init: function model_init() {
        model.keplerOrbit = new astro.KeplerOrbit(astro.earth, model.perigeeHeight, model.eccentricity);    
        model.frameDurationMilliSeconds = 1000 / model.framesPerSecond;
        model.physicalTimeDuration = model.keplerOrbit.period;
        model.numSteps = model.physicalTimeDuration * 2 / (60 * 60) * model.framesPerSecond;
        model.twoBodyData = astro.compute_twobody(model.keplerOrbit, model.physicalTimeDuration, model.numSteps);
        model.xMin = d3.min(model.twoBodyData, function(d) { return d.x;} );
        model.xMax = d3.max(model.twoBodyData, function(d) { return d.x;} );
        model.yMin = d3.min(model.twoBodyData, function(d) { return d.y;} );
        model.yMax = d3.max(model.twoBodyData, function(d) { return d.y;} );
    }
};

var controller = {
    init: function controller_init() {
        model.init();
        viewController.init();
        viewController.animate();
    },
    
};

var viewController = {
    frame: 448,
    plotAxes: true,
    marginMin: { top: 40, right: 40, bottom: 40, left: 40},
    margin: { top: 50, right: 40, bottom: 50, left: 50 },
    orbitMaxWidthFraction: 0.5,
    hodographMaxWidthFraction: 0.4,
    arrowLength: 5,
    arrowWidth: 3,
    aspectRatio: 1.5,
    defaultVectorStrokeWidth: 3,
    vColor: "orange",
    vnColor: "red",
    vrColor: "blue",
    trueAnomalyColor: "purple",
    flightPathAngleColor: "green",
    
    init: function viewController_init() {
        // Get the element that should contain the SVG
        viewController.container = d3.select("#orbit_velocity_components")
            .style("position","relative"); // Position relative to be able to absolutely position the button
        viewController.canvasWidth = parseInt(viewController.container.style('width'), 10);
        viewController.canvasHeight = viewController.canvasWidth / viewController.aspectRatio;

        // Add the SVG
        viewController.svg = viewController.container.append("svg");
        viewController.svg.attr("width", viewController.canvasWidth)
                .attr("height", viewController.canvasHeight)
                .style("overflow","visible");
        viewController.addControls();                                 
        viewController.addMarkers();

        viewOrbit.init();
        viewHodograph.init();
    },
    startStopAnimation: function startStopAnimation() {
        if (viewController.animationRunning) 
        {
    		viewController.animationRunning = false;
    		viewController.startStopButton.html("Start");
        } 
        else 
        {
    	    viewController.animationRunning = true;
    		viewController.startStopButton.html("Stop");
    	}
    },    
    animate: function animate() {
        requestAnimationFrame( animate );
        if (viewController.animationRunning) 
        {
            viewController.frame++;
            if (viewController.frame >= model.numSteps) 
            { 
                viewController.frame = 0; 
            }
            var currentData = model.twoBodyData[viewController.frame];
            viewOrbit.updateSatellitePosition(currentData);
            viewHodograph.updateSatellitePosition(currentData);
            viewController.frameSlider.property("value",viewController.frame);
        }
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
                .style("fill",config.color)
                .append("path")
                    .attr("d",arrowPath); 
        }
        viewController.defs = viewController.svg.append("defs");
        addArrowMarker({element: viewController.defs, id:"velocityArrowHead", 
            arrowLength: viewController.arrowLength, arrowWidth:viewController.arrowWidth, color:viewController.vColor});
        addArrowMarker({element: viewController.defs, id:"radialVelocityArrowHead", 
            arrowLength: viewController.arrowLength, arrowWidth:viewController.arrowWidth, color:viewController.vrColor});        
        addArrowMarker({element: viewController.defs, id:"normalVelocityArrowHead", 
            arrowLength: viewController.arrowLength, arrowWidth:viewController.arrowWidth, color:viewController.vnColor});
        addArrowMarker({element: viewController.defs, id:"trueAnomalyArrowHead", 
            arrowLength: viewController.arrowLength, arrowWidth:viewController.arrowWidth, color:viewController.trueAnomalyColor});                    
        addArrowMarker({element: viewController.defs, id:"flightPathAngleArrowHead", 
            arrowLength: viewController.arrowLength, arrowWidth:viewController.arrowWidth, color:viewController.flightPathAngleColor});
    },    
    addControls: function() {
        // UI elements
        viewController.startStopButton = viewController.container.append("button")
            .attr("id","startstopbutton")
            .html("Start")
            .style("background","rgba(240,240,240,0.9)")
            .style("position", "absolute")
            .style("right","10px")
            .style("top","10px")
            .on("click",function(d, i){ viewController.startStopAnimation(); });
        viewController.frameSlider = d3.select("#time_slider").append("input")
            .attr("id","frameslider")
            .attr("type","range")
            .attr("min","0")
            .attr("max",model.numSteps - 1)
            .attr("step","1")
            .style("width",viewOrbit.canvasWidth + "px")
            .property("value",viewController.frame)
            .on("input",function(){ 
                viewController.frame = viewController.frameSlider.property("value"); 
                viewOrbit.updateSatellitePosition(model.twoBodyData[viewController.frame]); 
                viewHodograph.updateSatellitePosition(model.twoBodyData[viewController.frame]);                 
            } );
        viewController.eccentricitySlider = d3.select("#e_slider").append("input")
            .attr("id","eccentricityslider")
            .attr("type","range")
            .attr("min","0")
            .attr("max","2.5")
            .attr("step","0.05")
            .style("width",300)
            .property("value",model.eccentricity)
            .on("input",function(){
                var positionInOrbit = viewController.frame / model.numSteps;
                model.eccentricity = parseFloat(viewController.eccentricitySlider.property("value")); 
                model.init();
                viewController.frame = parseInt(positionInOrbit * model.numSteps);
                viewController.frameSlider.property("value",viewController.frame);
                viewController.frameSlider
                    .attr("max",model.numSteps - 1);
                viewOrbit.setOrbitPlotGeometry();
                if (true) { 
                    viewOrbit.setScale(); 
                }
                viewOrbit.updateOrbit();
                viewOrbit.updateSatellitePosition(model.twoBodyData[viewController.frame]); 
                viewHodograph.updateOrbit();
                viewHodograph.updateSatellitePosition(model.twoBodyData[viewController.frame]); 
            } );
        viewController.perigeeSlider = d3.select("#rp_slider").append("input")
            .attr("id","perigeeslider")
            .attr("type","range")
            .attr("min","0")
            .attr("max","36000")
            .attr("step","100")
            .style("width","300")
            .property("value",model.perigeeHeight)
            .on("input",function(){
                var positionInOrbit = viewController.frame / model.numSteps;
                model.perigeeHeight = parseFloat(viewController.perigeeSlider.property("value")); 
                model.init();
                viewController.frame = parseInt(positionInOrbit * model.numSteps);
                viewController.frameSlider.property("value",viewController.frame);
                viewController.frameSlider
                    .attr("max",model.numSteps - 1);                
                viewOrbit.setOrbitPlotGeometry();
                if (true) {
                     viewOrbit.setScale(); 
                }
                viewOrbit.updateOrbit();
                viewOrbit.updateSatellitePosition(model.twoBodyData[viewController.frame]); 
                viewHodograph.updateOrbit();
                viewHodograph.updateSatellitePosition(model.twoBodyData[viewController.frame]);
            } );
            
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

var viewOrbit = {
    init: function viewOrbit_init() {
        viewOrbit.graph = viewController.svg.append("g");
        viewOrbit.setOrbitPlotGeometry();
        viewOrbit.setScale();
        viewOrbit.addOrbit();
        viewOrbit.addSatellite();
        viewOrbit.updateOrbit();
        viewOrbit.updateSatellitePosition(model.twoBodyData[0]);
    },
    setOrbitPlotGeometry: function setOrbitPlotGeometry() {
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
        viewOrbit.velocityScale = 200/16;
    },
    addOrbit: function() {
        // Central body
        viewOrbit.centralBody = viewOrbit.graph.append("circle")
        	.attr("id","earth")
        	.attr("fill","#eee")
        	.attr("fill-opacity",1)
        	.attr("stroke","#ddd");
        // X-axis line    
        viewOrbit.xAxis = viewOrbit.graph.append("line")
            .attr("stroke","gray")
            .attr("opacity","0.5")
            .attr("stroke-width", "1");
        // Y-axis line
        viewOrbit.yAxis = viewOrbit.graph.append("line")
            .attr("stroke","gray")
            .attr("opacity","0.5")            
            .attr("stroke-width", "1");
        viewOrbit.orbit = viewOrbit.graph.append("path")
            .attr("fill","none")
            .attr("stroke","black")
            .attr("stroke-width", "2");
    },
    addSatellite: function() {
        viewOrbit.satellite = viewOrbit.graph.append("g");
        viewOrbit.satRadius = viewOrbit.graph.append("line")
            .attr("id","satradius")
            .style("stroke","gray")
            .attr("opacity","0.4")
            .style("stroke-width","1px")
            .attr("x1",viewOrbit.xScale(0))
            .attr("y1",viewOrbit.yScale(0));            
        viewOrbit.flightPathAngle = viewOrbit.satellite.append("path")
            .attr("stroke",viewController.flightPathAngleColor)
            .attr("stroke-width","4")
            .attr("fill","none")
            .attr("opacity","0.3");            
        viewOrbit.satRadialVelocity = viewOrbit.satellite.append("line")
            .attr("id","radialVelocity")
            .attr("x1",0)
            .attr("y1",0)
            .attr("y2",0)
            .style("stroke",viewController.vrColor)
            .style("stroke-width",viewController.defaultVectorStrokeWidth)
            .style("marker-end","url('#radialVelocityArrowHead')");
        viewOrbit.satNormalVelocity = viewOrbit.satellite.append("line")
            .attr("id","normalVelocity")
            .attr("x1",0)
            .attr("y1",0)
            .attr("x2",0)
            .style("stroke",viewController.vnColor)
            .style("stroke-width",viewController.defaultVectorStrokeWidth)
            .style("marker-end","url('#normalVelocityArrowHead')");
        viewOrbit.satRadialVelocityHelper = viewOrbit.satellite.append("line")
            .attr("id","radialVelocity")
            .style("stroke","gray")
            .style("stroke-dasharray","3,2")
            .style("stroke-width","2px")
            .style("opacity","0.5");
        viewOrbit.satNormalVelocityHelper = viewOrbit.satellite.append("line")
            .attr("id","normalVelocity")
            .style("stroke","gray")
            .style("stroke-dasharray","3,2")
            .style("stroke-width","2px")
            .style("opacity","0.5");
        viewOrbit.satVelocity = viewOrbit.satellite.append("line")
            .attr("id","velocity")
            .attr("x1",0)
            .attr("y1",0)
            .attr("y2",0)
            .style("stroke",viewController.vColor)
            .style("stroke-width",viewController.defaultVectorStrokeWidth)
            .style("marker-end","url('#velocityArrowHead')");
        viewOrbit.trueanomaly = viewOrbit.graph.append("path")
            .attr("fill","none")
            .attr("opacity","0.3")
            .attr("stroke",viewController.trueAnomalyColor)
            .attr("stroke-width","4");
        viewOrbit.satCircle = viewOrbit.satellite.append("circle")
            .attr("id","satcircle")
    		.attr("fill","gray")
    		.attr("stroke","white")
    		.attr("stroke-width","1px")
    		.attr("r",5);            
    },    
    updateSatellitePosition: function updateSatellitePosition(currentData) {
        d3.select("#v").html(currentData.v.toFixed(1));
        d3.select("#vr").html(currentData.vradial.toFixed(1));
        d3.select("#vtheta").html(currentData.vnormal.toFixed(1));        
        var transformPosition = "translate(" + viewOrbit.xScale(currentData.x) + "," + viewOrbit.yScale(currentData.y) + ")";
        var transformVelocity = "rotate("+ (-1*(currentData.trueAnomalyDeg+90-currentData.flightPathAngleDeg)) +")";
        var transformRadialVelocity = "rotate("+ (-1*currentData.trueAnomalyDeg) +")";
        viewOrbit.satellite
            .attr("transform",transformPosition);
        viewOrbit.satRadius
            .attr("x1",viewOrbit.xScale(0))
            .attr("y1",viewOrbit.yScale(0));            
        viewOrbit.satRadius
            .attr("x2",viewOrbit.xScale(currentData.x))
            .attr("y2",viewOrbit.yScale(currentData.y));
        viewOrbit.satVelocity
            .attr("x2",currentData.v * viewOrbit.velocityScale)
            .attr("transform",transformVelocity);
        viewOrbit.satRadialVelocity
            .attr("x2",currentData.vradial * viewOrbit.velocityScale)
            .attr("transform",transformRadialVelocity);
        viewController.scaleArrowStyle(viewOrbit.satRadialVelocity,currentData.vradial*viewOrbit.velocityScale);
        viewOrbit.satNormalVelocity
            .attr("y2",-1 * (currentData.vnormal * viewOrbit.velocityScale))
            .attr("transform",transformRadialVelocity);
        viewOrbit.satRadialVelocityHelper
            .attr("x1",0)
            .attr("y1",-1 * (currentData.vnormal * viewOrbit.velocityScale))
            .attr("x2",currentData.vradial * viewOrbit.velocityScale)
            .attr("y2",-1 * (currentData.vnormal * viewOrbit.velocityScale))
            .attr("transform",transformRadialVelocity);
        viewOrbit.satNormalVelocityHelper
            .attr("x1",currentData.vradial * viewOrbit.velocityScale)
            .attr("y1",0)
            .attr("x2",currentData.vradial * viewOrbit.velocityScale)
            .attr("y2",-1 * (currentData.vnormal * viewOrbit.velocityScale))
            .attr("transform",transformRadialVelocity);
        var endAngle = -currentData.trueAnomaly+3/2*Math.PI;
        var startAngle = -currentData.trueAnomaly+3/2*Math.PI+currentData.flightPathAngle;
        viewOrbit.flightPathAngle
            .attr("d",anglesToArcPath(function(d){return d;},function(d){return d;},0,0,30,startAngle,endAngle,1,0));
        var trueAnomaly = currentData.trueAnomaly;
        if (trueAnomaly < 0) { trueAnomaly += Math.PI * 2;}
        viewOrbit.trueanomaly
            .attr("d",anglesToArcPath(viewOrbit.xScale,viewOrbit.yScale,0,0,6378/3,0,trueAnomaly,0,0));
    },    
    updateOrbit: function() {
        d3.select("#e").html(model.eccentricity.toFixed(2));
        d3.select("#rp").html(model.perigeeHeight.toFixed(1));
        viewOrbit.centralBody
            .attr("cx",viewOrbit.xScale(0))
        	.attr("cy",viewOrbit.yScale(0))
        	.attr("r",viewOrbit.plotScale*model.twoBodyData[0].centralBody.radius);
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
        viewOrbit.orbit
            .attr("d",viewOrbit.orbitLineFunction(model.twoBodyData));
    },
    orbitLineFunction: d3.svg.line()
                .x( function (d) { return (viewOrbit.xScale(d.x)); } )
                .y( function (d) { return (viewOrbit.yScale(d.y)); } )
    };

var viewHodograph = {
    init: function() {
        viewHodograph.graph = viewController.svg.append("g");
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
        viewHodograph.updateSatellitePosition(model.twoBodyData[0]);
    },
    addAxes: function() {
        var xAxisHodograph = d3.svg.axis()
          .scale(viewHodograph.xScale)
          .tickValues([-8, -6,-4,-2, 0, 2, 4, 6, 8])
          .orient("bottom");        
        var yAxisHodograph = d3.svg.axis()
          .scale(viewHodograph.yScale)
          .tickValues([2,4,6,8,10,12])
          .orient("left");
        viewHodograph.graph.append('svg:g')
          .attr('class', 'x axis')
          .attr('transform', 'translate(' + (0) + ',' + (viewHodograph.hodographHeight) + ')')
          .style("opacity", 1.0)
          .call(xAxisHodograph);
        viewHodograph.graph.append('svg:g')
          .attr('class', 'y axis')
          .attr('transform', 'translate(' + (0.5*viewHodograph.hodographWidth) + ',' + (0) + ')')
          .style("opacity", 1.0)
          .call(yAxisHodograph);              
    },
    addOrbit: function() {
        viewHodograph.hodographCircle = viewHodograph.graph.append("svg:circle")
            .attr("id","hodographCircle")
            .attr("fill","none")
            .attr("stroke-width","3px")
            .attr("stroke",viewController.vColor)
            .style("stroke-dasharray","5,5")            
            .attr("cx",viewHodograph.xScale(0))
            .style("opacity","0.3")
            .attr("clip-path","url(#cliphodograph)");
        viewHodograph.trueAnomaly = viewHodograph.graph.append("path")
            .attr("fill","none")
            .attr("opacity","0.3")
            .attr("stroke",viewController.trueAnomalyColor)
            .attr("stroke-width","4")
            .attr("transform","rotate(-90,"+ viewHodograph.xScale(0) + "," + viewHodograph.yScale(viewHodograph.hodographCenter) + ")");            
    },    
    addSatellite: function() {
        viewHodograph.escapeVelocityHodograph = viewHodograph.graph.append("circle")
            .attr("stroke",viewController.vColor)
            .attr("stroke-width","1.5px")
            .attr("fill","none")
            .attr("cx",viewHodograph.xScale(0))
            .attr("cy",viewHodograph.yScale(0))
            .attr("clip-path","url(#cliphodograph)")
            .style("visibility","hidden");
        viewHodograph.flightPathAngle = viewHodograph.graph.append("path")
            .attr("fill","none")
            .attr("stroke",viewController.flightPathAngleColor)
            .attr("stroke-width","4")
            .attr("opacity","0.3");
        viewHodograph.velocityRadius = viewHodograph.graph.append("line")
            .attr("id","satradius")
            .style("stroke","gray")
            .attr("opacity","0.4")
            .style("stroke-width","1px");
        viewHodograph.satRadialVelocity = viewHodograph.graph.append("g").append("line")
            .attr("id","hodographRadialVelocity")
            .attr("x1",viewHodograph.xScale(0))
            .attr("y1",viewHodograph.yScale(0))
            .attr("y2",viewHodograph.yScale(0))            
            .style("stroke",viewController.vrColor)
            .style("stroke-width",viewController.defaultVectorStrokeWidth)
            .style("marker-end","url('#radialVelocityArrowHead')");
        viewHodograph.satNormalVelocity = viewHodograph.graph.append("g").append("line")
            .attr("id","hodographNormalVelocity")
            .attr("x1",viewHodograph.xScale(0))
            .attr("y1",viewHodograph.yScale(0))
            .attr("x2",viewHodograph.xScale(0))
            .style("stroke",viewController.vnColor)
            .style("stroke-width",viewController.defaultVectorStrokeWidth)
            .style("marker-end","url('#normalVelocityArrowHead')");   
        viewHodograph.satRadialVelocityHelper = viewHodograph.graph.append("line")
            .attr("id","hodographRadialVelocityHelper")
            .style("stroke","gray")
            .style("stroke-dasharray","3,2")
            .style("stroke-width","2px")
            .style("opacity","0.5");
        viewHodograph.satNormalVelocityHelper = viewHodograph.graph.append("line")
            .attr("id","hodographNormalVelocityHelper")
            .style("stroke","gray")
            .style("stroke-dasharray","3,2")
            .style("stroke-width","2px")
            .style("opacity","0.5");
        viewHodograph.satVelocity = viewHodograph.graph.append("g").append("line")
            .attr("id","hodographVelocity")
            .attr("x1",viewHodograph.xScale(0))
            .attr("y1",viewHodograph.yScale(0))
            .style("stroke",viewController.vColor)
            .style("stroke-width",viewController.defaultVectorStrokeWidth)
            .style("marker-end","url('#velocityArrowHead')"); 
        viewHodograph.circularVelocityHodograph = viewHodograph.graph.append("circle")
            .attr("fill","red")
            .attr("stroke","white")
            .attr("stroke-width","1px")              
            .attr("cx",viewHodograph.xScale(0))
            .attr("r",4)
            .style("visibility","hidden");             
        viewHodograph.hodographOrigin = viewHodograph.graph.append("circle")
            .attr("id","satcircle")
    		.attr("fill","gray")
    		.attr("stroke","white")
    		.attr("stroke-width","1px")
    		.attr("r",5)
            .attr("cx",viewHodograph.xScale(0))
            .attr("cy",viewHodograph.yScale(0));
    },    
    updateSatellitePosition: function updateSatellitePosition(currentData) {        
        viewController.scaleArrowStyle(viewHodograph.satRadialVelocity,viewHodograph.xScale(currentData.vradial)-viewHodograph.xScale(0));
        viewHodograph.satRadialVelocity
            .attr("x2",viewHodograph.xScale(currentData.vradial ));
        viewHodograph.satNormalVelocity
            .attr("y2",viewHodograph.yScale(currentData.vnormal ));            
        viewHodograph.satVelocity
            .attr("x2",viewHodograph.xScale(currentData.vradial))
            .attr("y2",viewHodograph.yScale(currentData.vnormal));
        viewHodograph.satRadialVelocityHelper
            .attr("x1",viewHodograph.xScale(0))
            .attr("y1",viewHodograph.yScale(currentData.vnormal))
            .attr("x2",viewHodograph.xScale(currentData.vradial))
            .attr("y2",viewHodograph.yScale(currentData.vnormal));
        viewHodograph.satNormalVelocityHelper
            .attr("x1",viewHodograph.xScale(currentData.vradial))
            .attr("y1",viewHodograph.yScale(0))
            .attr("x2",viewHodograph.xScale(currentData.vradial))
            .attr("y2",viewHodograph.yScale(currentData.vnormal));
        var circularVelocity = Math.sqrt(currentData.centralBody.gravitationalParameter/currentData.r)
        viewHodograph.circularVelocityHodograph
            .attr("cy",viewHodograph.yScale(circularVelocity))
        viewHodograph.escapeVelocityHodograph
            .attr("r",viewHodograph.yScale(0)-viewHodograph.yScale(Math.sqrt(2*currentData.centralBody.gravitationalParameter/currentData.r)));
        viewHodograph.flightPathAngle
            .attr("d",anglesToArcPath(viewHodograph.xScale,viewHodograph.yScale,0,0,1.6,Math.PI/2,Math.PI/2-currentData.flightPathAngle,0,0));
        var trueAnomaly = currentData.trueAnomaly;
        var fliplargearc = 0;
        if (trueAnomaly < 0) { trueAnomaly += Math.PI * 2;}
        if (trueAnomaly > Math.PI) { fliplargearc = 1; }
        var startangle = 0;
        var endangle = -trueAnomaly;
        viewHodograph.trueAnomaly
            .attr("d",anglesToArcPath(viewHodograph.xScale,viewHodograph.yScale,0,viewHodograph.hodographCenter,1.6,startangle,endangle,0,fliplargearc));
        viewHodograph.velocityRadius
            .attr("x1",viewHodograph.xScale(0))
            .attr("y1",viewHodograph.yScale(viewHodograph.hodographCenter))
            .attr("x2",viewHodograph.xScale(currentData.vradial))
            .attr("y2",viewHodograph.yScale(currentData.vnormal));
    },        
    updateOrbit: function() {
        viewHodograph.hodographCenter = model.keplerOrbit.centralBody.gravitationalParameter/model.keplerOrbit.angularMomentum;
        viewHodograph.hodographRadius = model.keplerOrbit.centralBody.gravitationalParameter*model.keplerOrbit.eccentricity/model.keplerOrbit.angularMomentum
        viewHodograph.hodographCircle
            .attr("cy",viewHodograph.yScale(viewHodograph.hodographCenter))
            .attr("r",viewHodograph.xScale(viewHodograph.hodographRadius)-viewHodograph.xScale(0));
        viewHodograph.trueAnomaly
            .attr("transform","rotate(-90,"+ viewHodograph.xScale(0) + "," + viewHodograph.yScale(viewHodograph.hodographCenter) + ")");
            
    },
    hodographLineFunction: d3.svg.line()
                .x( function (d) { return (viewHodograph.xScale(d.vradial)); } )
                .y( function (d) { return (viewHodograph.yScale(d.vnormal)); } )    
};

controller.init();

/*
var myvector = vector().arrowWidth(30).arrowLength(15);
var testvector = viewOrbit.svg.append("g").attr("id","testvector");
myvector.x2(25);
testvector.call(myvector);
myvector.x2(50);
testvector.call(myvector);
*/

/*
        xAxisHodograph = d3.svg.axis()
          .scale(viewOrbit.xScaleHodograph)
          .tickValues([-18, -16,-14,-12,-10,-8,-6,-3, 0, 12, 14, 16, 18])
          .orient("top");        
        viewOrbit.svg.selectAll(".x.axis")
          .call(xAxisHodograph);
*/
}) ();
