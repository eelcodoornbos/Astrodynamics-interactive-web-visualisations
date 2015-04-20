function vector() {
    var arrowLength = 4;
    var arrowWidth = 4;
    var x1 = 0;
    var y1 = 0;
    var x2 = 25;
    var y2 = 25;

    function exports(_selection) {
        _selection.each(function(_data) {
            d3.select(this).data(data).enter().append("line")
                .attr("x1",x1)
                .attr("y1",y1)
                .attr("x2",x2)
                .attr("y2",y2)
                .style("stroke","red")
                .style("stroke-width","3px")
//                .style("marker-end","url('#radialVelocityArrowHead')");
        });
    }
    
    exports.arrowWidth = function(value) {
        if (!arguments.length) return arrowWidth;
        arrowWidth = value;
        return exports;
    };    

    exports.arrowLength = function(value) {
        if (!arguments.length) return arrowLength;
        arrowLength = value;
        return exports;
    };    

    exports.x1 = function(value) {
        if (!arguments.length) return x1;
        x1 = value;
        return exports;
    };

    exports.y1 = function(value) {
        if (!arguments.length) return y1;
        y1 = value;
        return exports;
    };

    exports.x2 = function(value) {
        if (!arguments.length) return x2;
        x2 = value;
        return exports;
    };

    exports.y2 = function(value) {
        if (!arguments.length) return y2;
        y2 = value;
        return exports;
    };
    
    return exports;
}


function sign(x){return x>0?1:x<0?-1:x;}
var ORBIT_VELOCITY_COMPONENTS = (function() {

var model = {
    
    eccentricity: 0.5,
    perigeeHeight: 800,
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
    marginMin: { top: 40, right: 40, bottom: 40, left: 40},
    margin: { top: 50, right: 40, bottom: 50, left: 50 },
    orbitMaxWidthFraction: 0.6,
    hodographMaxWidthFraction: 0.3,
    arrowLength: 5,
    arrowWidth: 3,
    aspectRatio: 1.77,
    interpolationType: "cardinal",
    defaultVectorStrokeWidth: 3,

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
                .style("shape-rendering","geometricPrecision")
                .style("overflow","visible");
        view.graphOrbit = view.svg.append("g");
        view.graphHodograph = view.svg.append("g");
                                
        view.addControls();
        view.addMarkers();
        view.setOrbitPlotGeometry();
        view.addOrbit();
        view.addSatellite();
        view.addAxes();

        view.updateOrbit();
        view.updateSatellitePosition(model.twoBodyData[0]);
    },
    scaleArrowStyle: function scaleArrowStyle(element,length) {
        // Scales down the linewidth of a vector 
        // if the length is shorter than the length of the arrowhead.
        var linewidth;
        if (Math.abs(length) < view.arrowLength * view.defaultVectorStrokeWidth) {
            linewidth = Math.abs(length) / (view.arrowLength) + "px";
        } else {
            linewidth = view.defaultVectorStrokeWidth + "px";
        }
        element.style("stroke-width",linewidth);
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
        if (view.plotWidth > ( (view.canvasWidth - view.marginMin.left - view.marginMin.right) * view.orbitMaxWidthFraction)) { 
            // Plot is very wide (elliptical orbit)
            view.plotWidth = ( view.canvasWidth - view.marginMin.left - view.marginMin.right) * view.orbitMaxWidthFraction;
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
        view.graphOrbit.attr("transform", "translate(" + view.margin.left + "," + view.margin.top + ")");
        view.plotScale = (view.plotWidth)/(model.xMax - model.xMin);
        view.velocityScale = 200/16;

        view.hodographHeight = 0.5* (view.canvasHeight - view.marginMin.top - view.marginMin.bottom);
        view.hodographWidth = view.hodographHeight * 16/12;
//        view.hodographWidth = (view.canvasWidth - view.marginMin.left - view.marginMin.right) * view.hodographMaxWidthFraction;

        view.xScaleHodograph = d3.scale.linear().range([0,view.hodographWidth]).domain([-8,8]);
        view.yScaleHodograph = d3.scale.linear().range([view.hodographHeight,0]).domain([0,12]);

        view.graphHodograph.attr("transform", "translate(" + (view.canvasWidth - view.marginMin.right - view.hodographWidth) + "," + view.marginMin.top + ")");        
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
            .attr("max","1.5")
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
                .attr("refX",config.arrowLength)
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
          .tickValues([2,4,6,8,10,12])
          .orient("left");
        view.graphHodograph.append('svg:g')
          .attr('class', 'x axis')
          .attr('transform', 'translate(' + (0) + ',' + (view.hodographHeight) + ')')
          .style("opacity", 0.2)
          .style("shape-rendering","crispEdges")
          .call(xAxisHodograph);
        view.graphHodograph.append('svg:g')
          .attr('class', 'y axis')
          .attr('transform', 'translate(' + (0.5*view.hodographWidth) + ',' + (0) + ')')
          .style("opacity", 0.2)
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
        view.satRadius
            .attr("x2",view.xScale(currentData.x))
            .attr("y2",view.yScale(currentData.y));
        view.satVelocity
            .attr("x2",currentData.v * view.velocityScale)
            .attr("transform",transformVelocity);
        view.satRadialVelocity
            .attr("x2",currentData.vradial * view.velocityScale)
            .attr("transform",transformRadialVelocity);
        view.scaleArrowStyle(view.satRadialVelocity,currentData.vradial*view.velocityScale);
        view.satNormalVelocity
            .attr("y2",-1 * (currentData.vnormal * view.velocityScale))
            .attr("transform",transformRadialVelocity);
        view.satRadialVelocityHelper
            .attr("x1",0)
            .attr("y1",-1 * (currentData.vnormal * view.velocityScale))
            .attr("x2",currentData.vradial * view.velocityScale)
            .attr("y2",-1 * (currentData.vnormal * view.velocityScale))
            .attr("transform",transformRadialVelocity);
        view.satNormalVelocityHelper
            .attr("x1",currentData.vradial * view.velocityScale)
            .attr("y1",0)
            .attr("x2",currentData.vradial * view.velocityScale)
            .attr("y2",-1 * (currentData.vnormal * view.velocityScale))
            .attr("transform",transformRadialVelocity);            
        view.satVelocityHodograph
            .attr("x2",view.xScaleHodograph(currentData.vradial ))
            .attr("y2",view.yScaleHodograph(currentData.vnormal ));
        view.scaleArrowStyle(view.satRadialVelocityHodograph,view.xScaleHodograph(currentData.vradial)-view.xScaleHodograph(0));
        view.satRadialVelocityHodograph
            .attr("x2",view.xScaleHodograph(currentData.vradial ));
        view.satNormalVelocityHodograph
            .attr("y2",view.yScaleHodograph(currentData.vnormal ));            
        view.satRadialVelocityHodographHelper
            .attr("x1",view.xScaleHodograph(0))
            .attr("y1",view.yScaleHodograph(currentData.vnormal))
            .attr("x2",view.xScaleHodograph(currentData.vradial))
            .attr("y2",view.yScaleHodograph(currentData.vnormal));
        view.satNormalVelocityHodographHelper
            .attr("x1",view.xScaleHodograph(currentData.vradial))
            .attr("y1",view.yScaleHodograph(0))
            .attr("x2",view.xScaleHodograph(currentData.vradial))
            .attr("y2",view.yScaleHodograph(currentData.vnormal));
        view.circularVelocityHodograph
            .attr("cy",view.yScaleHodograph(Math.sqrt(currentData.centralBody.gravitationalParameter/currentData.r)));
        view.escapeVelocityHodograph
            .attr("r",view.yScaleHodograph(0)-view.yScaleHodograph(Math.sqrt(2*currentData.centralBody.gravitationalParameter/currentData.r)));
            
    },    
    updateOrbit: function() {
        if (model.eccentricity < 1) { view.interpolationType = "cardinal-closed"; } else {view.interpolationType = "cardinal"; }        
        view.centralBody
            .attr("cx",view.xScale(0))
        	.attr("cy",view.yScale(0))
        	.attr("r",view.plotScale*model.twoBodyData[0].centralBody.radius);
        view.satRadius
            .attr("x1",view.xScale(0))
            .attr("y1",view.yScale(0));
        	
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
        view.hodographCircle = view.graphHodograph.append("circle")
            .attr("id","hodographCircle")
            .attr("fill","none")
            .attr("stroke-width","1.5px")
            .attr("opacity","0.8")
            .attr("stroke","orange")
            .attr("cx",view.xScaleHodograph(0))
            .style("opacity","0.5");
    },
    addSatellite: function() {
        view.satellite = view.graphOrbit.append("g");
        view.satRadius = view.graphOrbit.append("line")
            .attr("id","satradius")
            .attr("stroke","black")
            .attr("stroke-width","1px")
            .attr("x1",view.xScale(0))
            .attr("y1",view.yScale(0));            
        view.satRadialVelocity = view.satellite.append("line")
            .attr("id","radialVelocity")
            .attr("x1",0)
            .attr("y1",0)
            .attr("y2",0)
            .style("stroke","red")
            .style("stroke-width",view.defaultVectorStrokeWidth)
            .style("marker-end","url('#radialVelocityArrowHead')");
        view.satNormalVelocity = view.satellite.append("line")
            .attr("id","normalVelocity")
            .attr("x1",0)
            .attr("y1",0)
            .attr("x2",0)
            .style("stroke","blue")
            .style("stroke-width",view.defaultVectorStrokeWidth)
            .style("marker-end","url('#normalVelocityArrowHead')");
        view.satRadialVelocityHelper = view.satellite.append("line")
            .attr("id","radialVelocity")
            .style("stroke","gray")
            .style("stroke-dasharray","2,1")
            .style("stroke-width","2px")
            .style("opacity","0.5");
        view.satNormalVelocityHelper = view.satellite.append("line")
            .attr("id","normalVelocity")
            .style("stroke","gray")
            .style("stroke-dasharray","2,1")
            .style("stroke-width","2px")
            .style("opacity","0.5");
        view.satVelocity = view.satellite.append("line")
            .attr("id","velocity")
            .attr("x1",0)
            .attr("y1",0)
            .attr("y2",0)
            .style("stroke","orange")
            .style("stroke-width",view.defaultVectorStrokeWidth)
            .style("marker-end","url('#velocityArrowHead')");
        view.satCircle = view.satellite.append("circle")
            .attr("id","satcircle")
    		.attr("fill","gray")
    		.attr("stroke","none")
    		.attr("r",5);    		           
        view.satRadialVelocityHodograph = view.graphHodograph.append("g").append("line")
            .attr("id","hodographRadialVelocity")
            .attr("x1",view.xScaleHodograph(0))
            .attr("y1",view.yScaleHodograph(0))
            .attr("y2",view.yScaleHodograph(0))            
            .style("stroke","red")
            .style("stroke-width",view.defaultVectorStrokeWidth)
            .style("marker-end","url('#radialVelocityArrowHead')");
        view.satNormalVelocityHodograph = view.graphHodograph.append("g").append("line")
            .attr("id","hodographNormalVelocity")
            .attr("x1",view.xScaleHodograph(0))
            .attr("y1",view.yScaleHodograph(0))
            .attr("x2",view.xScaleHodograph(0))
            .style("stroke","blue")
            .style("stroke-width",view.defaultVectorStrokeWidth)
            .style("marker-end","url('#normalVelocityArrowHead')");   
        view.satRadialVelocityHodographHelper = view.graphHodograph.append("line")
            .attr("id","hodographRadialVelocity")
            .style("stroke","gray")
            .style("stroke-dasharray","2,1")
            .style("stroke-width","2px")
            .style("opacity","0.5");
        view.satNormalVelocityHodographHelper = view.graphHodograph.append("line")
            .attr("id","hodographNormalVelocity")
            .style("stroke","gray")
            .style("stroke-dasharray","2,1")
            .style("stroke-width","2px")
            .style("opacity","0.5");
        view.satVelocityHodograph = view.graphHodograph.append("g").append("line")
            .attr("id","hodographVelocity")
            .attr("x1",view.xScaleHodograph(0))
            .attr("y1",view.yScaleHodograph(0))
            .style("stroke","orange")
            .style("stroke-width",view.defaultVectorStrokeWidth)
            .style("marker-end","url('#velocityArrowHead')");    
        view.circularVelocityHodograph = view.graphHodograph.append("circle")
            .attr("fill","lightgray")
            .attr("r","4")                         
            .attr("cx",view.xScaleHodograph(0));
        view.escapeVelocityHodograph = view.graphHodograph.append("circle")
            .attr("stroke","lightgray")
            .attr("stroke-width","1px")
            .attr("fill","none")
            .attr("cx",view.xScaleHodograph(0))
            .attr("cy",view.yScaleHodograph(0));            
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

/*
var myvector = vector().arrowWidth(30).arrowLength(15);
var testvector = view.svg.append("g").attr("id","testvector");
myvector.x2(25);
testvector.call(myvector);
myvector.x2(50);
testvector.call(myvector);
*/

/*
        xAxisHodograph = d3.svg.axis()
          .scale(view.xScaleHodograph)
          .tickValues([-18, -16,-14,-12,-10,-8,-6,-3, 0, 12, 14, 16, 18])
          .orient("top");        
        view.svg.selectAll(".x.axis")
          .call(xAxisHodograph);
*/
}) ();
