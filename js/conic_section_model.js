// =============================================================================
// Model
// =============================================================================

    
var model = {
    centralBody: astro.earth,
    eccentricity: 1.33,
    semiLatusRectum: 6378+10000,
    numSteps: 360,
    maxCoordinate: 100000,
    trueAnomaly: 30*Math.PI/180,
    twoBodyData: [],
    argumentOfPerigee: 0,
    
    init: function model_init() {
        var trueAnomaly;
        // Compute the minimum and maximum true anomaly
        if (model.eccentricity < 1) {
            model.minTrueAnomaly = -1 * Math.PI;
            model.maxTrueAnomaly = 1 * Math.PI;
        } else {
            model.maxTrueAnomaly = Math.acos(-1/model.eccentricity);
            model.minTrueAnomaly = -1 * Math.acos(-1/model.eccentricity);
        }
        model.angularMomentum = Math.sqrt(model.semiLatusRectum*model.centralBody.gravitationalParameter)

        // Compute the orbit trajectory
        for (i=0; i< model.numSteps; i++)
        {
            trueAnomaly = model.minTrueAnomaly + (i / (model.numSteps-1)) * (model.maxTrueAnomaly - model.minTrueAnomaly);
            model.twoBodyData[i] = {};
            model.twoBodyData[i].trueAnomaly = trueAnomaly;
            model.twoBodyData[i].radialVelocity = (model.centralBody.gravitationalParameter/model.angularMomentum)
                    * model.eccentricity * Math.sin(model.twoBodyData[i].trueAnomaly);
            model.twoBodyData[i].normalVelocity = (model.centralBody.gravitationalParameter/model.angularMomentum)
                    * (1 + model.eccentricity * Math.cos(model.twoBodyData[i].trueAnomaly));
            model.twoBodyData[i].velocity = Math.sqrt(Math.pow(model.twoBodyData[i].normalVelocity,2) + Math.pow(model.twoBodyData[i].radialVelocity,2));            
            model.twoBodyData[i].r = model.semiLatusRectum / (1 + model.eccentricity * Math.cos(model.twoBodyData[i].trueAnomaly));
            if (model.twoBodyData[i].r > 1e6) { model.twoBodyData[i].r = 1e6; }
            if (model.twoBodyData[i].r < 0) { model.twoBodyData[i].r = 1e6; }
            model.twoBodyData[i].x = model.twoBodyData[i].r * Math.cos(model.twoBodyData[i].trueAnomaly + model.argumentOfPerigee);
            model.twoBodyData[i].y = model.twoBodyData[i].r * Math.sin(model.twoBodyData[i].trueAnomaly + model.argumentOfPerigee);
            model.twoBodyData[i].flightPathAngle = Math.atan2((model.eccentricity * Math.sin(model.twoBodyData[i].trueAnomaly)),(1+model.eccentricity * Math.cos(model.twoBodyData[i].trueAnomaly)));
            
        }
        
        // Compute the position of the current point
        model.computeCurrentDataFromTrueAnomaly(model.trueAnomaly);

        // Compute the perigee height
        //model.perigeeHeight = model.semiLatusRectum * (1-model.eccentricity) / (1-Math.pow(model.eccentricity,2));

        // Set the minimum and maximum distances for scaling the plot
        model.yMin = -50000; model.yMax = 50000;
        model.xMin = -80000; model.xMax = 20000;
    },
    computeCurrentDataFromTrueAnomaly: function(trueAnomaly)
    {
        if (trueAnomaly < model.minTrueAnomaly) 
        { 
            trueAnomaly = model.minTrueAnomaly; 
        }
        if (trueAnomaly > model.maxTrueAnomaly) {
            trueAnomaly = model.maxTrueAnomaly; 
        }

        model.trueAnomaly = trueAnomaly;
        model.trueAnomalyDeg = model.trueAnomaly * 180 / Math.PI;
        model.argumentOfPerigeeDeg = model.argumentOfPerigee * 180 / Math.PI;
        model.r =  model.semiLatusRectum / 
            (1 + model.eccentricity * Math.cos(model.trueAnomaly));
        if (model.r > 1e12 || model.r < 0) { model.r = 1e12; }
        model.x = model.r * Math.cos(model.trueAnomaly+model.argumentOfPerigee);
        model.y = model.r * Math.sin(model.trueAnomaly+model.argumentOfPerigee); 
        model.radialVelocity = (model.centralBody.gravitationalParameter/model.angularMomentum)
                    * model.eccentricity * Math.sin(model.trueAnomaly);
        model.normalVelocity = (model.centralBody.gravitationalParameter/model.angularMomentum)
                    * (1 + model.eccentricity * Math.cos(model.trueAnomaly));
        model.velocity = Math.sqrt(Math.pow(model.normalVelocity,2) + Math.pow(model.radialVelocity,2));
        model.flightPathAngle = Math.atan2((model.eccentricity * Math.sin(model.trueAnomaly)),(1+model.eccentricity * Math.cos(model.trueAnomaly)));
        model.flightPathAngleDeg = model.flightPathAngle * 180 / Math.PI;
        model.escapeVelocity = Math.sqrt(2 * model.centralBody.gravitationalParameter / model.r);
        model.circularVelocity = Math.sqrt(model.centralBody.gravitationalParameter / model.r);
        model.hodographCenter = model.centralBody.gravitationalParameter / model.angularMomentum;
        model.hodographRadius = model.centralBody.gravitationalParameter * model.eccentricity / model.angularMomentum;
        model.perigeeHeight = (model.semiLatusRectum / (1 + model.eccentricity)) - model.centralBody.radius;
    }
};
