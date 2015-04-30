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

function sign(x){return x>0?1:x<0?-1:x;}
var CONIC_SECTION_POLAR = (function() {

var model = {
    
    eccentricity: 0.6,
    perigeeHeight: 500,
    numSteps: 360,
    currentData: {theta: 30*Math.PI/180},
    twoBodyData: [],
    
    init: function model_init() {
        var trueAnomaly, minTrueAnomaly, maxTrueAnomaly;
        model.keplerOrbit = new astro.KeplerOrbit(astro.earth, model.perigeeHeight, model.eccentricity);
        if (model.eccentricity < 1) {
            minTrueAnomaly = 0;
            maxTrueAnomaly = 2 * Math.PI;
        } else {
            maxTrueAnomaly = Math.acos(-1/model.eccentricity)/1.2;
            minTrueAnomaly = -1 * maxTrueAnomaly;
        }

        for (i=0; i< model.numSteps; i++)
        {
            var trueAnomaly = minTrueAnomaly + (i / model.numSteps) * (maxTrueAnomaly - minTrueAnomaly);
            model.twoBodyData[i] = {};
            model.twoBodyData[i].theta = trueAnomaly;
            model.twoBodyData[i].r = model.keplerOrbit.semiLatusRectum / (1 + model.keplerOrbit.eccentricity * Math.cos(model.twoBodyData[i].theta));
            model.twoBodyData[i].x = model.twoBodyData[i].r * Math.cos(model.twoBodyData[i].theta);
            model.twoBodyData[i].y = model.twoBodyData[i].r * Math.sin(model.twoBodyData[i].theta);
        }
        model.xMin = d3.min(model.twoBodyData, function(d) { return d.x;} );
        model.xMax = d3.max(model.twoBodyData, function(d) { return d.x;} );
        model.yMin = d3.min(model.twoBodyData, function(d) { return d.y;} );
        model.yMax = d3.max(model.twoBodyData, function(d) { return d.y;} );
        model.currentData.r =  model.keplerOrbit.semiLatusRectum / (1 + model.keplerOrbit.eccentricity * Math.cos(model.currentData.theta));
        model.currentData.x = model.currentData.r * Math.cos(model.currentData.theta);
        model.currentData.y = model.currentData.r * Math.sin(model.currentData.theta);        
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
    frame: 0,
    plotAxes: true,
    marginMin: { top: 40, right: 40, bottom: 40, left: 40},
    margin: { top: 40, right: 40, bottom: 40, left: 40 },
    arrowLength: 5,
    arrowWidth: 3,
    aspectRatio: 2,
    defaultVectorStrokeWidth: 3,
    trueAnomalyColor: "purple",
    radiusColor: "darkcyan",
    
    init: function viewController_init() {
        // Get the element that should contain the SVG
        viewController.container = d3.select("#conic_section_polar")
            .style("position","relative"); // Position relative to be able to absolutely position the button
        viewController.canvasWidth = parseInt(viewController.container.style('width'), 10);
        viewController.canvasHeight = viewController.canvasWidth / viewController.aspectRatio;

        // Add the SVG
        viewController.svg = viewController.container.append("svg");
        viewController.svg.attr("width", viewController.canvasWidth)
                .attr("height", viewController.canvasHeight)
        viewController.addControls();                                 
        viewController.addMarkers();

        viewOrbit.init();
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
            viewOrbit.updateSatellitePosition();
            viewController.frameSlider.property("value",viewOrbit.frame);
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
        addArrowMarker({element: viewController.defs, id:"radiusArrowHead", 
            arrowLength: viewController.arrowLength, arrowWidth:viewController.arrowWidth, color:viewController.radiusColor});
        addArrowMarker({element: viewController.defs, id:"trueAnomalyArrowHead", 
            arrowLength: viewController.arrowLength, arrowWidth:viewController.arrowWidth, color:viewController.trueAnomalyColor});
    },    
    addControls: function() {
        // UI elements
        viewController.eccentricitySlider = d3.select("#e_slider").append("input")
            .attr("id","eccentricityslider")
            .attr("type","range")
            .attr("min","0")
            .attr("max","10")
            .attr("step","0.05")
            .style("width",300)
            .property("value",model.eccentricity)
            .on("input",function(){
                var positionInOrbit = viewController.frame / model.numSteps;
                model.eccentricity = parseFloat(viewController.eccentricitySlider.property("value")); 
                model.init();
                viewController.frame = parseInt(positionInOrbit * model.numSteps);
                viewController.frameSlider.property("value",viewOrbit.frame);
                viewController.frameSlider
                    .attr("max",model.numSteps - 1);
                viewOrbit.setOrbitPlotGeometry();
                if (true) { 
                    viewOrbit.setScale(); 
                }
                viewOrbit.updateOrbit();
                viewOrbit.updateSatellitePosition(); 
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
                viewOrbit.updateSatellitePosition(); 
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
        viewOrbit.updateSatellitePosition();
    },
    setOrbitPlotGeometry: function setOrbitPlotGeometry() {
        var dataAspectRatio = (model.xMax - model.xMin) / (model.yMax - model.yMin);
        // Assume data is very tall (hyperbolic orbit)
        viewController.plotHeight = viewController.canvasHeight - viewController.marginMin.top - viewController.marginMin.bottom;
        viewController.plotWidth = dataAspectRatio * viewController.plotHeight;
        if (viewController.plotWidth > (viewController.canvasWidth - viewController.marginMin.left - viewController.marginMin.right) ) 
        { 
            // Plot is very wide (elliptical orbit)
            viewController.plotWidth = ( viewController.canvasWidth - viewController.marginMin.left - viewController.marginMin.right);
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
            .style("stroke",viewController.radiusColor)
            .attr("opacity","0.4")
            .style("stroke-width","3px")
            .attr("x1",viewOrbit.xScale(0))
            .attr("y1",viewOrbit.yScale(0))
            .attr("marker-end","url('#radiusArrowHead')");
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
    updateSatellitePosition: function updateSatellitePosition() {
        viewOrbit.satCircle
            .attr("cx",viewOrbit.xScale(model.currentData.x))
            .attr("cy",viewOrbit.yScale(model.currentData.y));
        viewOrbit.satRadius
            .attr("x1",viewOrbit.xScale(0))
            .attr("y1",viewOrbit.yScale(0))
            .attr("x2",viewOrbit.xScale(model.currentData.x))
            .attr("y2",viewOrbit.yScale(model.currentData.y));
        var trueAnomaly = model.currentData.theta;
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
        	.attr("r",viewOrbit.plotScale*model.keplerOrbit.centralBody.radius);
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

    controller.init();

}) ();