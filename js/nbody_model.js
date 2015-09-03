model = {
    zoomLevel: 2000,
    maxZoomLevel: 10000,
    showTrails: true,
    showVelocities: true,
    showAccelerations: true,
    showSphereOfInfluence: false,
    zeroObject: { position: Vector.Zero(3), velocity: Vector.Zero(3), trail: [] },
    referenceObject: {},
    objects: [
        {   
            position:       Vector.create([ 0,   0, 0]),
            velocity:       Vector.create([ 0, 2.78, 0]),
            mass:           1500,
            trail: [], 
            color: "orange",
            name: "Yellow sun"
        },
        {   
            mass:           200, 
            position:       Vector.create([ 600,    0,   0]),
            velocity:       Vector.create([   0, 1.12,   0]),
            trail: [], 
            color: "red",
            name: "Red planet"
        },
        {   
            mass:           100, 
            position:       Vector.create([ 1400, -800,   0]),
            velocity:       Vector.create([    0,    3.8,   0]),
            trail: [], 
            color: "green",
            name: "Green planet"
        },        

        {   
            mass:           1e-9, 
            position:       Vector.create([-500,    0,    0]), 
            velocity:       Vector.create([   0,   1.2,    0]),
            trail: [], 
            color: "purple",
            name: "Purple spacecraft"   
        },
        {   
            mass:           1e-9, 
            position:       Vector.create([440,    0,    0]), 
            velocity:       Vector.create([   0, -0.28,    0]),
            trail: [], 
            color: "blue",
            name: "Blue spacecraft"
        },        
    ],
    com: {trail: []},
    time: 0,
    stepSize: 5,
    gravitationalConstant: 1,
    initialize: function initialize() {
        model.referenceObject = model.zeroObject;
        model.totalMass = 0;
        model.objects.forEach( function(currentObject) {
           model.totalMass += currentObject.mass;
        });
    },
    eraseTrails: function() {
        model.objects.forEach( function(currentObject, index) {
            currentObject.trail = [];
        });
        model.com.trail = [];
        model.zeroObject.trail = [];
    }
};

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
    });
    model.nextTimeStepComputed = true;
}

function setModel() {

    centreOfMass();
    acceleration();
    displayPositionVelocity();    
    displayTrail();
    
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
    model.objects.forEach( function(object, index) {
        var positionTimesMass = object.position.multiply(object.mass);
        var velocityTimesMass = object.velocity.multiply(object.mass);
        positionTimesMassSum = positionTimesMassSum.add(positionTimesMass);
        velocityTimesMassSum = velocityTimesMassSum.add(velocityTimesMass);
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
model.initialize();