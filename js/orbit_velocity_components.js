function sign(x){return x>0?1:x<0?-1:x;}
var ORBIT_VELOCITY_COMPONENTS = (function() {

var model = {
    
    eccentricity: 0.5,
    perigeeHeight: 2*6378,
    framesPerSecond: 60,
    simulationTimeDuration: 2,

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
        view.init();
        view.animate();
    },
};

var view = {
    frame: 0,
    plotAxes: true,
    marginMin: { top: 20, right: 250, bottom: 20, left: 20},
    margin: { top: 50, right: 150, bottom: 50, left: 50 },
    arrowLength: 0,
    arrowWidth: 0,
    aspectRatio: 1.77,
    interpolationType: "cardinal",

    init: function view_init() {
        // Get the element that should contain the SVG
        view.container = d3.select("#orbit_velocity_components")
            .style("position","relative"); // Position relative to be able to absolutely position the button
        view.canvasWidth = parseInt(view.container.style('width'), 10);
        view.canvasHeight = view.canvasWidth / view.aspectRatio;
        // Add the SVG
        view.svg = view.container.append("svg");
        view.svg.attr("width", view.canvasWidth)
                .attr("height", view.canvasHeight)
                .style("shape-rendering","geometricPrecision");
        view.graphOrbit = view.svg.append("g");
        view.graphHodograph = view.svg.append("g");
                                
        view.addControls();
        view.addMarkers();
        view.setOrbitPlotGeometry();
        view.addAxes();
        view.addOrbit();
        view.addSatellite();
        view.updateOrbit();
        view.updateSatellitePosition(model.twoBodyData[0]);
    },
    startStopAnimation: function startStopAnimation() {
        if (view.animationRunning) {
    		view.animationRunning = false;
    		view.startStopButton.html("Play");
        } else {
    	    view.animationRunning = true;
    		view.startStopButton.html("Stop");
    	}
    },
    setOrbitPlotGeometry: function setOrbitPlotGeometry() {
        var dataAspectRatio = (model.xMax - model.xMin) / (model.yMax - model.yMin);
        // Assume data is very tall (hyperbolic orbit)
        view.plotHeight = view.canvasHeight - view.marginMin.top - view.marginMin.bottom;
        view.plotWidth = dataAspectRatio * view.plotHeight;
        if (view.plotWidth > (view.canvasWidth - view.marginMin.left - view.marginMin.right)) { // Plot is very wide (elliptical orbit)
            view.plotWidth = view.canvasWidth - view.marginMin.left - view.marginMin.right;
            view.plotHeight = view.plotWidth * (1 / dataAspectRatio);
            view.margin.left = view.marginMin.left;
            view.margin.right = view.marginMin.right;
            view.margin.top = (view.canvasHeight - view.plotHeight) / 2;
            view.margin.bottom = view.margin.top;
        } else {
            view.margin.top = view.marginMin.top;
            view.margin.bottom = view.marginMin.bottom;
            view.margin.left = view.marginMin.left;
            view.margin.right = view.marginMin.right;
        }
        view.xScale = d3.scale.linear().range([0,  view.plotWidth]).domain([model.xMin,model.xMax]);
        view.yScale = d3.scale.linear().range([view.plotHeight, 0]).domain([model.yMin,model.yMax]);
        view.xScaleHodograph = d3.scale.linear().range([view.canvasWidth-200,view.canvasWidth]).domain([-8,8]);
        view.yScaleHodograph = d3.scale.linear().range([view.canvasHeight-200,view.canvasHeight-400]).domain([0,16]);
        view.velocityScale = view.plotWidth / 30;
        view.plotScale = (view.plotWidth)/(model.xMax - model.xMin);
        view.graphOrbit.attr("transform", "translate(" + view.margin.left + "," + view.margin.top + ")");
        console.log(view.margin.top);
    },
    animate: function animate() {
        requestAnimationFrame( animate );
        if (view.animationRunning) {
            view.frame++;
            if (view.frame >= model.numSteps) { view.frame = 0; }
            var currentData = model.twoBodyData[view.frame];
            view.updateSatellitePosition(currentData);
            view.frameSlider.property("value",view.frame);
        }
    },
    addControls: function() {
        // UI elements
        view.startStopButton = view.container.append("button")
            .attr("id","startstopbutton")
            .html("Play")
            .style("background","rgba(240,240,240,0.9)")
            .style("position", "absolute")
            .style("right","10px")
            .style("top","10px")
            .on("click",function(d, i){ view.startStopAnimation(); });
        view.frameSlider = view.container.append("input")
            .attr("id","frameslider")
            .attr("type","range")
            .attr("min","0")
            .attr("max",model.numSteps - 1)
            .attr("step","1")
            .style("width",view.canvasWidth + "px")
            .property("value",view.frame)
            .on("input",function(){ 
                view.frame = view.frameSlider.property("value"); 
                view.updateSatellitePosition(model.twoBodyData[view.frame]); 
            } );
        view.eccentricitySlider = view.container.append("input")
            .attr("id","eccentricityslider")
            .attr("type","range")
            .attr("min","0")
            .attr("max","2")
            .attr("step","0.05")
            .style("width",300)
            .property("value",model.eccentricity)
            .on("input",function(){
                var positionInOrbit = view.frame / model.numSteps;
                model.eccentricity = parseFloat(view.eccentricitySlider.property("value")); 
                model.init();
                view.frame = parseInt(positionInOrbit * model.numSteps);
                view.frameSlider.property("value",view.frame);
                view.setOrbitPlotGeometry();
                view.updateOrbit();
                view.updateSatellitePosition(model.twoBodyData[view.frame]); 
            } );
        view.perigeeSlider = view.container.append("input")
            .attr("id","perigeeslider")
            .attr("type","range")
            .attr("min","0")
            .attr("max","12000")
            .attr("step","100")
            .style("width",300)
            .property("value",model.perigeeHeight)
            .on("input",function(){
                var positionInOrbit = view.frame / model.numSteps;
                model.perigeeHeight = parseFloat(view.perigeeSlider.property("value")); 
                model.init();
                view.frame = parseInt(positionInOrbit * model.numSteps);
                view.frameSlider.property("value",view.frame);
                view.setOrbitPlotGeometry();
                view.updateOrbit();
                view.updateSatellitePosition(model.twoBodyData[view.frame]); 
            } );
            
    },
    addMarkers: function() {
        // Markers for arrowheads
        function addArrowMarker(config) {
            var arrowPath = "M 0 0 " + config.arrowLength + " "+ config.arrowWidth  / 2 + " 0 "+ config.arrowWidth +" Z";
            config.element.append("marker")
                .attr("id",config.id)
                .attr("markerWidth",config.arrowLength)
                .attr("markerHeight",config.arrowWidth)
                .attr("refX","0")
                .attr("refY",config.arrowWidth/2)
                .attr("orient","auto")
                .style("fill",config.color)
                .append("path")
                    .attr("d",arrowPath); 
        }
        view.defs = view.svg.append("defs");
        addArrowMarker({element: view.defs, id:"velocityArrowHead", arrowLength: view.arrowLength, arrowWidth:view.arrowWidth, color:"orange"});
        addArrowMarker({element: view.defs, id:"radialVelocityArrowHead", arrowLength: view.arrowLength, arrowWidth:view.arrowWidth, color:"red"});        
        addArrowMarker({element: view.defs, id:"normalVelocityArrowHead", arrowLength: view.arrowLength, arrowWidth:view.arrowWidth, color:"blue"});        
    },
    addAxes: function() {
        var xAxisHodograph = d3.svg.axis()
          .scale(view.xScaleHodograph)
          .tickValues([-8, -6,-4,-2, 0, 2, 4, 6, 8])
          .orient("bottom");        
        var yAxisHodograph = d3.svg.axis()
          .scale(view.yScaleHodograph)
          .tickValues([2,4,6,8,10,12,14,16])
          .orient("left");
        view.svg.append('svg:g')
          .attr('class', 'axis')
          .attr('transform', 'translate(' + (0) + ',' + (201) + ')')
          .style("opacity", 0.3)
          .style("shape-rendering","crispEdges")
          .call(xAxisHodograph);
        view.svg.append('svg:g')
          .attr('class', 'axis')
          .attr('transform', 'translate(' + (view.canvasWidth-100) + ',' + (0) + ')')
          .style("opacity", 0.3)
          .style("shape-rendering","crispEdges")              
          .call(yAxisHodograph);              
    },
    updateSatellitePosition: function updateSatellitePosition(currentData) {        
        function adjustArrowLength(inputlength) {
            var vectorLength;
            if (Math.abs(inputlength) > view.arrowLength) {
                vectorLength = inputlength - (view.arrowLength * sign(inputlength));
            } else {
                vectorLength = 0 * sign(inputlength);
            }
            return vectorLength;
        }
        var transformPosition = "translate(" + view.xScale(currentData.x) + "," + view.yScale(currentData.y) + ")";
        var transformVelocity = "rotate("+ (-1*(currentData.trueAnomalyDeg+90-currentData.flightPathAngleDeg)) +")";
        var transformRadialVelocity = "rotate("+ (-1*currentData.trueAnomalyDeg) +")";
        view.satellite
            .attr("transform",transformPosition);
        view.satVelocity
            .attr("x2",adjustArrowLength(currentData.v * view.velocityScale))
            .attr("transform",transformVelocity);
        view.satRadialVelocity
            .attr("x2",adjustArrowLength(currentData.vradial * view.velocityScale))
            .attr("transform",transformRadialVelocity);
        view.satNormalVelocity
            .attr("y2",adjustArrowLength(-1 * (currentData.vnormal * view.velocityScale)))
            .attr("transform",transformRadialVelocity);
        view.satVelocityHodograph
            .attr("x2",view.xScaleHodograph(currentData.vradial ))
            .attr("y2",view.yScaleHodograph(currentData.vnormal ));
        view.satRadialVelocityHodograph
            .attr("x2",view.xScaleHodograph(currentData.vradial ));
        view.satNormalVelocityHodograph
            .attr("y2",view.yScaleHodograph(currentData.vnormal ));
            
    },    
    updateOrbit: function() {
        if (model.eccentricity < 1) { view.interpolationType = "cardinal-closed"; } else {view.interpolationType = "cardinal"; }        
        view.centralBody
            .attr("cx",view.xScale(0))
        	.attr("cy",view.yScale(0))
        	.attr("r",view.plotScale*model.twoBodyData[0].centralBody.radius);
        view.xAxis
            .attr("x1",view.xScale(model.xMin)-view.margin.left)
            .attr("y1",view.yScale(0))
            .attr("x2",view.xScale(model.xMax)+view.margin.left)
            .attr("y2",view.yScale(0));
        view.yAxis
            .attr("x1",view.xScale(0))
            .attr("y1",view.yScale(model.yMin)+view.margin.top)
            .attr("x2",view.xScale(0))
            .attr("y2",view.yScale(model.yMax)-view.margin.top);
        view.orbit
            .attr("d",view.orbitLineFunction(model.twoBodyData));
        view.hodographCircle
            .attr("cy",view.yScaleHodograph(model.keplerOrbit.centralBody.gravitationalParameter/model.keplerOrbit.angularMomentum))
            .attr("r",view.xScaleHodograph(model.keplerOrbit.centralBody.gravitationalParameter*model.keplerOrbit.eccentricity/model.keplerOrbit.angularMomentum)-view.xScaleHodograph(0))
        view.hodographCurve
            .attr("d",view.hodographLineFunction(model.twoBodyData));
        view.hodographOrigin
            .attr("cx",view.xScaleHodograph(0))
            .attr("cy",view.yScaleHodograph(0))        
        view.frameSlider
            .attr("max",model.numSteps - 1);
    },
    addOrbit: function() {
        // Central body
        view.centralBody = view.graphOrbit.append("circle")
        	.attr("id","earth")
        	.attr("fill","#eee")
        	.attr("fill-opacity",1)
        	.attr("stroke","#ddd");
        // X-axis line    
        view.xAxis = view.graphOrbit.append("line")
            .attr("stroke","gray")
            .attr("opacity","0.5")
            .attr("stroke-width", "1");
        // Y-axis line
        view.yAxis = view.graphOrbit.append("line")
            .attr("stroke","gray")
            .attr("opacity","0.5")            
            .attr("stroke-width", "1");
        view.orbit = view.graphOrbit.append("path")
            .attr("fill","none")
            .attr("stroke","black")
            .attr("stroke-width", "2");
        view.hodographCurve = view.graphHodograph.append("path")
            .attr("fill","none")
            .attr("stroke","gray")
            .attr("stroke-width","1")
        view.hodographCircle = view.graphHodograph.append("circle")
            .attr("id","hodographCircle")
            .attr("fill","none")
            .attr("stroke-width","1.5px")
            .attr("opacity","0.8")
            .attr("stroke","orange")
            .attr("cx",view.xScaleHodograph(0))            
    },
    addSatellite: function() {
        var transformPosition = "translate(" + view.xScale(model.twoBodyData[0].x) + "," + view.yScale(model.twoBodyData[0].y) + ")";
        view.satellite = view.graphOrbit.append("g")
            .attr("transform",transformPosition);
        view.satRadialVelocity = view.satellite.append("line")
            .attr("id","radialVelocity")
            .attr("x1",0)
            .attr("y1",0)
            .attr("y2",0)
            .style("stroke","red")
            .style("stroke-width","3px")
            .style("marker-end","url('#radialVelocityArrowHead')");
        view.satNormalVelocity = view.satellite.append("line")
            .attr("id","normalVelocity")
            .attr("x1",0)
            .attr("y1",0)
            .attr("x2",0)
            .style("stroke","blue")
            .style("stroke-width","3px")
            .style("marker-end","url('#normalVelocityArrowHead')");
        view.satVelocity = view.satellite.append("line")
            .attr("id","velocity")
            .attr("x1",0)
            .attr("y1",0)
            .attr("y2",0)
            .style("stroke","orange")
            .style("stroke-width","3px")
            .style("marker-end","url('#velocityArrowHead')");
        view.satRadialVelocityHodograph = view.graphHodograph.append("g").append("line")
            .attr("id","hodographRadialVelocity")
            .attr("x1",view.xScaleHodograph(0))
            .attr("y1",view.yScaleHodograph(0))
            .attr("y2",view.yScaleHodograph(0))            
            .style("stroke","red")
            .style("stroke-width","3px")
            .style("marker-end","url('#radialVelocityArrowHead')");
        view.satNormalVelocityHodograph = view.graphHodograph.append("g").append("line")
            .attr("id","hodographNormalVelocity")
            .attr("x1",view.xScaleHodograph(0))
            .attr("y1",view.yScaleHodograph(0))
            .attr("x2",view.xScaleHodograph(0))
            .style("stroke","blue")
            .style("stroke-width","3px")
            .style("marker-end","url('#normalVelocityArrowHead')");   
        view.satVelocityHodograph = view.graphHodograph.append("g").append("line")
            .attr("id","hodographVelocity")
            .attr("x1",view.xScaleHodograph(0))
            .attr("y1",view.yScaleHodograph(0))
            .style("stroke","orange")
            .style("stroke-width","3px")
            .style("marker-end","url('#velocityArrowHead')");                             
        view.satCircle = view.satellite.append("circle")
            .attr("id","satcircle")
    		.attr("fill","gray")
    		.attr("stroke","none")
    		.attr("r",5);
        view.hodographOrigin = view.graphHodograph.append("circle")
            .attr("id","satcircle")
    		.attr("fill","gray")
    		.attr("stroke","none")
    		.attr("r",5);                  
    		
    },
    orbitLineFunction: d3.svg.line()
                .x( function (d) { return (view.xScale(d.x)); } )
                .y( function (d) { return (view.yScale(d.y)); } ),
    hodographLineFunction: d3.svg.line()
                .x( function (d) { return (view.xScaleHodograph(d.vradial)); } )
                .y( function (d) { return (view.yScaleHodograph(d.vnormal)); } )
                
//                .interpolate(view.interpolationType)
};

controller.init();
}) ();