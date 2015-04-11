function orbitLineType(eccentricity) {
    console.log("Eccentricity: " + eccentricity);
    if (eccentricity < 1) { 
        return "cardinal-closed"; 
    } else { 
        return "cardinal"; 
    }
}

function render_form() {
    var form = d3.select("#form")
        
    form.append("h4").text("Time");
    form.append("label").html("Simulation time:").attr("name","simulationtime");
    simulationTime = form.append("span")
    	.attr("id","simulationtime")
    	.attr("class","formdisplay");

    form.append("br");	
        
    form.append("label").html("Time since perigee:").attr("name","timesinceperigee");
    timeSincePerigee = form.append("span")
    	.attr("id","timesinceperigee")
    	.attr("class","formdisplay");

	form.append("br");
    	
    form.append("label").html("Animation frame:").attr("name","animationframe");
    animationFrame = form.append("input")
    	.attr("type","text")
    	.attr("id","animationframe")
    	.attr("class","formdisplay")
    	.attr("name","animationframe");
}

function render_spacecraft(graph,data) {
	var svg = graph.element;
    semiMajorAxis = d3.select("input#semimajoraxis")
        .attr("value",data.semiMajorAxis.toFixed(0) );
    eccentricity = d3.select("input#eccentricity")
        .attr("value",data.eccentricity.toFixed(2) );
    eccentricityDisplay = d3.select("input#eccentricitydisplay")
        .attr("value",data.eccentricity.toFixed(2) );
    perigeeHeight = d3.select("input#perigeeheight")
        .attr("value",data.perigeeHeight.toFixed(2) );
    perigeeHeightDisplay = d3.select("input#perigeeheightdisplay")
        .attr("value",data.perigeeHeight.toFixed(2) );
    trueAnomaly = d3.select("input#trueanomaly")
    showVelocity = d3.select("input#showvelocity");
    showRadialVelocity = d3.select("input#showradialvelocity");
    showNormalVelocity = d3.select("input#shownormalvelocity");

	svg.append("defs")
	    .append("marker")
	    .attr("id","velocityArrowHead")
	    .attr("markerWidth","4")
	    .attr("markerHeight","2")
	    .attr("refX","0")
	    .attr("refY","1")
	    .attr("orient","auto")
	    .append("path")
	        .attr("d","M 0 0 4 1 0 2 Z");

	svg.append("defs")
	    .append("marker")
	    .attr("id","radialVelocityArrowHead")
	    .attr("markerWidth","4")
	    .attr("markerHeight","2")
	    .attr("refX","0")
	    .attr("refY","1")
	    .attr("orient","auto")
	    .append("path")
	        .attr("d","M 0 0 4 1 0 2 Z")
	        .attr("style","fill: red;");
	        
	svg.append("defs")
	    .append("marker")
	    .attr("id","normalVelocityArrowHead")
	    .attr("markerWidth","4")
	    .attr("markerHeight","2")
	    .attr("refX","0")
	    .attr("refY","1")
	    .attr("orient","auto")
	    .append("path")
	        .attr("d","M 0 0 4 1 0 2 Z")
	        .attr("style","fill: blue;");		        
	
    radialVelocity = svg.append("line")
        .attr("id","radialVelocity")
        .attr("x1",0)
        .attr("y1",0)
        .attr("x2",graph.xscale(data.vradial))
        .attr("transform","rotate(10)");

    normalVelocity = svg.append("line")
        .attr("id","normalVelocity")
        .attr("x1",0)
        .attr("y1",0)
        .attr("x2",graph.xscale(data.vnormal))
        .attr("transform","rotate(20)");
        
    velocity = svg.append("line")
        .attr("id","velocity")
        .attr("x1",0)
        .attr("y1",0)
        .attr("x2",graph.xscale(data.v))
        .attr("transform","rotate(30)");

    radius = svg.append("line")
        .attr("id","radius")
        .attr("stroke","gray")
        .attr("stroke-width","1")
        .attr("x1",graph.xscale(0))
        .attr("y1",graph.yscale(0))
        .attr("x2",graph.xscale(data.x))
        .attr("y2",graph.yscale(data.y));
        
	satcircle = svg.append("g")
			.append("circle")
	        .attr("id","satcircle")
    			.attr("cx",0)
    			.attr("cy",0)
    			.attr("r",5)
    			.attr("fill","gray")
    			.attr("stroke","none");
}

function move_spacecraft(data) {
	var transformPosition = "translate(" + trajectoryGraph.xscale(data.x) + "," + trajectoryGraph.yscale(data.y) +")";
	var transformRadialVelocity = transformPosition + " rotate("+ (-1*data.trueAnomalyDeg) +")";
	var transformNormalVelocity = transformPosition + " rotate("+ (-1*(data.trueAnomalyDeg+90)) +")";
	var transformVelocity       = transformPosition + " rotate("+ (-1*(data.trueAnomalyDeg+90-data.flightPathAngleDeg)) +")";
	satcircle.attr("transform",transformPosition);
    velocity
        .attr("x2",data.v * velocityscale)
        .attr("transform",transformVelocity);
    radialVelocity
        .attr("x2",data.vradial * velocityscale)
        .attr("transform",transformRadialVelocity);
    normalVelocity
        .attr("x2",data.vnormal * velocityscale)
        .attr("transform",transformNormalVelocity);
    radius
        .attr("x2",trajectoryGraph.xscale(data.x))
        .attr("y2",trajectoryGraph.yscale(data.y));
    simulationTime.text(data.simulationTime.toString().toHHMMSS());
    timeSincePerigee.text(data.timeSincePerigee.toString().toHHMMSS());
    trueAnomaly.attr("value",((data.trueAnomaly)*180/(Math.PI)).toFixed(0));
	animationFrame.attr("value",data.simulationFrame);
}

function Ranges(data, aspectRatio) {
	out = {};
	out.xmin = d3.min(data, function(d) { return d.x;} );
	out.xmax = d3.max(data, function(d) { return d.x;} );
	out.ymin = d3.min(data, function(d) { return d.y;} );
	out.ymax = d3.max(data, function(d) { return d.y;} );

	if ((out.xmax-out.xmin) > (out.ymax-out.ymin)) {
		out.ymax = (out.xmax-out.xmin)/2 * aspectRatio;
        out.ymin = -1*out.ymax;
    } else {
    	out.xmax = (out.ymax-out.ymin)/2 * aspectRatio;
        out.xmin = -1*out.xmax;										            
    }
    return out;
}

function newGraphProperties(canvas, margin, ranges) {								
	var graph = {};
	graph.width  = canvas.width - margin.left - margin.right;
	graph.height = canvas.height - margin.top - margin.bottom;
	graph.element = canvas.element.append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");


    // include logic here to maintain aspect ratio, instead of in Ranges?

    graph.scale = (graph.width)/(ranges.xmax-ranges.xmin);
	graph.xscale = d3.scale.linear()
		.range([0,graph.width])
		.domain([ranges.xmin,ranges.xmax]);
	graph.yscale = d3.scale.linear() 
		.range([0,graph.height])
		.domain([ranges.ymax,ranges.ymin]);
		
	return graph;
}


function newOrbit() {
    restartAnimation = false;
    if (animationRunning) { 
	    startStopAnimation(); 
	    restartAnimation = true; 
	}
    var newEccentricity = parseFloat(eccentricity.property("value"));
    var newPerigeeHeight = parseFloat(perigeeHeight.property("value"));
    keplerOrbit = new astro.KeplerOrbit(astro.earth, newPerigeeHeight, newEccentricity);
	eccentricityDisplay
	            .attr("value",newEccentricity.toFixed(2) );

    physicalTimeDuration = keplerOrbit.period;

    simulationTimeDuration = 10;
    framesPerSecond = 60;
    frameDurationMilliSeconds = 1000 / framesPerSecond;
    numSteps = simulationTimeDuration * framesPerSecond;

    twobody_data = [];
    twobody_data = astro.compute_twobody( keplerOrbit,
									physicalTimeDuration,
									numSteps);

    ranges = Ranges(twobody_data,1);
	
	trajectoryGraph = newGraphProperties(canvas, margins, ranges);

    xAxis.transition().duration(transitionDuration)
        .attr("x1",trajectoryGraph.xscale(ranges.xmin))
        .attr("y1",trajectoryGraph.yscale(0))
        .attr("x2",trajectoryGraph.xscale(ranges.xmax))
        .attr("y2",trajectoryGraph.yscale(0));

	// Y-axis
    yAxis.transition().duration(transitionDuration)
        .attr("x1",trajectoryGraph.xscale(0))
        .attr("y1",trajectoryGraph.yscale(ranges.ymin))
        .attr("x2",trajectoryGraph.xscale(0))
        .attr("y2",trajectoryGraph.yscale(ranges.ymax));

    radius.transition().duration(transitionDuration)
        .attr("x1",trajectoryGraph.xscale(0))
        .attr("y1",trajectoryGraph.yscale(0))
        .attr("x2",trajectoryGraph.xscale(twobody_data[indx].x))
        .attr("y2",trajectoryGraph.yscale(twobody_data[indx].y));    

    
	orbit.transition().duration(transitionDuration)
	    .attr("d", orbitLineFunction(twobody_data,newEccentricity));

	centralBody.transition().duration(transitionDuration)
	    .attr("cx",trajectoryGraph.xscale(0))
        .attr("cy",trajectoryGraph.yscale(0))
		.attr("r",trajectoryGraph.scale*twobody_data[indx].centralBody.radius)

	transform = "translate(" + trajectoryGraph.xscale(twobody_data[indx].x) + "," 
	                         + trajectoryGraph.yscale(twobody_data[indx].y) +")";
	                         
	satcircle.transition().duration(transitionDuration)
		.attr("transform",transform)
		.each('end',function(){ restartAnim(restartAnimation) });

    function restartAnim(restart) {
		if (true) { startStopAnimation(); }
    }
}

d3.select("#startstopbutton").on("click",function(d, i){startStopAnimation();});

var showVelocity;

render_form();
/*
canvas = {
	width: 500,
	height: 500
}
*/
canvas = {};
canvas.element = d3.select("svg#svg_animation")
/*
	.attr("width",canvas.width)
	.attr("height",canvas.height);
*/
canvas.width = parseInt(canvas.element.style("width"));
canvas.height = parseInt(canvas.element.style("height"));

margins = {
    left: 75,
    right: 75,
    top: 75,
    bottom: 75
};

var firstEccentricity = 0.3;
var firstPerigeeHeight = 1500;
keplerOrbit = new astro.KeplerOrbit(astro.earth, firstPerigeeHeight, firstEccentricity); // central body, perigee height, eccentricity

var physicalTimeDuration = keplerOrbit.period;
var transitionDuration = 200;
var restartAnimation = false;     
var simulationTimeDuration = 10;
var framesPerSecond = 60;
var frameDurationMilliSeconds = 1000 / framesPerSecond;
var numSteps = simulationTimeDuration * framesPerSecond;

var twobody_data = [];
twobody_data = astro.compute_twobody( keplerOrbit,
								physicalTimeDuration,
								numSteps);
								   	
var ranges = Ranges(twobody_data,1)
// Scales

var trajectoryGraph = newGraphProperties(canvas, margins, ranges);
var velocityscale = 15;

// Start drawing
var svg = trajectoryGraph.element;
    
// Central body
centralBody = svg.append("circle")
	.attr("id","earth")
	.attr("cx",trajectoryGraph.xscale(0))
	.attr("cy",trajectoryGraph.yscale(0))
	.attr("r",trajectoryGraph.scale*twobody_data[0].centralBody.radius)
	.attr("fill","#F0F0F0")
	.attr("fill-opacity",1)
	.attr("stroke","gray");

// X-axis        
xAxis = svg.append("line")
    .attr("stroke","gray")
    .attr("stroke-width", "1")
    .attr("x1",trajectoryGraph.xscale(ranges.xmin))
    .attr("y1",trajectoryGraph.yscale(0))
    .attr("x2",trajectoryGraph.xscale(ranges.xmax))
    .attr("y2",trajectoryGraph.yscale(0));

// Y-axis
yAxis = svg.append("line")
    .attr("stroke","gray")
    .attr("stroke-width", "1")
    .attr("x1",trajectoryGraph.xscale(0))
    .attr("y1",trajectoryGraph.yscale(ranges.ymin))
    .attr("x2",trajectoryGraph.xscale(0))
    .attr("y2",trajectoryGraph.yscale(ranges.ymax));

// Orbit
orbitLineFunction = function(d,eccentricity) {
    console.log("e " + eccentricity);
    var interpolationType = "cardinal";
    if (eccentricity < 1) { interpolationType = "cardinal-closed"; }
    return d3.svg.line()
        .x( function (d) { return (trajectoryGraph.xscale(d.x)); } )
        .y( function (d) { return (trajectoryGraph.yscale(d.y)); } )
        .interpolate(interpolationType);
}();

orbit = svg.append("path")
    .attr("d",orbitLineFunction(twobody_data,firstEccentricity))
    .attr("fill","none")
    .attr("stroke","black")
    .attr("stroke-width", "2");

render_spacecraft(trajectoryGraph,twobody_data[0]);
move_spacecraft(twobody_data[0]);

// Interactivity
eccentricity.on("input",function() { eccentricityDisplay.attr("value",parseFloat(eccentricity.property("value")).toFixed(2)); });
perigeeHeight.on("input", function() { perigeeHeightDisplay.attr("value",parseFloat(perigeeHeight.property("value")).toFixed(2)); } );
eccentricity.on("input", function() { newOrbit() } );
perigeeHeight.on("input", function() { newOrbit() } );

// Start animation
var indx = 0;	
var animationID;
var animationRunning = false;

function startStopAnimation() {
    var button = d3.select("#startstopbutton");
    if (animationRunning) {
		animationRunning = false;
		button.html("Start");
		clearInterval(animationID);
    } else {
	    animationRunning = true;
		button.html("Stop");
		animationID = setInterval(function () {
			indx = indx + 1;
			if (indx > numSteps-1) { indx = 0; }
			move_spacecraft(twobody_data[indx])
	    }, frameDurationMilliSeconds, twobody_data);
	}
}

