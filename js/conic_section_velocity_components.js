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


var CONIC_SECTION_VELOCITY_COMPONENTS = (function() {
    var prefix = "conic_section_velocity_components";
    var model = {
        centralBody: astro.earth,
        eccentricity: 0.85,
        semiLatusRectum: 6378+10000,
        numSteps: 360,
        maxCoordinate: 100000,
        currentData: {trueAnomaly: 30*Math.PI/180},
        twoBodyData: [],
        
        init: function model_init() {
            var trueAnomaly;
            // Compute the minimum and maximum true anomaly
            if (model.eccentricity < 1) {
                model.minTrueAnomaly = -1 * Math.PI;
                model.maxTrueAnomaly = +1 * Math.PI;
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
            model.computeCurrentDataFromTrueAnomaly(model.currentData.trueAnomaly);
    
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
            model.currentData.trueAnomaly = trueAnomaly;
            model.currentData.trueAnomalyDeg = trueAnomaly * 180 / Math.PI;
            model.currentData.r =  model.semiLatusRectum / 
                (1 + model.eccentricity * Math.cos(model.currentData.trueAnomaly));
            model.currentData.x = model.currentData.r * Math.cos(model.currentData.trueAnomaly);
            model.currentData.y = model.currentData.r * Math.sin(model.currentData.trueAnomaly); 
            model.currentData.vradial = (model.centralBody.gravitationalParameter/model.angularMomentum)
	                    * model.eccentricity * Math.sin(model.currentData.trueAnomaly);
            model.currentData.vnormal = (model.centralBody.gravitationalParameter/model.angularMomentum)
	                    * (1 + model.eccentricity * Math.cos(model.currentData.trueAnomaly));
            model.currentData.v = Math.sqrt(Math.pow(model.currentData.vnormal,2) + Math.pow(model.currentData.vradial,2));
            model.currentData.flightPathAngle = Math.atan((model.eccentricity * Math.sin(model.currentData.trueAnomaly)) / (1+model.eccentricity * Math.cos(model.currentData.trueAnomaly)));
            model.currentData.flightPathAngleDeg = model.currentData.flightPathAngle * 180 / Math.PI;
            model.currentData.escapeVelocity = Math.sqrt(2*model.centralBody.gravitationalParameter/model.currentData.r);
            model.currentData.circularVelocity = Math.sqrt(model.centralBody.gravitationalParameter/model.currentData.r);
        }
    };


/*
var model = {
    
    eccentricity: 0.6,
    perigeeHeight: 200,
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
*/

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
    velocity:           { color: "orange" },
    normalVelocity:     { color: "red" },
    radialVelocity:     { color: "blue" },
    trueAnomaly:        { color: "purple", opacity: 0.5 },
    flightPathAngle:    { color: "green", opacity: 0.3 },
    
    init: function viewController_init() {
        // Get the element that should contain the SVG
        viewController.container = d3.select("#conic_section_velocity_components")
            .style("position","relative"); // Position relative to be able to absolutely position the button
        viewController.controllerContainer = d3.select("#conic_section_velocity_components_controls");
            
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
            console.log(currentData.v)
            viewOrbit.updateSatellitePosition();
            viewHodograph.updateSatellitePosition();
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
    addControls: function() {
        viewController.controllerContainer.append("div")
            .html("<b>Input:</b>");
        // Semi latus rectum
        viewController.semiLatusRectumSliderDiv = viewController.controllerContainer.append("div")
            .attr("float","right");
        viewController.semiLatusRectumSlider = viewController.semiLatusRectumSliderDiv.append("input")
            .attr("id",prefix + "_semilatusrectumslider")                
            .attr("type","range")
            .attr("min","100")
            .attr("max","40000")
            .attr("step","200")
            .style("width","100%")
            .property("value",model.semiLatusRectum)
            .on("input",function(){
                var positionInOrbit = viewController.frame / model.numSteps;
                model.semiLatusRectum = parseFloat(viewController.semiLatusRectumSlider.property("value")); 
                model.init();
                viewOrbit.setOrbitPlotGeometry();
                if (true) {
                     viewOrbit.setScale(); 
                }
                viewOrbit.updateOrbit();
                viewOrbit.updateSatellitePosition(); 
                viewHodograph.updateOrbit();
                viewHodograph.updateSatellitePosition();
            } );
        viewController.semiLatusRectumLabel = viewController.semiLatusRectumSliderDiv.append("span")
            .attr("class","sliderAnnotation")
            .style("color",viewController.semiLatusRectumColor)
            .html("$p = $")
            .append("span")
                .attr("class","semilatusrectumvalue");
        
        // Eccentricity
        viewController.eccentricitySliderDiv = viewController.controllerContainer.append("div")
            .attr("float","left");
        viewController.eccentricitySlider = viewController.eccentricitySliderDiv.append("input")        
            .attr("id",prefix + "_eccentricityslider")
            .attr("type","range")
            .attr("min","0")
            .attr("max","4")
            .attr("step","0.02")
            .style("width","100%")
            .property("value",model.eccentricity)
            .on("input",function(){
                var positionInOrbit = viewController.frame / model.numSteps;
                model.eccentricity = parseFloat(viewController.eccentricitySlider.property("value")); 
                model.init();
                viewOrbit.setOrbitPlotGeometry();
                if (true) { 
                    viewOrbit.setScale(); 
                }
                viewOrbit.updateOrbit();
                viewOrbit.updateSatellitePosition();
                viewHodograph.updateOrbit();
                viewHodograph.updateSatellitePosition();                
            } );
        viewController.eccentricityLabel = viewController.eccentricitySliderDiv.append("span")
            .attr("class","sliderAnnotation")
            .html("$e = $")
            .append("span")
                .attr("class","eccentricityvalue");
        
        // True Anomaly
        viewController.trueAnomalySliderDiv = viewController.controllerContainer.append("div")
            .attr("float","left");
        viewController.trueAnomalySlider = viewController.trueAnomalySliderDiv.append("input")
            .classed("trueAnomaly", true)
            .attr("id",prefix + "_trueanomalyslider")
            .attr("type","range")
            .attr("min",-180)
            .attr("max",180)
            .attr("step","2")
            .property("value",parseFloat(model.currentData.trueAnomaly*180/Math.PI))
            .on("input",function(){
                model.computeCurrentDataFromTrueAnomaly(viewController.trueAnomalySlider.property("value")/180*Math.PI)
                viewOrbit.updateSatellitePosition();
                viewHodograph.updateSatellitePosition();
            } );
        viewController.trueAnomalyLabel = viewController.trueAnomalySliderDiv.append("div")
            .classed("sliderAnnotation trueanomaly", true)
            .html('$\\theta = $&nbsp;')
        viewController.trueAnomalyValue = viewController.trueAnomalyLabel
            .append("span")
            .attr("class","trueanomalyvalue");
        viewController.controllerContainer.append("div")
            .html("</br><b>Output:</b>");
        viewController.radiusValueDiv = viewController.controllerContainer.append("div");
        viewController.radiusValueLabel = viewController.controllerContainer.append("div")
            .classed("sliderAnnotation radius", true)
            .html("$r = $")
            .append("span")
                .classed("radiusvalue", true);
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
            .attr("id","satcircle")
    		.attr("fill","gray")
    		.attr("stroke","white")
    		.attr("stroke-width","1px")
    		.attr("r",5);            
    },    
    updateSatellitePosition: function updateSatellitePosition() {
                
        d3.select("#v").html(model.currentData.v.toFixed(1));
        d3.select("#vr").html(model.currentData.vradial.toFixed(1));
        d3.select("#vtheta").html(model.currentData.vnormal.toFixed(1));        

        // Set up transformations
        var transformPosition = "translate(" + viewOrbit.xScale(model.currentData.x) + "," + viewOrbit.yScale(model.currentData.y) + ")";
        var transformVelocity = "rotate("+ (-1*(model.currentData.trueAnomalyDeg+90-model.currentData.flightPathAngleDeg)) +")";
        var transformRadialVelocity = "rotate("+ (-1*model.currentData.trueAnomalyDeg) +")";
        
        // Satellite position and radius fom central body
        viewOrbit.satellite
            .attr("transform",transformPosition);
        viewOrbit.satRadius
            .attr("x1",viewOrbit.xScale(0))
            .attr("y1",viewOrbit.yScale(0))
            .attr("x2",viewOrbit.xScale(model.currentData.x))
            .attr("y2",viewOrbit.yScale(model.currentData.y));

        // Velocity vector and orthogonal components
        viewOrbit.satVelocity
            .attr("x2",model.currentData.v * viewOrbit.velocityScale)
            .attr("transform",transformVelocity);
        viewController.scaleArrowStyle(viewOrbit.satVelocity,model.currentData.v*viewOrbit.velocityScale);

        viewOrbit.satRadialVelocity
            .attr("x2",model.currentData.vradial * viewOrbit.velocityScale)
            .attr("transform",transformRadialVelocity);
        viewController.scaleArrowStyle(viewOrbit.satRadialVelocity,model.currentData.vradial*viewOrbit.velocityScale);

        viewOrbit.satNormalVelocity
            .attr("y2",-1 * (model.currentData.vnormal * viewOrbit.velocityScale))
            .attr("transform",transformRadialVelocity);
        viewController.scaleArrowStyle(viewOrbit.satNormalVelocity,model.currentData.vnormal*viewOrbit.velocityScale);            

        // Dashed helper lines for velocity components
        viewOrbit.satRadialVelocityHelper
            .attr("x1",0)
            .attr("y1",-1 * (model.currentData.vnormal * viewOrbit.velocityScale))
            .attr("x2",model.currentData.vradial * viewOrbit.velocityScale)
            .attr("y2",-1 * (model.currentData.vnormal * viewOrbit.velocityScale))
            .attr("transform",transformRadialVelocity);

        viewOrbit.satNormalVelocityHelper
            .attr("x1",model.currentData.vradial * viewOrbit.velocityScale)
            .attr("y1",0)
            .attr("x2",model.currentData.vradial * viewOrbit.velocityScale)
            .attr("y2",-1 * (model.currentData.vnormal * viewOrbit.velocityScale))
            .attr("transform",transformRadialVelocity);

        // Flight path angle
        var endAngle = -model.currentData.trueAnomaly+3/2*Math.PI;
        var startAngle = -model.currentData.trueAnomaly+3/2*Math.PI+model.currentData.flightPathAngle;
        viewOrbit.flightPathAngle
            .attr("d",anglesToArcPath(function(d){return d;},function(d){return d;},0,0,30,startAngle,endAngle,1,0));

        // True anomaly angle
        var trueAnomaly = model.currentData.trueAnomaly;
        if (trueAnomaly < 0) { trueAnomaly += Math.PI * 2;}
        viewOrbit.trueanomaly
            .attr("d",anglesToArcPath(viewOrbit.xScale,viewOrbit.yScale,0,0,model.centralBody.radius*2,0,trueAnomaly,0,0));
            
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
        viewHodograph.updateSatellitePosition();
    },
    addAxes: function()
    {
        var xAxisHodograph = d3.svg.axis()
          .scale(viewHodograph.xScale)
          .tickValues([-8, -6,-4,-2, 0, 2, 4, 6, 8])
          .orient("bottom");
        viewHodograph.graph.append('svg:g')
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
            .attr("x", viewHodograph.xScale(8) )
            .attr("y", viewHodograph.yScale(-2) )
            .style("text-anchor", "end")
            .style("font-family","sans-serif")
            .style("font-size","9pt")
            .style("opacity",1.0)
            .text("Radial velocity (km/s)");

        viewHodograph.graph.append('svg:text')
            .attr("x", viewHodograph.xScale(0) )
            .attr("y", viewHodograph.yScale(12.8) )
            .style("text-anchor", "middle")
            .style("font-family","sans-serif")
            .style("font-size","9pt")
            .style("opacity",1.0)
            .text("Normal velocity (km/s)");

            
    },

    addOrbit: function() 
    {
        viewHodograph.hodographCircle = viewHodograph.graph.append("svg:circle")
            .classed('hodographCircle', true)
            .attr("cx",viewHodograph.xScale(0));
        viewHodograph.trueAnomaly = viewHodograph.graph.append("path")
            .classed('trueAnomaly', true)
            .attr("transform","rotate(-90,"+ viewHodograph.xScale(0) + "," + viewHodograph.yScale(viewHodograph.hodographCenter) + ")");

    },    

    addSatellite: function() 
    {
        viewHodograph.escapeVelocityHodograph = viewHodograph.graph.append("circle")
            .classed('escapeVelocity', true)
            .attr("cx",viewHodograph.xScale(0))
            .attr("cy",viewHodograph.yScale(0))
            .style("visibility","hidden");
            
        viewHodograph.flightPathAngle = viewHodograph.graph.append("path")
            .classed('flightPathAngle', true);

        viewHodograph.velocityRadius = viewHodograph.graph.append("line")
            .classed('satRadius', true);

        viewHodograph.satRadialVelocity = viewHodograph.graph.append("g").append("line")
            .classed('radialVelocity', true)
            .attr("x1",viewHodograph.xScale(0))
            .attr("y1",viewHodograph.yScale(0))
            .attr("y2",viewHodograph.yScale(0));

        viewHodograph.satNormalVelocity = viewHodograph.graph.append("g").append("line")
            .classed('normalVelocity', true)
            .attr("x1",viewHodograph.xScale(0))
            .attr("y1",viewHodograph.yScale(0))
            .attr("x2",viewHodograph.xScale(0))

        viewHodograph.satRadialVelocityHelper = viewHodograph.graph.append("line")
            .classed('velocityHelper', true);

        viewHodograph.satNormalVelocityHelper = viewHodograph.graph.append("line")
            .classed('velocityHelper', true);

        viewHodograph.satVelocity = viewHodograph.graph.append("g").append("line")
            .classed('velocity', true)
            .attr("x1",viewHodograph.xScale(0))
            .attr("y1",viewHodograph.yScale(0));            

        viewHodograph.circularVelocityHodograph = viewHodograph.graph.append("circle")
            .classed('circularVelocity', true)
            .attr("cx",viewHodograph.xScale(0))
            .attr("r",4);            

        viewHodograph.hodographOrigin = viewHodograph.graph.append("circle")
            .classed('satCircle', true)
    		.attr("r",5)
            .attr("cx",viewHodograph.xScale(0))
            .attr("cy",viewHodograph.yScale(0));
    },  
      
    updateSatellitePosition: function updateSatellitePosition() 
    {        
        viewController.scaleArrowStyle(viewHodograph.satRadialVelocity,viewHodograph.xScale(model.currentData.vradial)-viewHodograph.xScale(0));
        viewHodograph.satRadialVelocity
            .attr("x2",viewHodograph.xScale(model.currentData.vradial ));
        viewHodograph.satNormalVelocity
            .attr("y2",viewHodograph.yScale(model.currentData.vnormal ));            
        viewHodograph.satVelocity
            .attr("x2",viewHodograph.xScale(model.currentData.vradial))
            .attr("y2",viewHodograph.yScale(model.currentData.vnormal));
        viewHodograph.satRadialVelocityHelper
            .attr("x1",viewHodograph.xScale(0))
            .attr("y1",viewHodograph.yScale(model.currentData.vnormal))
            .attr("x2",viewHodograph.xScale(model.currentData.vradial))
            .attr("y2",viewHodograph.yScale(model.currentData.vnormal));
        viewHodograph.satNormalVelocityHelper
            .attr("x1",viewHodograph.xScale(model.currentData.vradial))
            .attr("y1",viewHodograph.yScale(0))
            .attr("x2",viewHodograph.xScale(model.currentData.vradial))
            .attr("y2",viewHodograph.yScale(model.currentData.vnormal));

        viewHodograph.circularVelocityHodograph
            .attr("cy",viewHodograph.yScale(model.currentData.circularVelocity))

        viewHodograph.escapeVelocityHodograph
            .attr("r",viewHodograph.yScale(0)-viewHodograph.yScale(model.currentData.escapeVelocity));

        viewHodograph.flightPathAngle
            .attr("d",anglesToArcPath(viewHodograph.xScale,viewHodograph.yScale,0,
                0,1.6,Math.PI/2,Math.PI/2-model.currentData.flightPathAngle,0,0));

        var trueAnomaly = model.currentData.trueAnomaly;
        var fliplargearc = 0;
        if (trueAnomaly < 0) { trueAnomaly += Math.PI * 2;}
        if (trueAnomaly > Math.PI) { fliplargearc = 1; }
        var startangle = 0;
        var endangle = -trueAnomaly;

        viewHodograph.trueAnomaly
            .attr("d",anglesToArcPath(viewHodograph.xScale,viewHodograph.yScale,0,
                viewHodograph.hodographCenter,1.6,startangle,endangle,0,fliplargearc));

        viewHodograph.velocityRadius
            .attr("x1",viewHodograph.xScale(0))
            .attr("y1",viewHodograph.yScale(viewHodograph.hodographCenter))
            .attr("x2",viewHodograph.xScale(model.currentData.vradial))
            .attr("y2",viewHodograph.yScale(model.currentData.vnormal));
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
                .x( function (d) { return (viewHodograph.xScale(d.vradial)); } )
                .y( function (d) { return (viewHodograph.yScale(d.vnormal)); } )
    };
    
controller.init();

}) ();

