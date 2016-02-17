model = {
    zoomLevel: 2000,
    maxZoomLevel: 10000,
    showTrails: true,
    showVelocities: true,
    showAccelerations: false,
    showOsculatingOrbits: false,
    showSphereOfInfluence: false,
    zeroObject: { position: Vector.Zero(3), velocity: Vector.Zero(3), trail: [] },
    referenceObject: {},
    objects: [
        {
            position:       Vector.create([ 0,   0, 0]),
            velocity:       Vector.create([ 0, 0, 0]),
            mass:           2000,
            trail: [],
            color: "orange",
            name: "Yellow sun"
        },
        {
            mass:           500,
            position:       Vector.create([ 1200,    0,   0]),
            velocity:       Vector.create([   0,   1.5,   0]),
            trail: [],
            color: "red",
            name: "Red planet"
        },
        {
            mass:           100,
            position:       Vector.create([ 0, 500,   0]),
            velocity:       Vector.create([   -2, 0,   0]),
            trail: [],
            color: "green",
            name: "Green planet"
        },

        {
            mass:           1e-9,
            position:       Vector.create([-500,    0,    0]),
            velocity:       Vector.create([   0,   -2,    0]),
            trail: [],
            color: "purple",
            name: "Purple spacecraft"
        },
        {
            mass:           5,
            position:       Vector.create([ 1400,    0,    0]),
            velocity:       Vector.create([    0,  -0.5,    0]),
            trail: [],
            color: "blue",
            name: "Blue spacecraft"
        },


    ],
/*
    objects: [
        {   
            position:       Vector.create([ 0,   0, 0]),
            velocity:       Vector.create([ 0,   0, 0]),
            mass:           5000,
            trail: [], 
            color: "orange",
            name: "Orange sun"
        },
        {   
            position:       Vector.create([ 1200,    0,   0]),
            velocity:       Vector.create([   0,    0,   0]),
            mass:           100, 
            trail: [], 
            color: "red",
            name: "Red planet"
        },
        {   
            mass:           0, 
            position:       Vector.create([ 1400, -800,   0]),
            velocity:       Vector.create([    0,    3.8,   0]),
            trail: [], 
            color: "green",
            name: "Green planet"
        },        

        {   
            mass:           0, 
            position:       Vector.create([-500,    0,    0]), 
            velocity:       Vector.create([   0,   1.2,    0]),
            trail: [], 
            color: "purple",
            name: "Purple spacecraft"   
        },
        {   
            mass:           0, 
            position:       Vector.create([400,    0,    0]), 
            velocity:       Vector.create([   0, -0.28,    0]),
            trail: [], 
            color: "blue",
            name: "Blue spacecraft"
        },
    ],
*/
    com: {trail: []},
    time: 0,
    stepSize: 5,
    gravitationalConstant: 1,
    initialize: function initialize() {
        model.referenceObject = model.com;
        centreOfMass();
//         setCircularVelocities();
        model.objects.forEach( function(currentObject, index)
        {
            if (index > 0) {
                positionVelocityToKepler(model.objects[index],model.objects[0]);
            }
        });
        model.objects[0].osculatingOrbit = [];    
    },
    eraseTrails: function() {
        model.objects.forEach( function(currentObject, index) {
            currentObject.trail = [];
        });
        model.com.trail = [];
        model.zeroObject.trail = [];
    }
};

function positionVelocityToKepler(object,centralbody) {
    var mu = model.gravitationalConstant * (centralbody.mass + object.mass); 
    var relativePosition = object.position.subtract(centralbody.position);
    var r = relativePosition.modulus()
    var relativeVelocity = object.velocity.subtract(centralbody.velocity);
    var v = relativeVelocity.modulus();
    var vsq = Math.pow(v,2);
    var rdotv = relativePosition.dot(relativeVelocity);
    var angularMomentumVector = relativePosition.cross(relativeVelocity);
    var angularMomentum = angularMomentumVector.modulus();
    
    // Semi-major axis
    var semiMajorAxis = r / (2 - r*vsq / mu); // (11.47)

    // Eccentricity
    var rvectore = relativePosition.multiply( vsq - (mu/r) );
    var vvectore = relativeVelocity.multiply(rdotv);
    var eccentricityVector = rvectore.subtract(vvectore).multiply(1/mu);
    var eccentricity = eccentricityVector.modulus();
    var eccentricitySq = Math.pow(eccentricity,2);
    
    // True anomaly
    var trueAnomaly = Math.acos(eccentricityVector.dot(relativePosition)/(eccentricity*r));
    if (rdotv < 0) { trueAnomaly = 2 * Math.PI - trueAnomaly; }
    trueAnomaly = trueAnomaly % (Math.PI*2);
    
    // Inclination
    var inclination = Math.atan2( Math.sqrt( Math.pow(angularMomentumVector.e(1),2) + 
                                             Math.pow(angularMomentumVector.e(2),2) ),
                                             angularMomentumVector.e(3));
    
    // Right Ascension of the ascending node
    var raan = 0//Math.atan2(angularMomentumVector.e(1),-angularMomentumVector.e(2));
//    var ascendingNodeVector = Vector.k.cross(angularMomentumVector);
    
    // Argument of perigee
    var argumentOfPerigee;
/*
    if (Math.abs(eccentricityVector.e(3)) > 0) {
        argumentOfPerigee = Math.acos(ascendingNodeVector.dot(eccentricityVector) / (ascendingNodeVector.modulus()*eccentricity));
        if (eccentricityVector.e(3) < 0) { argumentOfPerigee = Math.PI * 2 - argumentofPerigee; }
    } else { // Equatorial or 2D orbit
*/
        argumentOfPerigee = Math.atan2(eccentricityVector.e(2),eccentricityVector.e(1));
        if (angularMomentumVector.e(3) < 0) { argumentOfPerigee = Math.PI * 2 - argumentOfPerigee; }
//     }
    argumentOfPerigee = argumentOfPerigee % (Math.PI*2);
    
    var newObject = object;
    newObject.semiMajorAxis = semiMajorAxis;
    newObject.eccentricity = eccentricity;
    newObject.inclination = inclination;
    newObject.raan = raan;
    newObject.argumentOfPerigee = argumentOfPerigee;

    newObject = keplerOrbit(newObject);
    
    return newObject;
}

function keplerOrbit(object) {
    var argper = object.argumentOfPerigee;
    var cosargper = Math.cos(argper);
    var sinargper = Math.sin(argper);
    var raan = object.raan;
    var cosraan = Math.cos(raan);
    var sinraan = Math.sin(raan);
    var i = object.inclination;
    var cosi = Math.cos(i);
    var sini = Math.sin(i);
    var semiMajorAxis = object.semiMajorAxis;
    var eccentricity = object.eccentricity;

    l1 = cosargper*cosraan - sinargper*sinraan*cosi;
    m1 = cosargper*sinraan + sinargper*cosraan*cosi;
    n1 = sinargper*sini;
    l2 = -sinargper*cosraan - cosargper*sinraan*cosi;
    m2 = -sinargper*sinraan + cosargper*cosraan*cosi;
    n2 = cosargper*sini; 

    var osculatingOrbit = [];
    var theta = 0;
    var steps = 200;
    if (eccentricity > 1) {
        var maxtheta = Math.acos(-1/eccentricity);
    } else {
        var maxtheta = Math.PI;
    }
    var mintheta = -maxtheta;
    for (var i = 0; i <= steps; i++) {
        osculatingOrbit[i] = {};
        theta = mintheta + (i/steps) * (maxtheta - mintheta);
        costheta = Math.cos(theta); // Speed this up by storing costheta and sintheta as arrays in memory?
        sintheta = Math.sin(theta);
        var r = semiMajorAxis * ( 1 - Math.pow(eccentricity,2) ) / ( 1 + eccentricity * costheta);
        if (r > 2*model.zoomLevel || r < 0) { r = 2*model.zoomLevel; } 
        var x = r * (l1 * costheta + l2 * sintheta);
        var y = r * (m1 * costheta + m2 * sintheta);
        var z = r * (n1 * costheta + n2 * sintheta);
        osculatingOrbit[i] = Vector.create([x,y,z]).subtract(model.referenceObject.position.subtract(model.objects[0].position));
    }
    newObject = object;
    object.osculatingOrbit = osculatingOrbit;
    return newObject;
}

function computeTwoBodyOrbitParameters() {
    var mu = model.gravitationalConstant*model.objects[0].mass;
    model.objects.forEach( function(currentObject, index) {
        if (index > 0) {
            model.objects[index].angularMomentumVector = currentObject.position.cross(currentObject.velocity);
            model.objects[index].angularMomentum = model.objects[index].angularMomentumVector.modulus();
            model.objects[index].energy = 0.5 * Math.pow(currentObject.velocity.modulus(),2) - 
                mu / currentObject.position.modulus();
            model.objects[index].semiMajorAxis = -mu / (2*model.objects[index].energy);
            var rvectore = currentObject.position.multiply( Math.pow(currentObject.velocity.modulus(),2) - (mu/currentObject.position.modulus()) );
            var vvectore = currentObject.velocity.multiply(currentObject.position.dot(currentObject.velocity));
            model.objects[index].eccentricityVector = rvectore.subtract(vvectore).multiply(1/mu);
            model.objects[index].eccentricity = model.objects[index].eccentricityVector.modulus();
        }
    });
}

function computeNextTimeStep() {
    var yarray = [];
    model.objects.forEach( function(currentObject) {
        yarray.push(currentObject.position.e(1));        
        yarray.push(currentObject.position.e(2));
        yarray.push(currentObject.position.e(3));
        yarray.push(currentObject.velocity.e(1));
        yarray.push(currentObject.velocity.e(2));
        yarray.push(currentObject.velocity.e(3));         
    });
    var y0 = Vector.create(yarray);            
    var y = astro.rungekutta4_singlestep(ode_nbody, y0, model.time, model.stepSize);
    model.objects.forEach( function(currentObject, index)
    {
        currentObject.position = Vector.create([ y.e(index*6 + 1), y.e(index*6 + 2), y.e(index*6 + 3) ]);    
        currentObject.velocity = Vector.create([ y.e(index*6 + 4), y.e(index*6 + 5), y.e(index*6 + 6) ]);
        if (index > 0) {
            positionVelocityToKepler(model.objects[index],model.objects[0]);
        }
    });
    model.nextTimeStepComputed = true;
    model.objects[0].osculatingOrbit = [];
}

function setCircularVelocities() {
    model.objects.forEach( function(currentObject, index) {
       if (index != 0) {
           var radiusvec = currentObject.position.subtract(model.objects[0].position);
           var vcirc = Math.sqrt((model.objects[0].mass+currentObject.mass)*model.gravitationalConstant/radiusvec.modulus());
           var vcircunitvec = Vector.k.cross(radiusvec).toUnitVector();
           model.objects[index].velocity = vcircunitvec.multiply(vcirc).add(model.objects[0].velocity);
       } 
    });
}

function setModel() {
    centreOfMass();
    acceleration();
    displayPositionVelocity();    
    displayTrail();
    model.objects.forEach( function(currentObject, index)
    {
        if (index > 0) {
            positionVelocityToKepler(model.objects[index],model.objects[0]);
        }
    });
    
    positionVelocityToKepler(model.objects[1],model.objects[0]); 
    
    // Add the current coordinates to the trail
    if (model.showTrails && model.nextTimeStepComputed) 
    {
        model.objects.forEach( function(currentObject, index) {
            currentObject.trail.push(currentObject.position);
        })
        model.com.trail.push(model.com.position);
        model.zeroObject.trail.push(model.zeroObject.position);
    }
    model.nextTimeStepComputed = false;
}

function displayPositionVelocity() {
    model.objects.forEach( function(currentObject, index) {
        currentObject.displayPosition = currentObject.position.subtract(model.referenceObject.position);
        currentObject.displayVelocity = currentObject.velocity.subtract(model.referenceObject.velocity);
    });
    model.com.displayPosition = model.com.position.subtract(model.referenceObject.position);
}

function displayTrail() {
    model.objects.forEach( function(currentObject, objectIndex) {
       currentObject.displayTrail = [];
       currentObject.trail.forEach( function(trailPoint, trailPointIndex) {
           currentObject.displayTrail[trailPointIndex] = currentObject.trail[trailPointIndex].subtract(model.referenceObject.trail[trailPointIndex]);
       });
    });
}

function centreOfMass() {
    var positionTimesMassSum = Vector.Zero(3);
    var velocityTimesMassSum = Vector.Zero(3);

    model.totalMass = 0;

    model.objects.forEach( function(currentObject, index) 
    {        
        var positionTimesMass = currentObject.position.multiply(currentObject.mass);
        var velocityTimesMass = currentObject.velocity.multiply(currentObject.mass);
        positionTimesMassSum = positionTimesMassSum.add(positionTimesMass);
        velocityTimesMassSum = velocityTimesMassSum.add(velocityTimesMass);

        model.totalMass += currentObject.mass;
    });
    
    model.com.position = positionTimesMassSum.multiply(1/model.totalMass);
    model.com.velocity = velocityTimesMassSum.multiply(1/model.totalMass);
    model.comvx = model.com.velocity.e(1);
    model.comvy = model.com.velocity.e(2);
    
};

function acceleration() {
    model.totalKineticEnergy = 0;
    model.totalPotentialEnergy = 0;
    model.angularMomentum = $V([0,0,0]);
    
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
        model.angularMomentum = model.angularMomentum.add(object1.position.cross(object1.velocity).multiply(object1.mass));
    });
    model.totalEnergy = model.totalKineticEnergy + model.totalPotentialEnergy;
    model.Hz = model.angularMomentum.e(3);
};

function ode_nbody(t,y) 
{ // note that the time t is not used to evaluate the acceleration here
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
                var ax = ax + model.gravitationalConstant * mass2/Math.pow(distance,3)*deltax;
                var ay = ay + model.gravitationalConstant * mass2/Math.pow(distance,3)*deltay;
                var az = az + model.gravitationalConstant * mass2/Math.pow(distance,3)*deltaz;
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
        // model.objects[icurrent].acceleration = Vector.create([ax, ay, az]);
    }
    return Vector.create(farray);
};
