model = {
    xMin: -1000,
    yMin: -1000,
    xMax: 1000,
    yMax: 1000,
    objects: [
        {x:    0, y:    0, z: 0, vx:    0, vy: -0.175, vz: 0, mass: 1000, ax: 0, ay: 0, az: 0, trail: []},
        {x:  130, y:    0, z: 0, vx:    0, vy:   3.55, vz: 0, mass:   50, ax: 0, ay: 0, az: 0, trail: []},
        {x: -130, y:    0, z: 0, vx:    0, vy:  -3.55, vz: 0, mass:    5, ax: 0, ay: 0, az: 0, trail: []},
        {x:    0, y:  151, z: 0, vx:    3, vy:      0, vz: 0, mass:    5, ax: 0, ay: 0, az: 0, trail: []},
        {x: -200, y: -450, z: 0, vx:    0, vy:     -1, vz: 0, mass:   10, ax: 0, ay: 0, az: 0, trail: []},
        {x:  600, y:  450, z: 0, vx:   -2, vy:      0, vz: 0, mass:   10, ax: 0, ay: 0, az: 0, trail: []},
        {x: -800, y:  850, z: 0, vx:    3, vy:      9, vz: 0, mass:   20, ax: 0, ay: 0, az: 0, trail: []}        
    ],
    com: {},
    time: 0,
    stepsize: 5,
    gravitationalConstant: 1,//6.6743e-20,
    y0: {}
};

function centreOfMass() {
    var com = {x: 0, y:0, totalmass: 0};
    model.objects.forEach( function(elem, index) {
        com.totalmass += elem.mass;
        com.x += elem.x * elem.mass;
        com.y += elem.y * elem.mass;
    });
    model.com.x = com.x / com.totalmass;
    model.com.y = com.y / com.totalmass;
};

function acceleration() {
    model.objects.forEach( function(elem1, index1) {
        model.objects.forEach ( function(elem2, index2) {
           if (index1 != index2) {
               var deltax = elem2.x - elem1.x;
               var deltay = elem2.y - elem1.y;
               var distance = Math.sqrt(Math.pow(deltax,2)+Math.pow(deltay,2));
               elem1.ax = elem1.ax + elem1.mass*elem2.mass/Math.pow(distance,3)*deltax;
               elem1.ay = elem1.ay + elem1.mass*elem2.mass/Math.pow(distance,3)*deltay;
           }             
        })
    });
};
function ode_nbody(t,y) { // note that the time t is not used to evaluate the acceleration here
    var nbodies = y.dimensions() / 6; // assume 3 coordinate components (x,y,z) per body
    // for each body, y contains position and velocity components, in turn:
    // y = [x1,y1,z1,vx1,vy1,vz1,x2,y2,z2,vx2,vy2,vz2,...]
    // farray should contain the derivate of this vector:
    // farray = [vx1,vy1,vz1,ax1,ay1,az1,vx2,...]
    // so if i is the index of the body, then
    // y[((i)*6+1] is the x position,
    // y[((i)*6+2] is the y position,
    // y[((i)*6+4] is the x velocity, ...
    var farray = [];
    var ax, ay, az;
    for (var icurrent = 0; icurrent < nbodies; icurrent++)
    {
        var mass1 = model.objects[icurrent].mass;
        ax = 0; ay = 0; az = 0;
        for (var iother = 0; iother < nbodies; iother++)
        {
            if (iother != icurrent) 
            {
                var mass2 = model.objects[iother].mass;
                var deltax = y.e((iother)*6+1) - y.e((icurrent)*6+1);
                var deltay = y.e((iother)*6+2) - y.e((icurrent)*6+2);
                var deltaz = y.e((iother)*6+3) - y.e((icurrent)*6+3)
                var distance = Math.sqrt(Math.pow(deltax,2)+Math.pow(deltay,2)+Math.pow(deltaz,2));
                var ax = ax + model.gravitationalConstant * (mass2)/Math.pow(distance,3)*deltax;
                var ay = ay + model.gravitationalConstant * (mass2)/Math.pow(distance,3)*deltay;
                var az = az + model.gravitationalConstant * (mass2)/Math.pow(distance,3)*deltaz;
            }
        }
        // Set velocity components
        farray[(icurrent)*6 + 0] = y.e((icurrent)*6+4);
        farray[(icurrent)*6 + 1] = y.e((icurrent)*6+5);
        farray[(icurrent)*6 + 2] = y.e((icurrent)*6+6);
        // Set acceleration components
        farray[(icurrent)*6 + 3] = ax;
        farray[(icurrent)*6 + 4] = ay;
        farray[(icurrent)*6 + 5] = az;
        // Update model for display of accelerations
        model.objects[icurrent].ax = ax;
        model.objects[icurrent].ay = ay;
        model.objects[icurrent].az = az;                
    }
    return Vector.create(farray);
};

function nBodyChart() {

    var canvasWidth = 500;
    var canvasHeight = 500;
    var margin = { top: 20, right: 20, bottom: 20, left: 20};
    var xScale = d3.scale.linear();
    var yScale = d3.scale.linear();
    var velocityScale = 50;
    var accelerationScale = 10000;
    var massScale = 8;
    chart.canvasWidth = function(value) {
        if (!arguments.length) return canvasWidth;
        canvasWidth = value;
        return chart;
    };
    chart.canvasHeight = function(value) {
        if (!arguments.length) return canvasHeight;
        canvasHeight = value;
        return chart;
    };

    function chart(selection) {
        selection.each(function(data) { // "this" now refers to each selection
            
            // Investigate proportions of plot
            var dataAspectRatio = (data.xMax - data.xMin) / (data.yMax - data.yMin);
            // First assume data is very tall (hyperbolic orbit)
            var plotHeight = canvasHeight - margin.top - margin.bottom;
            var plotWidth = canvasWidth - margin.left - margin.right;
            var plotScale = (plotWidth)/(data.xMax - data.xMin);

            xScale.range([0,  plotWidth]).domain([data.xMin,data.xMax]);
            yScale.range([plotHeight, 0]).domain([data.yMin,data.yMax]);

            // Select SVG, if it exists, and bind the data
            var svg = d3.select(this).selectAll("svg").data([data]);
            
            // Otherwise, create the svg for the skeletal chart
            var svgEnter = svg.enter().append("svg")
                .attr("preserveAspectRatio", "xMinYMin meet")
                .classed('nbody', true);

            // First, add the defs
            var defs = svgEnter.append("defs");

            // Next, add the group to translate for the margins
            var gEnter = svgEnter.append("g");
            
            // And add the skeletal elements to this group
            // bodies
            var xAxis = d3.svg.axis() 
              .scale(xScale)
              .ticks(5)
              .orient("bottom");
            var yAxis = d3.svg.axis()
              .scale(yScale)
              .ticks(5)
              .orient("left");

            gEnter.append('svg:g') // Axes and annotation should not be clipped, so append to graph instead of clippedCanvas
              .classed('x axis', true)
              .attr('transform', 'translate(' + (0) + ',' + yScale(0) + ')')
              .call(xAxis);
            gEnter.append('svg:g')
              .classed('y axis', true)
              .attr('transform', 'translate(' + xScale(0) + ',' + (0) + ')')
              .call(yAxis);              


            
            var bodies = gEnter.selectAll('.body').data(model.objects).enter();
            var body = bodies
                .append("g")
                .classed('nBody', true);
            body.append('circle')
            body.append('line')
                .classed('velocity', true);
            body.append('line')
                .classed('acceleration', true);
            body.append('path')
                .classed('trail', true);
                
            gEnter.append("circle")
                .classed('centreOfMass', true);
                
            // 
            // UPDATE PART
            //
               
            // Update the outer dimensions.
            svg .attr("width", canvasWidth)
                .attr("height", canvasHeight);                

            // Update the inner dimensions
            var gUpdate = svg.select('g')
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");        

            // Update the graph elements
            // 1. Central body
            bodies = gUpdate.selectAll('.nBody').data(model.objects);
            bodies.select('circle')
                .attr("cx",function(d) { return xScale(d.x) })
                .attr("cy",function(d) { return yScale(d.y) })
                .attr("r",function(d) { return plotScale*Math.pow(d.mass,1/3)*massScale });

            bodies.select('line.velocity')
                .attr("x1",function(d) { return xScale(d.x) })
            	.attr("y1",function(d) { return yScale(d.y) })
                .attr("x2",function(d) { return xScale(d.x+d.vx * velocityScale) })
            	.attr("y2",function(d) { return yScale(d.y+d.vy * velocityScale) });

            bodies.select('line.acceleration')
                .attr("x1",function(d) {return xScale(d.x)})
                .attr("y1",function(d) {return yScale(d.y)})
                .attr("x2",function(d) {return xScale(d.x+d.ax * accelerationScale)})
                .attr("y2",function(d) {return yScale(d.y+d.ay * accelerationScale)});


            var orbitLineFunction = d3.svg.line()
                .x( function(d) { return (xScale(d.x)); } )
                .y( function(d) { return (yScale(d.y)); } );

            bodies.select('.trail')
                .attr("d",function(d,i) { return orbitLineFunction(model.objects[i].trail) } );
                
            centreOfMass();
            gUpdate.select('.centreOfMass')
                .attr("cx",function(d) { return xScale(model.com.x) })
                .attr("cy",function(d) { return yScale(model.com.y) })
                .attr("r",3);
                
        }); // End of selection.each(function(data)...
    }
    return chart;

} // end of nBodyChart

var myChart = nBodyChart()
    .canvasWidth(500)
    .canvasHeight(500);


function initialize() {
    var yarray = [];
    model.objects.forEach( function(currentObject) {
        yarray.push(currentObject.x);        
        yarray.push(currentObject.y);
        yarray.push(currentObject.z);
        yarray.push(currentObject.vx);
        yarray.push(currentObject.vy);
        yarray.push(currentObject.vz);         
    });
    model.y0 = Vector.create(yarray);                
//     d3.select("#nbody").datum(model).call(myChart);
}

function animate() {
    requestAnimationFrame( animate );
    model.time += model.stepsize;
    if (model.time < 1e6) {
//        console.log(model.time, model.objects);
        var y = astro.rungekutta4_singlestep(ode_nbody, model.y0, model.time, model.stepsize);
        model.objects.forEach( function(currentObject, index) {
          currentObject.x = y.e(index*6 + 1);
          currentObject.y = y.e(index*6 + 2);
          currentObject.z = y.e(index*6 + 3);

          currentObject.vx = y.e(index*6 + 4);
          currentObject.vy = y.e(index*6 + 5);
          currentObject.vz = y.e(index*6 + 6);
          
          currentObject.trail.push({x: currentObject.x, y: currentObject.y});
        })
        var yarray = [];
        model.objects.forEach( function(currentObject) {
            yarray.push(currentObject.x);        
            yarray.push(currentObject.y);
            yarray.push(currentObject.z);
            yarray.push(currentObject.vx);
            yarray.push(currentObject.vy);
            yarray.push(currentObject.vz);         
        });
        model.y0 = Vector.create(yarray);
        
        d3.select("#nbody").datum(model).call(myChart);
    }
}
initialize();
animate();