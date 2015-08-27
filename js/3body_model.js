model = {
    zoomLevel: 2,
    maxZoomLevel: 10000,
    showTrails: true,
    showSphereOfInfluence: false,
    zeroObject: { position: Vector.Zero(3), velocity: Vector.Zero(3), inertialVelocity: Vector.Zero(3), inertialTrail: [], corotatingTrail: [], name: "Centre of mass" },
    corotating: false,
    rotationLine: Line.create([0,0,0],[0,0,1]),
    rotationAngle: 0,
    mu: 0.0625,
    largestMass: 1,
    distanceMassiveBodies: 1,
    lagrangePoints: [{ name: "L1" },{ name: "L2" },{ name: "L3" },{ name: "L4"},{ name: "L5"}],    
    velocity: 0,
    velocityAzimuth: 0,
    x: 0.5,  y:   0,  z: 0, 
    vx:  0, vy: 0.1, vz: 0,
    omega: 1,
    omegaVec: Vector.create([0,0,1]),
    objects: [
        {   
            corotatingTrail: [],
            inertialTrail: [],
            color: "Orange",
            name: "Orange massive object"
        },
        {   
            corotatingTrail: [],
            inertialTrail: [],
            color: "red",
            name: "Red massive object"
        },
        {   
            corotatingTrail: [],
            inertialTrail: [],
            color: "blue",
            name: "Blue spacecraft"
        },        
    ],
    com: {trail: []},
    time: 0,
    stepSize: 5e-3,
    gravitationalConstant: 6.67384e-11,

    r1: function r1(position) {
        var x = position.e(1);
        var y = position.e(2);
        var z = position.e(3);
        return Math.sqrt( Math.pow(model.mu + x, 2) + Math.pow(y, 2) + Math.pow(z, 2) );
    },

    r2: function r2(position) {
        var x = position.e(1);
        var y = position.e(2);
        var z = position.e(3);
        return Math.sqrt( Math.pow(1 - model.mu - x, 2) + Math.pow(y, 2) + Math.pow(z, 2) );        
    },

    initThreeBodyProblemMainBodies: function initThreeBodyProblemMainBodies() {
        model.objects[0].mass = model.largestMass;
        model.objects[1].mass = (model.mu / (1 - model.mu)) * model.largestMass;

        // Set circular velocity of the two massive bodies
        model.circularVelocity = Math.sqrt(model.gravitationalConstant*(model.objects[0].mass+model.objects[1].mass) /
                                            model.distanceMassiveBodies);
        model.objects[0].velocity = Vector.create([0, -model.mu * model.circularVelocity, 0]);
        model.objects[1].velocity = Vector.create([0, (1-model.mu) * model.circularVelocity, 0]);

        // Set position of the two massive bodies wrt the centre of mass
        model.objects[0].position = Vector.create([(-1*model.mu) * model.distanceMassiveBodies, 0, 0]);
        model.objects[1].position = Vector.create([(1-model.mu) * model.distanceMassiveBodies, 0, 0]);

        // Determine the locations of the Lagrange points (Wakker, 2015, p66)
        var alpha = model.mu / (1-model.mu);
        var beta = Math.pow( (1/3) * alpha, (1/3));
        var gamma1 = beta - (1/3) * Math.pow(beta,2) - (1/9) * Math.pow(beta,3) - (23/81) * Math.pow(beta,4);
        var gamma2 = beta + (1/3) * Math.pow(beta,2) - (1/9) * Math.pow(beta,3) - (31/81) * Math.pow(beta,4);
        var gamma3 = 1 - (7/12) * alpha + (7/12) * Math.pow(alpha,2) - (13223/20736) * Math.pow(alpha,3);
        model.lagrangePoints[0].position = Vector.create([ (1 - model.mu - gamma1), 0, 0]);
        model.lagrangePoints[1].position = Vector.create([ (1 - model.mu + gamma2), 0, 0]);
        model.lagrangePoints[2].position = Vector.create([-(model.mu + gamma3), 0, 0]);        
        model.lagrangePoints[3].position = Vector.create([(0.5 - model.mu),  0.5 * Math.pow(3,0.5), 0]); 
        model.lagrangePoints[4].position = Vector.create([(0.5 - model.mu), -0.5 * Math.pow(3,0.5), 0]);

        // Determine the data for the zero-velocity contours
        model.currentContoursFunction = zeroVelocityCurves();
        model.currentContoursFunction.mu(model.mu);       
    },
    
    initThreeBodyProblemThirdBody: function initThreeBodyProblemThirdBody() {
        // Set mass, position and velocity of the third body
        model.objects[2].mass = 0; 
        model.objects[2].position = Vector.create([model.x,  model.y,  model.z]);
        model.objects[2].velocity = Vector.create([model.vx, model.vy, model.vz]);

        // Determine the normalized position and velocity of the third body
        model.objects[2].positionNormalized = model.objects[2].position.multiply(1/model.distanceMassiveBodies);
        model.objects[2].velocityNormalized = model.objects[2].velocity
                                                          .multiply(1/(model.omega*model.distanceMassiveBodies));
        
        // Determine Jacobi's constant
        model.jacobiConstant = Math.pow(model.objects[2].position.e(1),2) +            // x^2 +
                                Math.pow(model.objects[2].position.e(2),2) +            // y^2 +
                                2*(1-model.mu)/model.r1(model.objects[2].position) +    // 2(1-mu)/r1 +
                                2*model.mu/model.r2(model.objects[2].position) -        // 2mu/r2 -
                                Math.pow(model.objects[2].velocity.modulus(),2);        // V^2
        
        // Determine the contours
        model.currentContoursFunction.jacobiConstant(model.jacobiConstant);
        model.currentContours = model.currentContoursFunction();
    },
    
    eraseTrails: function() {
        model.objects.forEach( function(currentObject, index) {
            currentObject.inertialTrail = [];
            currentObject.corotatingTrail = [];            
        });
        model.zeroObject.inertialTrail = [];
    }
};

function computeNextTimeStep() {
    // Set the input for the integration
    var y0 = Vector.create([model.x,
                            model.y,
                            model.z,
                            model.vx,
                            model.vy,
                            model.vz]);
    
    // Perform the integration
    var y = astro.rungekutta4_singlestep(ode_3body, y0, model.time, model.stepSize);

    // Set the output after the integration
    model.x = y.e(1)
    model.y = y.e(2)
    model.z = y.e(3)
    model.vx = y.e(4)
    model.vy = y.e(5)
    model.vz = y.e(6)
    model.velocity = Math.sqrt(Math.pow(model.vx,2) + Math.pow(model.vy,2) + Math.pow(model.vz,2));
    model.velocityAzimuth = Math.atan2(model.vy,model.vx);
    
    model.time += model.stepSize;    
    model.nextTimeStepComputed = true;
    model.rotationAngle = -model.time;
}

function setModel() {
    
    // Set the inertial velocity vectors, by adding corotation velocity
    model.objects.forEach( function(currentObject, index) {
        currentObject.inertialVelocity = currentObject.velocity.add(model.omegaVec.cross(currentObject.position));
    });

    // Set the velocity relative to the reference object by subtracting its velocity
/*
    model.objects.forEach( function(currentObject, index) {
        currentObject.inertialVelocity = currentObject.inertialVelocity.subtract(model.trailRefObject.inertialVelocity);
    });
*/

    // Add the current coordinates to the trail
    if (model.showTrails && model.nextTimeStepComputed) {
        model.objects.forEach( function(currentObject, index) {
            currentObject.corotatingTrail.push(currentObject.position);
            currentObject.inertialTrail.push(currentObject.position.rotate(-model.rotationAngle,model.rotationLine));
        });
        model.zeroObject.inertialTrail.push(model.zeroObject.position);
        model.zeroObject.corotatingTrail.push(model.zeroObject.position);
    }
    model.nextTimeStepComputed = false;
}

/*
function acceleration() {
    model.totalKineticEnergy = 0;
    model.totalPotentialEnergy = 0;
    
    model.objects.forEach( function(object1, index1) {
        object1.acceleration = Vector.Zero(3);

        object1.kineticEnergy = 0.5 * object1.mass * Math.pow(object1.velocity.modulus(),2);
        object1.potentialEnergy = 0;
        
        model.objects.forEach ( function(object2, index2) {
           if (index1 != index2) {
               var delta = object2.position.subtract(object1.position);
               var distance = delta.modulus();
               var factor = model.gravitationalConstant * object2.mass/Math.pow(distance,3);
               object1.acceleration = object1.acceleration.add(delta.multiply(factor));
               object1.potentialEnergy -= 0.5 * model.gravitationalConstant * object1.mass * object2.mass /
                     object1.position.subtract(object2.position).modulus();
           }             
        })
        model.totalKineticEnergy += object1.kineticEnergy;
        model.totalPotentialEnergy += object1.potentialEnergy;        
    });
    model.totalEnergy = model.totalKineticEnergy + model.totalPotentialEnergy;    
}
*/

function ode_3body(t,yin) 
{ // note that the time t is not used to evaluate the acceleration here
    // Set helper variables from input vector
    var x = yin.e(1);
    var y = yin.e(2);
    var z = yin.e(3);
    var vx = yin.e(4);
    var vy = yin.e(5);
    var vz = yin.e(6);

    // Set the helper variables for acceleration calculation (Wakker, 2015, p. 59)
    var mu = model.mu;
    var r1 = Math.sqrt( Math.pow(mu+x,2) + Math.pow(y,2) + Math.pow(z,2) );
    var r2 = Math.sqrt( Math.pow(1-mu-x,2) + Math.pow(y,2) + Math.pow(z,2) );

    // Accelerations (Wakker, 2015, p. 59)
    var ax = x - (1-mu)*(mu+x)/Math.pow(r1,3) + mu*(1-mu-x)/Math.pow(r2,3) + 2*vy;
    var ay = y - (1-mu)*y/Math.pow(r1,3) - mu*y/Math.pow(r2,3) - 2*vx;
    var az = -(1-mu)*z/Math.pow(r1,3) - mu*z/Math.pow(r2,3);

    // Set velocity and acceleration components
    farray = [vx,vy,vz,ax,ay,az];
    return Vector.create(farray);
}

var zeroVelocityCurves = function() {
    // Constants relevant for contours
    var mu = 0; // Ratio of smaller body mass compared to total system mass, determines shape of contours
    var jacobiConstant = 3; // Value of Jacobi's constant that determines which zero-velocity contour level to return
    
    // Range and stepsize for contouring
    // in normalized distance units, where major body is at -mu
    // and minor body is at 1-mu on x-axis from origin
    var range = { min: -3, max: +3 }; 
    var step = 0.03; // Lower stepsize makes more finely detailed contour
    
    // Ranges in x and y for the data array
    var xs = d3.range(range.min, range.max + step/2, step);
    var ys = d3.range(range.min, range.max + step/2, step);

    var data = []; // will contain the array of values from which the contours are created

    function initData() { // Creates the data[][] array of values for contouring
        xs.forEach( function(currentXValue,xIndex) {
            data[xIndex] = [];
            ys.forEach( function(currentYValue,yIndex) {
                data[xIndex][yIndex] = zeroVelocityCurveEquation(mu,currentXValue,currentYValue,0);
            });
        });
    }
    
    function zeroVelocityCurveEquation(mu,x,y,z) { // Equation for zero velocity curves
        return  Math.pow(x,2) + 
                Math.pow(y,2) + 
                2*(1-mu) / (Math.sqrt( Math.pow(mu + x, 2) + Math.pow(y, 2) + Math.pow(z, 2) )) +
                2*mu / (Math.sqrt( Math.pow(1 - mu - x, 2) + Math.pow(y, 2) + Math.pow(z, 2) ));
    }

    makeContourList = function makeContourList() { // Generate the contours using conrec.js
        var contourLevels = [jacobiConstant]; // will contain the value(s) at which to create contours   
        var c = new Conrec;
        c.contour(data, 0, xs.length - 1, 0, ys.length - 1, xs, ys, contourLevels.length, contourLevels);
        return c.contourList();
    }

    makeContourList.jacobiConstant = function(value) {
        if (!arguments.length) return jacobiConstant;
        jacobiConstant = value;
        return makeContourList;
    }

    makeContourList.mu = function(value) {
        if (!arguments.length) return mu;
        mu = value;
        initData();
        return makeContourList;
    }
    
    return makeContourList;
    
}