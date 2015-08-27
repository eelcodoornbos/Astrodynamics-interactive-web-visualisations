var outputs = [];
var sliders = [];
var controllerContainer = d3.select('#threeBodyControls');
var controllerContainerTop = d3.select('#threeBodyControlsTop').style("padding","30px");

function startStopAnimation() 
{
    if (animationRunning) 
    {
		animationRunning = false;
		startStopButton.html("Start");
    } 
    else 
    {
	    animationRunning = true;
		startStopButton.html("Stop");
	}
}
var animationRunning = false;
var startStopButton = controllerContainerTop.append("div").style("float","right").append("button")
    .html("Start")
    .on("click",function() { startStopAnimation() });

var updateNeeded = false;
var inTransition = false;

function formatOutput(input,value) {
    displayValue = value; // * input.multiplier;
    return input.prefix + displayValue.toFixed(input.digits) + input.units;
};

function updateOutput() {
    outputs.forEach(function(currentOutput) { // Loop over each of the outputs to make it display the current value
        var content;
        var currentValue = model[currentOutput.property] * currentOutput.multiplier;
        content = currentOutput.prefix + currentValue.toFixed(currentOutput.digits) + currentOutput.units;
        d3.select('.' + currentOutput.property + '_value')
            .html(content);
    });
    sliders.forEach(function(currentSlider) {
        var currentValue = model[currentSlider.property] * currentSlider.multiplier;
        d3.select('input.' + currentSlider.property)
            .property('value',currentValue);
        d3.select('.' + currentSlider.property + '_value')
            .property("value",currentValue.toFixed(currentSlider.digits));
//             .style("width", getWidthOfInput(this.node()) + "px");                      
        
    })
    
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
        .classed('outputValue' + " " + input.property + '_value', true)
        .html(formatOutput(input,value));
};

function addHeader(element, input) {
    var div = element.append("div")
        .classed('headerInputOutput', true)
        .attr('float','left')
    var label = div.append('span')
        .html(input.label);
};


function addSlider(element, input) {
    sliders.push(input);
    // Create a div for the slider and the label
    var div = element.append("div")
        .classed('sliderController', true)
        .attr('float','left');
        
    var label = div.append('span')
        .classed('sliderAnnotation' + " " + input.property, true)
        .html(input.label);

    var formattedValue = label.append('span')
        .classed('sliderValue', true);
    
    var prefix = formattedValue.append('span')
        .html(input.prefix);

    function getWidthOfInput(inputElement) {
        var tmp = prefix.append("span")
            .classed("tmp-element", true)
            .html(inputElement.property("value").replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'));
        var theWidth = tmp.node().getBoundingClientRect().width;
        tmp.remove();
        return theWidth;
    }

    var sliderTextField = formattedValue.append('input')
        .classed(input.property + '_value', true)
        .classed("slidertextfield", true)
        .style("color","inherit")
        .style('font','inherit')
        .attr("type","text")
        .attr("value",(model[input.property]*input.multiplier).toFixed(input.digits));
    sliderTextField.style("width", getWidthOfInput(sliderTextField) + "px");
        
    var units = formattedValue.append('span')
        .html(input.units);

    var slider = div.append('input')
        .classed(input.property, true)
        .attr('type','range')
        .attr('min',input.min)
        .attr('max',input.max)
        .attr('step',input.step)
        .property('value',model[input.property]*input.multiplier);

    function onSliderInput() {
        // Get the slider value and set the model
        var value = parseFloat(d3.select(this).property('value')) / input.multiplier;
        if (value < input.min) { value = input.min; }
        if (value > input.max) { value = input.max; }
        
        model[input.property] = value;

        // Recompute the orbit model
        updateNeeded = true;
        
        // Get the displayValue from the recomputed model, so that, for example, the maximum true anomaly
        // for hyperbolic orbits cannot be exceeded.
        var displayValue = model[input.property] * input.multiplier;//

        // Set the displayValue in the slider and its annotation
        d3.select('input.'+input.property).property('value',displayValue);
        d3.select('.' + input.property + '_value')
            .property("value",displayValue.toFixed(input.digits))
            .style("width", getWidthOfInput(sliderTextField) + "px"); 
        
              
        // Update the output text fields
//        updateSliderInput();
        updateOutput();
        setModel();

        if (input.reInitializeMainBodies) {
            model.initThreeBodyProblemMainBodies();
            setModel();
            updateNeeded = true;
        }
        if (input.reInitializeThirdBody) {
            model.initThreeBodyProblemThirdBody();
            setModel();
            updateNeeded = true;
        }
        if (input.setVelocity) {
            // Temporary location of this code !!
            model.vx = model.velocity * Math.sin(model.velocityAzimuth);
            model.vy = model.velocity * Math.cos(model.velocityAzimuth);
            model.initThreeBodyProblemThirdBody();
            setModel();            
            updateNeeded = true; 
        }
        
    }
    
    slider.on('input', onSliderInput);
    sliderTextField.on('change', onSliderInput);
    sliderTextField.on('keyup', function() { sliderTextField.style("width", getWidthOfInput(sliderTextField) + "px") } );
};

addHeader(controllerContainer, { label: "View settings" });

var div = controllerContainer.append('div');
div.append("input")
    .attr('type','checkbox')
    .attr('id','setTrail')
    .property('checked',model.showTrails)
    .on("change",function() { 
        value = d3.select('#setTrail').property("checked");
        model.showTrails = value;
        if (!model.showTrails) { model.eraseTrails(); }
    })
div.append("label")
    .style('display','inline')
    .attr("for","setTrail")
    .html("Show trails (runs slower)") ;

var div = controllerContainer.append('div');
div.append("input")
    .attr('type','checkbox')
    .attr('id','corotateTrail')
    .property('checked',model.corotateTrail)
    .on("change",function() { 
        value = d3.select('#corotateTrail').property("checked");
        model.corotateTrail = value;
        inTransition = true;
        updateNeeded = true;        
    })
div.append("label")
    .style('display','inline')
    .attr("for","corotateTrail")
    .html("Corotate satellite trail") ;


var div = controllerContainer.append('div');
div.append("input")
    .attr('type','checkbox')
    .attr('id','showSphereOfInfluence')
    .property('checked',model.showSphereOfInfluence)
    .on("change",function() { 
        value = d3.select('#showSphereOfInfluence').property("checked");
        model.showSphereOfInfluence = value;
        updateNeeded = true;
    })
div.append("label")
    .style('display','inline')
    .attr("for","showSphereOfInfluence")
    .html("Show sphere of influence") ;

function setTrailLock() {
    var value = d3.select('#selectTrailLock').property("value");
    if (value >= 0 && value <= model.objects.length) { // number represents object number
        model.trailRefObject = model.objects[value];
    } else { // not a valid number, then probably com or zeroObject for inertial frame.
        model.trailRefObject = model.zeroObject;
    }
    
    if (animationRunning) {
        animationInterrupted = true; 
        startStopAnimation(); 
    } else { 
        animationInterrupted = false; 
    }
    inTransition = true;
    updateNeeded = true;
}

function setViewLock() {
    var value = d3.select('#selectViewLock').property("value");
    if (value < 0) { 
        model.viewRefObject = model.zeroObject; 
    } else if (value >= 5 && value <= 5 + model.objects.length) { // number represents object number
        model.viewRefObject = model.objects[value-5];
    } else {
        model.viewRefObject = model.lagrangePoints[value];
    }
        console.log(value, model.viewRefObject );
    updateNeeded = true;
}

function setRefFrame() {
    var value = d3.select('#selectRefFrame').property("value");
    view.refFrame = value;
    if (animationRunning) {
        animationInterrupted = true; 
        startStopAnimation(); 
    } else { 
        animationInterrupted = false; 
    }
    inTransition = true;
    updateNeeded = true;
}

controllerContainer.append("label")
    .classed('sliderController', true)
    .attr("for","selectRefFrame")
    .html("Reference frame: ")
var selectRefFrame = controllerContainer.append("select")
    .attr('id','selectRefFrame')
    .on("input",function() { setRefFrame() });
selectRefFrame.append("option")
    .attr("value","corotating")
    .html("Corotating"); 
selectRefFrame.append("option")
    .attr("value","inertial")
    .html("Inertial");

controllerContainer.append("br")
controllerContainer.append("label")
    .classed('sliderController', true)
    .attr("for","selectTrailLock")
    .html("Trail reference: ")
var selectTrailLock = controllerContainer.append("select")
    .attr('id','selectTrailLock')
    .on("input",function() { setTrailLock() });
selectTrailLock.append("option")
    .attr("value","zeroObject")
    .html("Centre of mass");
model.objects.forEach( function(currentObject, currentIndex) {
    selectTrailLock.append("option")
        .attr("value",currentIndex)
        .html(currentObject.name);    
});

controllerContainerTop.append("label")
    .classed('sliderController', true)
    .attr("for","selectViewLock")
    .html("Keep viewport centred on: ")
var selectViewLock = controllerContainerTop.append("select")
    .attr('id','selectViewLock')
    .on("input",function() { setViewLock() });
selectViewLock.append("option")
    .attr("value",-1)
    .html("Centre of mass");
model.objects.forEach( function(currentObject, currentIndex) {
    selectViewLock.append("option")
        .attr("value",currentIndex+5)
        .html(currentObject.name);
    });    
model.lagrangePoints.forEach(function(currentObject, currentIndex) {
    selectViewLock.append("option")
        .attr("value",currentIndex)
        .html("L"+(currentIndex+1).toFixed(0));        
});



addSlider(controllerContainerTop, 
    { label: "Zoom extent", 
      property: "zoomLevel", 
      prefix: "zoom = ",
      multiplier: 1,                  
      units: "",
      min: 0.01, 
      max: 10, 
      step: 0.01, 
      digits: 2,
      reInitializeMainBodies: false,
      reInitializeThirdBody: false }
);

addHeader(controllerContainer, { label: "Input" });

addSlider(controllerContainer, 
    { label: "Normalized mass of moon", 
      property: "mu", 
      prefix: "<i>&mu;</i> = ",
      multiplier: 1,                  
      units: "",
      min: 0,
      max: 0.5, 
      step: 0.001, 
      digits: 4,
      reInitializeMainBodies: true,
      reInitializeThirdBody: true  }
);

addSlider(controllerContainer, 
    { label: "X-position", 
      property: "x", 
      prefix: "<i>x</i> = ",
      multiplier: 1,                  
      units: "",
      min: -2,
      max: 2, 
      step: 0.001, 
      digits: 3,
      reInitializeMainBodies: false,
      reInitializeThirdBody: true  }
);
addSlider(controllerContainer, 
    { label: "Y-position", 
      property: "y", 
      prefix: "<i>y</i> = ",
      multiplier: 1,                  
      units: "",
      min: -2,
      max: 2, 
      step: 0.001, 
      digits: 3,
      reInitializeMainBodies: false,
      reInitializeThirdBody: true  }
);

addSlider(controllerContainer, 
    { label: "Velocity", 
      property: "velocity", 
      prefix: "<i>v</i> = ",
      multiplier: 1,                  
      units: "",
      min: 0,
      max: 5, 
      step: 0.01, 
      digits: 2,
      reInitializeMainBodies: false,
      reInitializeThirdBody: true,
      setVelocity: true  }
);
addSlider(controllerContainer, 
    { label: "Velocity direction", 
      property: "velocityAzimuth", 
      prefix: "<i>&phi;</i> = ",
      multiplier: 1,                  
      units: "",
      min: -Math.PI,
      max: Math.PI, 
      step: Math.PI/180, 
      digits: 2,
      reInitializeMainBodies: false,
      reInitializeThirdBody: true,
      setVelocity: true  }
);

addSlider(controllerContainer, 
    { label: "Time step size", 
      property: "stepSize", 
      prefix: "<i>h</i> = ",
      multiplier: 1,                  
      units: "",
      min: 0,
      max: 0.02, 
      step: 0.001, 
      digits: 3,
      reInitializeMainBodies: false,
      reInitializeThirdBody: false  }
);



addHeader(controllerContainer, { label: "Output" });

/*
addOutput(controllerContainer, 
    { label: "Kinetic energy",
      property: "kineticEnergy",
      prefix: "<i>E<sub>k</sub></i> = ",
      multiplier: 1,
      units: "",
      digits: 3  
    });

addOutput(controllerContainer, 
    { label: "Potential energy",
      property: "potentialEnergy",
      prefix: "<i>E<sub>p</sub></i> = ",
      multiplier: 1,
      units: "",
      digits: 3  
    });

addOutput(controllerContainer, 
    { label: "Angular momentum",
      property: "angularMomentum",
      prefix: "<i>H<sub>z</sub></i> = ",
      multiplier: 1,
      units: "",
      digits: 3  
    });
*/


addOutput(controllerContainer, 
    { label: "Time",
      property: "time",
      prefix: "<i>t</i> = ",
      multiplier: 1,
      units: "",
      digits: 3  
    });


addOutput(controllerContainer, 
    { label: "Jacobi's constant",
      property: "jacobiConstant",
      prefix: "<i>C</i> = ",
      multiplier: 1,
      units: "",
      digits: 3  
    });

/*
addOutput(controllerContainer, 
    { label: "Total kinetic energy",
      property: "totalKineticEnergy",
      prefix: "<i>E<sub>k</sub></i> = ",
      multiplier: 1,
      units: "",
      digits: 3  
    });
    
addOutput(controllerContainer, 
    { label: "Total potential energy",
      property: "totalPotentialEnergy",
      prefix: "<i>E<sub>p</sub></i> = ",
      multiplier: 1,
      units: "",
      digits: 3  
    });

addOutput(controllerContainer, 
    { label: "Total energy",
      property: "totalEnergy",
      prefix: "<i>C</i> = ",
      multiplier: 1,
      units: "",
      digits: 3  
    });
*/