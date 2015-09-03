var outputs = [];

var controllerContainer = d3.select('#nbodycontrols');

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
var startStopButton = controllerContainer.append("div").style("float","right").append("button")
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

    function getWidthOfInput(inputElement) {
        var tmp = prefix.append("span")
            .classed("tmp-element", true)
            .html(inputElement.property("value").replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'));
        var theWidth = tmp.node().getBoundingClientRect().width;
        tmp.remove();
        return theWidth;
    }

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
        updateOutput();
        
        // Update the orbit graph
//        updateGraphs();
        
    }
    
    slider.on('input', onSliderInput);
    sliderTextField.on('change', onSliderInput);
    sliderTextField.on('keyup', function() { sliderTextField.style("width", getWidthOfInput(sliderTextField) + "px") } );
};

addHeader(controllerContainer, { label: "View settings" });

function setViewLock() {
//    var value = d3.select('input[name="selectViewLock"]:checked').node().value;
    var value = d3.select('#selectViewLock').property("value");
    if (value >= 0 && value <= model.objects.length) { // number represents object number
        model.referenceObject = model.objects[value];
    } else { // not a valid number, then probably com or zeroObject for inertial frame.
        model.referenceObject = model[value];
    }
    if (animationRunning) { animationInterrupted = true; startStopAnimation(); } else { animationInterrupted = false; }
    setModel();

    inTransition = true;
    updateNeeded = true;
}

controllerContainer.append("label")
    .classed('sliderController', true)
    .attr("for","selectViewLock")
    .html("Translate reference frame origin to:")
var selectViewLock = controllerContainer.append("select")
    .attr('id','selectViewLock')
    .on("input",function() { setViewLock() });
selectViewLock.append("option")
    .attr("value","zeroObject")
    .html("No translation (inertial)");
selectViewLock.append("option")
    .attr("value","com")
    .html("Barycenter (inertial)");
model.objects.forEach( function(currentObject, currentIndex) {
    selectViewLock.append("option")
        .attr("value",currentIndex)
        .html(currentObject.name);    
});


addSlider(controllerContainer, 
    { label: "Zoom extent", 
      property: "zoomLevel", 
      prefix: "zoom = ",
      multiplier: 1,                  
      units: "",
      min: 200, 
      max: 20000, 
      step: 10, 
      digits: 0 }
);

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
    .html("Show trails") ;

/*
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
*/

div.append("br");


div.append("input")
    .attr('type','checkbox')
    .attr('id','showAccelerations')
    .property('checked',model.showAccelerations)
    .on("change",function() { 
        value = d3.select('#showAccelerations').property("checked");
        model.showAccelerations = value;
        updateNeeded = true;
    })
div.append("label")
    .style('display','inline')
    .attr("for","showAccelerations")
    .html("Show accelerations");

div.append("br");

div.append("input")
    .attr('type','checkbox')
    .attr('id','showVelocities')
    .property('checked',model.showVelocities)
    .on("change",function() { 
        value = d3.select('#showVelocities').property("checked");
        model.showVelocities = value;
        updateNeeded = true;
    })
div.append("label")
    .style('display','inline')
    .attr("for","showVelocities")
    .html("Show velocities");


addHeader(controllerContainer, { label: "Input" });

var table = controllerContainer.append("table")
    .classed("nbodypropertytable",true);

var row = table.append("tr")
row.append("td").html("Object name");
row.append("td").html("Mass");
row.append("td").html("<i>x</i>");
row.append("td").html("<i>y</i>");
row.append("td").html("<i>v<sub>x</sub></i>");
row.append("td").html("<i>v<sub>y</sub></i>");

model.objects.forEach( function(object) {
    var row = table.append("tr")
    row.append("td").html(object.name);
    row.append("td").html(object.mass.toFixed(0));
    row.append("td").html(object.position.e(1).toFixed(0));
    row.append("td").html(object.position.e(2).toFixed(0));
    row.append("td").html(object.velocity.e(1).toFixed(2));
    row.append("td").html(object.velocity.e(2).toFixed(2));
});
centreOfMass();
var row = table.append("tr")
row.append("td").html("Barycenter");
row.append("td").html(model.totalMass.toFixed(0));
row.append("td").html(model.com.position.e(1).toFixed(0));
row.append("td").html(model.com.position.e(2).toFixed(0));
row.append("td").html(model.com.velocity.e(1).toFixed(2));
row.append("td").html(model.com.velocity.e(1).toFixed(2));

controllerContainer.append("br");

addSlider(controllerContainer, 
    { label: "Integration time step", 
      property: "stepSize", 
      prefix: "<i>h</i> = ",
      multiplier: 1,                  
      units: "",
      min: 0,
      max: 15, 
      step: 0.1, 
      digits: 1 }
);

addHeader(controllerContainer, { label: "Output" });

addOutput(controllerContainer, 
    { label: "Total kinetic energy",
      property: "totalKineticEnergy",
      prefix: "<i>E<sub>k</sub></i> = ",
      multiplier: 1,
      units: ""
        
    });
    
addOutput(controllerContainer, 
    { label: "Total potential energy",
      property: "totalPotentialEnergy",
      prefix: "<i>E<sub>p</sub></i> = ",
      multiplier: 1,
      units: "" 
    });

addOutput(controllerContainer, 
    { label: "Total energy",
      property: "totalEnergy",
      prefix: "<i>C = E<sub>k</sub> + E<sub>p</sub></i> = ",
      multiplier: 1,
      units: "" 
    });
    
addOutput(controllerContainer, 
{ label: "Angular momentum around Z",
  property: "Hz",
  prefix: "<i>H<sub>z</sub></i> = ",
  multiplier: 1,
  units: "" 
});
addOutput(controllerContainer, 
{ label: "Velocity of centre of mass in X direction",
  property: "comvx",
  prefix: "<i>v<sub>com,x</sub></i> = ",
  multiplier: 1,
  units: "",
  digits: 3 
}); 
addOutput(controllerContainer, 
{ label: "Velocity of centre of mass in Y direction",
  property: "comvy",
  prefix: "<i>v<sub>com,y</sub></i> = ",
  multiplier: 1,
  units: "",
  digits: 3  
});
