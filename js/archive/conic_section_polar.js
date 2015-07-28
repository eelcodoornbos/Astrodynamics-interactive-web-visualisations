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

var CONIC_SECTION_POLAR = (function() {

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
            model.currentData.r =  model.semiLatusRectum / 
                (1 + model.eccentricity * Math.cos(model.currentData.trueAnomaly));
            model.currentData.x = model.currentData.r * Math.cos(model.currentData.trueAnomaly);
            model.currentData.y = model.currentData.r * Math.sin(model.currentData.trueAnomaly);        
        }
    };
    
    var controller = {
        init: function controller_init() {
            model.init();
            viewController.init();
        },
        
    };
    
    var viewController = {
        frame: 0,
        plotAxes: true,
        marginMin: { top: 40, right: 40, bottom: 40, left: 40},
        margin: { top: 40, right: 40, bottom: 40, left: 40 },
        arrowLength: 5,
        arrowWidth: 3,
        aspectRatio: 1.77,
        defaultVectorStrokeWidth: 3,
        trueAnomalyColor: "purple",
        radiusColor: "red",
        semiLatusRectumColor: "blue",
        
        init: function viewController_init() {
            // Get the element that should contain the SVG
            viewController.container = d3.select("#conic_section_polar");
            viewController.controllerContainer = d3.select("#conic_section_polar_controls");
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
        addMarkers: function() {
            // Markers for arrowheads
            function addArrowMarker(config) {
                var arrowPath, refX;
                if (config.orientation === "end")
                {
                    arrowPath = "M 0 0 " + (config.arrowLength) + " "+ (config.arrowWidth / 2) + " 0 "+ (config.arrowWidth) +" Z";
                    refX = config.arrowLength;
                    refY = config.arrowWidth/2;
                } else {
                    arrowPath = "M 0 " + (config.arrowWidth/2) + " " + (config.arrowLength) + " 0 " + (config.arrowLength) + " " + (config.arrowWidth) + " Z";
                    refX = 0;
                    refY = config.arrowWidth/2;
                }
                config.element.append("marker")
                    .attr("id",config.id)
                    .attr("markerWidth",config.arrowLength)
                    .attr("markerHeight",config.arrowWidth)
                    .attr("refX",refX)
                    .attr("refY",refY)
                    .attr("orient","auto")
                    .style("fill",config.color)
                    .append("path")
                        .attr("d",arrowPath); 
            }
            viewController.defs = viewController.svg.append("defs");
            addArrowMarker({element: viewController.defs, id:"radiusArrowHead", orientation: "end",
                arrowLength: viewController.arrowLength, arrowWidth:viewController.arrowWidth, color:viewController.radiusColor});
            addArrowMarker({element: viewController.defs, id:"semiLatusRectumStartArrowHead", orientation: "start",
                arrowLength: viewController.arrowLength, arrowWidth:viewController.arrowWidth, color:viewController.semiLatusRectumColor});
            addArrowMarker({element: viewController.defs, id:"semiLatusRectumEndArrowHead", orientation: "end",
                arrowLength: viewController.arrowLength, arrowWidth:viewController.arrowWidth, color:viewController.semiLatusRectumColor});                
                
        },    
        addControls: function() {
            viewController.controllerContainer.append("div")
                .html("<b>Input:</b>");
            // Semi latus rectum
            viewController.semiLatusRectumSliderDiv = viewController.controllerContainer.append("div")
                .attr("float","right");
            viewController.semiLatusRectumSlider = viewController.semiLatusRectumSliderDiv.append("input")
                .attr("id","semilatusrectumslider")                
                .attr("type","range")
                .attr("min","0")
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
                .attr("id","eccentricityslider")
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
                .attr("id","trueanomalyslider")
                .attr("type","range")
                .attr("min",-180)
                .attr("max",180)
                .attr("step","2")
                .style("width","100%")
                .property("value",parseFloat(model.currentData.trueAnomaly*180/Math.PI))
                .on("input",function(){
                    model.computeCurrentDataFromTrueAnomaly(viewController.trueAnomalySlider.property("value")/180*Math.PI)
                    viewOrbit.updateSatellitePosition();
                } );
            viewController.trueAnomalyLabel = viewController.trueAnomalySliderDiv.append("span")
                .attr("class","sliderAnnotation")
                .style("color",viewController.trueAnomalyColor)                
                .html('$\\theta = $&nbsp;')
            viewController.trueAnomalyValue = viewController.trueAnomalyLabel
                .append("span")
                .attr("class","trueanomalyvalue");
            viewController.controllerContainer.append("div")
                .html("</br><b>Output:</b>");
            viewController.radiusValueDiv = viewController.controllerContainer.append("div");
            viewController.radiusValueLabel = viewController.controllerContainer.append("div")
                .attr("class","sliderAnnotation")
                .style("color",viewController.radiusColor)                                
                .html("$r = $")
                .append("span")
                    .attr("class","radiusvalue");
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
            viewOrbit.graph = viewController.svg.append("g").style("pointer-events","all")
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
            viewOrbit.graph
                .attr("transform", "translate(" + viewController.margin.left + "," + viewController.margin.top + ")")
        },
        setScale: function setScale() {
            viewOrbit.xScale = d3.scale.linear().range([0,  viewController.plotWidth]).domain([model.xMin,model.xMax]);
            viewOrbit.yScale = d3.scale.linear().range([viewController.plotHeight, 0]).domain([model.yMin,model.yMax]);
            viewOrbit.xScaleInv = d3.scale.linear().domain([0,  viewController.plotWidth]).range([model.xMin,model.xMax]);
            viewOrbit.yScaleInv = d3.scale.linear().domain([viewController.plotHeight, 0]).range([model.yMin,model.yMax]);
            viewOrbit.plotScale = (viewController.plotWidth)/(model.xMax - model.xMin);
            viewOrbit.velocityScale = 200/16;
        },
        addOrbit: function() {
            // Hidden rectangle to click on
            viewOrbit.hiddenRect = viewOrbit.graph.append("rect")
                    .style("visibility","hidden")
                    .attr("x",0)
                    .attr("y",0)       
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
                .attr("stroke-width", "1");
            viewOrbit.semiLatusRectum = viewOrbit.graph.append("line")
                .attr("stroke",viewController.semiLatusRectumColor)
                .attr("stroke-width","2")
                .attr("x1",viewOrbit.xScale(0))
                .attr("y1",viewOrbit.yScale(0))
                .attr("x2",viewOrbit.xScale(0));
/*
                .attr("marker-start","url('#semiLatusRectumStartArrowHead')")
                .attr("marker-end","url('#semiLatusRectumEndArrowHead')")
                .style("cursor","pointer");
*/
        },
        addSatellite: function() {
            viewOrbit.satellite = viewOrbit.graph.append("g");
            viewOrbit.satCircle = viewOrbit.satellite.append("circle")
                .attr("id","satcircle")
        		.attr("fill","black")
        		.attr("stroke","white")
        		.attr("stroke-width","2px")
        		.attr("r",5);
            viewOrbit.satRadius = viewOrbit.graph.append("line")
                .attr("id","satradius")
                .style("stroke",viewController.radiusColor)
                .attr("opacity","0.5")
                .style("stroke-width","3px")
                .attr("x1",viewOrbit.xScale(0))
                .attr("y1",viewOrbit.yScale(0))
                .attr("marker-end","url('#radiusArrowHead')");
            viewOrbit.trueanomaly = viewOrbit.graph.append("path")
                .attr("fill","none")
                .attr("opacity","0.5")
                .attr("stroke",viewController.trueAnomalyColor)
                .attr("stroke-width","4")
                .style("cursor","pointer");
            viewOrbit.graph.on("mousedown", viewOrbit.mouseDown);
            viewOrbit.graph.on("mouseup", viewOrbit.mouseUp);
            viewOrbit.graph.on("mousemove", viewOrbit.mouseMove);
        },
        mouseDown: function mouseDown()
        {
            viewOrbit.mouseIsDown = true;
            viewOrbit.movePoint(d3.mouse(this));
        },
        mouseUp: function mouseUp()
        {
            viewOrbit.mouseIsDown = false;
        },
        mouseMove: function mouseMove()
        {
            if (viewOrbit.mouseIsDown)
            {
                viewOrbit.movePoint(d3.mouse(this));
            }
        },
        movePoint: function movePoint(e)
        {
            var angle = Math.atan2(viewOrbit.yScaleInv(e[1]),viewOrbit.xScaleInv(e[0]));
            model.computeCurrentDataFromTrueAnomaly( angle );
            viewOrbit.updateSatellitePosition();
        },
        updateSatellitePosition: function updateSatellitePosition(angle) {

            viewOrbit.satRadius
                .attr("x1",viewOrbit.xScale(0))
                .attr("y1",viewOrbit.yScale(0))
                .attr("x2",viewOrbit.xScale(model.currentData.x))
                .attr("y2",viewOrbit.yScale(model.currentData.y));
            viewOrbit.satCircle
                .attr("cx",viewOrbit.xScale(model.currentData.x))
                .attr("cy",viewOrbit.yScale(model.currentData.y));
            var trueAnomaly = model.currentData.trueAnomaly;
            if (trueAnomaly < 0) { trueAnomaly += Math.PI * 2;}
            viewOrbit.trueanomaly
                .attr("d",anglesToArcPath(viewOrbit.xScale,viewOrbit.yScale,0,0,6378/3*2,0,trueAnomaly,0,0));
            if (model.currentData.trueAnomaly < 0)
            {
                annot = (model.currentData.trueAnomaly*180/Math.PI+360).toFixed(0) + "º (" + (model.currentData.trueAnomaly*180/Math.PI).toFixed(0) + "º)";
            } else {
                annot = (model.currentData.trueAnomaly*180/Math.PI).toFixed(0) + "º";
            }
            d3.selectAll(".trueanomalyvalue")
                .html(" "+(model.currentData.trueAnomaly*180/Math.PI).toFixed(0) + "º");// + " cos theta = " + Math.cos(model.currentData.trueAnomaly).toFixed(3));
            
            viewController.trueAnomalySlider
                .property("value",parseFloat(model.currentData.trueAnomaly*180/Math.PI));
    
            d3.selectAll(".radiusvalue")
                .html(" " + (model.currentData.r).toFixed(0) + " km");            
                

        },    
        updateOrbit: function() {
            viewOrbit.hiddenRect
                    .attr("width",viewController.plotWidth)
                    .attr("height",viewController.plotHeight);    
            d3.selectAll(".eccentricityvalue")
                .html(" " + model.eccentricity.toFixed(2));
            d3.selectAll(".semilatusrectumvalue")
                .html(model.semiLatusRectum.toFixed(0) + " km");
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
            viewOrbit.semiLatusRectum
                .attr("y2",viewOrbit.yScale(model.semiLatusRectum));           
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
    }    
    MathJax.Hub.Queue(function() {controller.init()} );
    MathJax.Hub.Queue(["Typeset",MathJax.Hub]);
    
}) ();