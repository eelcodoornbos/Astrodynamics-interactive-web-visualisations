function conicSectionInputOutput() {
    
    var outputs = [];
    var graphSetPrefix = "noprefix";
    var maxValue = 1e12;
    var sliders = 
       [{ label: "Semi latus rectum", 
          property: "semiLatusRectum", 
          prefix: "<i>p</i> = ",
          multiplier: 1,                  
          units: " km",
          min: 100, 
          max: 40000, 
          step: 200, 
          digits: 0 },
    
        { label: "Eccentricity",
          property: "eccentricity",
          prefix: "<i>e</i> = ",
          multiplier: 1,
          units: "",
          min: 0,
          max: 2,
          step: 0.01,
          digits: 2 },

        { label: "Argument of perigee",
          property: "argumentOfPerigee",
          prefix: "<i>&omega;</i> = ",
          multiplier: 180 / Math.PI,
          units: "&deg;",
          min: 0,
          max: 360,
          step: 1,
          digits: 1 },

        { label: "True anomaly",
          property: "trueAnomaly",
          prefix: "<i>&theta;</i> = ",
          multiplier: 180 / Math.PI,
          units: "&deg;",
          min: -180,
          max: 180,
          step: 1,
          digits: 1 }]
    var outputs =        
       [{ label: 'Velocity',
          property: 'velocity',
          prefix: '<i>V</i> = ',
          multiplier: 1,
          units: ' km/s',
          digits: 2 },
                    
        { label: 'Radial velocity',
          property: 'radialVelocity',
          prefix: '<i>V<sub>r</sub></i> = ',
          multiplier: 1,
          units: ' km/s',
          digits: 2 },
                    
        { label: 'Normal velocity',
          property: 'normalVelocity',
          prefix: '<i>V<sub>n</sub></i> = ',
          multiplier: 1,
          units: ' km/s',
          digits: 2 },
                    
        { label: 'Flight path angle',
          property: 'flightPathAngle',
          prefix: '<i>&gamma;</i> = ',
          multiplier: 180/Math.PI,
          units: '&deg;',
          digits: 1 },  

        { label: 'Radius',
          property: 'r',
          prefix: '<i>r</i> = ',
          multiplier: 1,
          units: ' km',
          digits: 0 },

        { label: 'Perigee height',
          property: 'perigeeHeight',
          prefix: '<i>h<sub>p</sub></i> = ',
          multiplier: 1,
          units: ' km',
          digits: 0 }];

    controls.graphSetPrefix = function(value) {
        if (!arguments.length) return graphSetPrefix;
        graphSetPrefix = value;
        return controls;
    };
    controls.sliders = function(value) {
        if (!arguments.length) return sliders;
        sliders = value;
        return controls;
    };
    controls.outputs = function(value) {
        if (!arguments.length) return outputs;
        outputs = value;
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
            
        var label = div.append('span')
            .classed('sliderAnnotation' + " " + input.property, true)
            .html(input.label);

        var formattedValue = label.append('span')
            .classed('sliderValue', true);
        
        var prefix = formattedValue.append('span')
            .html(input.prefix);
/*
        formattedValue.append('span')
            .classed(graphSetPrefix + "_" + input.property + '_value', true)
            .html((model[input.property]*input.multiplier).toFixed(input.digits));
*/
        var sliderTextField = formattedValue.append('input')
            .classed(graphSetPrefix + "_" + input.property + '_value', true)
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
            model.init();
    
            // Get the displayValue from the recomputed model, so that, for example, the maximum true anomaly
            // for hyperbolic orbits cannot be exceeded.
            var displayValue = model[input.property] * input.multiplier;//
    
            // Set the displayValue in the slider and its annotation
            d3.select('input.'+input.property).property('value',displayValue);
            d3.select('.' + graphSetPrefix + "_" + input.property + '_value')
                .property("value",displayValue.toFixed(input.digits))
                .style("width", getWidthOfInput(sliderTextField) + "px");          
            
            
            
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
            
        }
        
        slider.on('input', onSliderInput);
        sliderTextField.on('change', onSliderInput);
        sliderTextField.on('keyup', function() { sliderTextField.style("width", getWidthOfInput(sliderTextField) + "px") } );
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
            
            sliders.forEach(function(currentSlider) { 
                addSlider(that, currentSlider);
            });
                        
            addHeader(that, { label: "Outputs:"} );                    
            
            outputs.forEach(function(currentOutput) {
                addOutput(that, currentOutput);                
            });
        }); // End of selection.each
                    

    };
    
    return controls;
};
