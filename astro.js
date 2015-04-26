astro = (function() {

	var myobject = {};

	CentralBody = function(gravitationalParameter, radius) {
		this.gravitationalParameter = gravitationalParameter;
		this.radius = radius;
	}
	
	myobject.earth = new CentralBody(398600.44189, 6378.1);
	// myobject.moon = ...
	// myobject.jupiter = ..., etc.
	
	myobject.KeplerOrbit = function(centralBody, perigeeHeight, eccentricity) {
		this.centralBody = centralBody;
		this.perigeeHeight = perigeeHeight;
		this.eccentricity = eccentricity;
		
		if (eccentricity < 1) {
    		this.semiMajorAxis = (this.centralBody.radius+this.perigeeHeight)/(1.0-this.eccentricity);
    		this.semiLatusRectum = this.semiMajorAxis * (1.0-Math.pow(this.eccentricity,2));
            this.mean_motion = Math.sqrt(this.centralBody.gravitationalParameter / Math.pow(this.semiMajorAxis,3));
    		this.period = 2 * Math.PI / this.mean_motion;
        } else if (eccentricity === 1) {
            this.semiMajorAxis = 200000; 
    		this.semiLatusRectum = 2.0 * (this.centralBody.radius+this.perigeeHeight);
            this.mean_motion = Math.sqrt(this.centralBody.gravitationalParameter / Math.pow(this.semiLatusRectum,3));
            this.period = 8.0 * 60.0 * 60.0;            
        } else {
    		this.semiMajorAxis = (this.centralBody.radius+this.perigeeHeight)/(1.0-this.eccentricity);
    		this.semiLatusRectum = this.semiMajorAxis * (1.0-Math.pow(this.eccentricity,2));
            this.mean_motion = Math.sqrt(-1.0 * this.centralBody.gravitationalParameter / Math.pow(this.semiMajorAxis,3));
            this.period = 8.0 * 60.0 * 60.0;            
        }		
		this.angularMomentum = Math.sqrt(this.semiLatusRectum*centralBody.gravitationalParameter);
	}
	
	myobject.compute_twobody = function(kepler_orbit,duration,numsteps) {
		var orbitcoords = new Array();
		var tstep = duration / numsteps;
		var simulationTime, meanAnomaly, trueAnomaly, r, x, y, v, v_radial, v_normal, v_x, v_y, gamma, angles, flightPathAngle;
		var costheta, sintheta;
		var initial_meanAnomaly = -0.5 * kepler_orbit.period * kepler_orbit.mean_motion;
		for (i = 0; i < numsteps; i++) {

			simulationTime = i * tstep;
			
			meanAnomaly = initial_meanAnomaly + simulationTime * kepler_orbit.mean_motion;
			if (kepler_orbit.eccentricity < 1 && meanAnomaly > Math.PI) { meanAnomaly -= 2 * Math.PI; }
			angles = trueAnomaly_from_meanAnomaly(meanAnomaly,kepler_orbit.eccentricity);

			costheta = Math.cos(angles.trueAnomaly);
			sintheta = Math.sin(angles.trueAnomaly);
	
			r = kepler_orbit.semiLatusRectum / 
			    ( 1 + kepler_orbit.eccentricity * costheta);
			v = Math.sqrt(  kepler_orbit.centralBody.gravitationalParameter * 
	            ( (2/r) - (1/kepler_orbit.semiMajorAxis) )  );

            flightPathAngle = Math.atan((kepler_orbit.eccentricity * sintheta) / (1+kepler_orbit.eccentricity * costheta));

	        vradial = (kepler_orbit.centralBody.gravitationalParameter/kepler_orbit.angularMomentum)
	                    * kepler_orbit.eccentricity * sintheta;

	        vnormal = (kepler_orbit.centralBody.gravitationalParameter/kepler_orbit.angularMomentum)
	                    * (1 + kepler_orbit.eccentricity * costheta);

			orbitcoords[i] = {
				centralBody: kepler_orbit.centralBody,
				simulationFrame: i,
	    		simulationTime: simulationTime,
	    		timeSincePerigee: meanAnomaly / kepler_orbit.mean_motion,
	    		semiMajorAxis: kepler_orbit.semiMajorAxis,
	    		eccentricity: kepler_orbit.eccentricity,
	    		perigeeHeight: kepler_orbit.perigeeHeight,
				meanAnomaly: meanAnomaly,
				trueAnomaly: angles.trueAnomaly,
				trueAnomalyDeg: angles.trueAnomaly * 180 / Math.PI,
				eccentricAnomaly: angles.eccentricAnomaly,
				r: r,
				x: r * costheta,
				y: r * sintheta,
				v: Math.sqrt( kepler_orbit.centralBody.gravitationalParameter * 
	                ( (2/r) - (1/kepler_orbit.semiMajorAxis) ) ),
	            vradial: vradial,
	            vnormal: vnormal,
	            flightPathAngle: flightPathAngle,
	            flightPathAngleDeg: flightPathAngle * 180 / Math.PI,
/*
				vradial_x: +1 * vradial * costheta,
				vradial_y: -1 * vradial * sintheta,
				vnormal_x: -1 * vnormal * sintheta,
				vnormal_y: -1 * vnormal * costheta, 
				v_x: +1 * vradial * costheta -1 * vnormal * sintheta,
				v_y: -1 * vradial * sintheta -1 * vnormal * costheta,
*/
				height: r - kepler_orbit.centralBody.radius
			}
		}
		return orbitcoords;
	}
	
	function trueAnomaly_from_meanAnomaly(meanAnomaly, eccentricity) {
	  // Find the true anomaly as a function of the mean anomaly for an orbit in the 2-body problem
	  var theta_rad;
	  var eccentricAnomaly_new, eccentricAnomaly_old;
	  var hyperbolic_anomaly_new, hyperbolic_anomaly_old;
	  var iterations;
	  var criteria = 999.99;
	  var c, yy, xx;
	
	  if (eccentricity < 1) {
	    // Elliptical orbit
	    // Apply the Newton-Raphson method to solve Kepler's equation
	    eccentricAnomaly_old = meanAnomaly;
	    iterations = 0
	    while (true) {
		  iterations++;
	      eccentricAnomaly_new = meanAnomaly + eccentricity * Math.sin(eccentricAnomaly_old);
	      criteria = Math.abs(eccentricAnomaly_old - eccentricAnomaly_new);
	      if (criteria < 1e-4) { break; }
	      if (iterations > 100) { console.log("More than 100 iterations required to determine eccentric anomaly."); break; }
	      eccentricAnomaly_old = eccentricAnomaly_new;
	    }
	    theta_rad = 2*Math.atan(Math.sqrt((1+eccentricity)/(1-eccentricity))*Math.tan(0.5 * eccentricAnomaly_new));
	  } else if (eccentricity === 1.0) {
	    // Parabolic orbit.
	    c = 3 * meanAnomaly;
	    yy = Math.pow(c + Math.sqrt( Math.pow(c,2) + 1 ),(1/3));
	    xx = yy - (1/yy);
	    theta_rad = 2 * Math.atan(xx);
	    eccentricAnomaly_new = 0;
	  } else {
	    // Hyperbolic orbit
	    if (Math.abs(meanAnomaly) < 6 * eccentricity) {
	      var xx = Math.sqrt( 8 * (eccentricity-1) / eccentricity);
	      var yy = (1.0/3.0) * Math.asinh(3 * meanAnomaly / xx * (eccentricity-1));
	      hyperbolic_anomaly_old = xx*Math.sinh(yy);
	    } else if (meanAnomaly > 6 * eccentricity) {
	      hyperbolic_anomaly_old = Math.log(2 * meanAnomaly / eccentricity);
	    } else if (meanAnomaly < -6 * eccentricity) {
	      hyperbolic_anomaly_old = Math.log(-2 * meanAnomaly / eccentricity);
	    }
	    iterations = 0;
	    while (true) {
		  iterations++;
	      hyperbolic_anomaly_new = hyperbolic_anomaly_old - 
	      						   (eccentricity * Math.sinh(hyperbolic_anomaly_old)-hyperbolic_anomaly_old-meanAnomaly) / 
	      						   (eccentricity * Math.cosh(hyperbolic_anomaly_old)-1);
	      criteria = Math.abs(hyperbolic_anomaly_old - hyperbolic_anomaly_new);
	      if (criteria < 1e-6) { break; }
	      if (iterations > 50) { console.log("More than 50 iterations required to determine hyperbolic anomaly."); break; }
	      hyperbolic_anomaly_old = hyperbolic_anomaly_new;
	    }
	    theta_rad = 2 * Math.atan(Math.sqrt((eccentricity + 1)/(eccentricity - 1)) * Math.tanh(0.5 * hyperbolic_anomaly_new));
	    eccentricAnomaly_new = hyperbolic_anomaly_new;
	  }
	  return { trueAnomaly: theta_rad, eccentricAnomaly: eccentricAnomaly_new };
	};
	
    myobject.rungekutta4_singlestep = function(ode_function, y0, t, h) {
        var yi = y0.dup();
        var ti = t;

        var f1 = ode_function(ti,yi);
        var f2 = ode_function(ti+0.5*h,yi.add(f1.multiply(0.5*h)));
        var f3 = ode_function(ti+0.5*h,yi.add(f2.multiply(0.5*h)));
        var f4 = ode_function(ti+h,yi.add(f3.multiply(h)));
        
        var y = yi.add(f1.multiply(h/6))
                  .add(f2.multiply(h/3))
                  .add(f3.multiply(h/3))
                  .add(f4.multiply(h/6));
        //console.log(t,y.inspect());
        return y;
    };

    myobject.rungekutta4 = function(ode_function, t0, y0, tf, h) {
        var ti; // current time
        var yi;
        var t = t0;
        var y = y0.dup();
        var orbit = [];
        i = 0;
        while (t < tf) {
            ti = t;
            yi = y.dup();
            
            f1 = ode_function(ti,yi);
            f2 = ode_function(ti+0.5*h,yi.add(f1.multiply(0.5*h)));
            f3 = ode_function(ti+0.5*h,yi.add(f2.multiply(0.5*h)));
            f4 = ode_function(ti+h,yi.add(f3.multiply(h)));
            
            y = yi.add(f1.multiply(h/6))
                  .add(f2.multiply(h/3))
                  .add(f3.multiply(h/3))
                  .add(f4.multiply(h/6));
                  
            t = t + h;
            orbit[i] = y;
            i++;
        }
        return orbit;
    };

    myobject.ode_2body = function(t,y) {
        if (y.dimensions() != 6) { console.log("ode_orbit: Expected 6 elements in vector"); }
        var farray = [];
        var r = Math.sqrt(Math.pow(y.e(1),2)+Math.pow(y.e(2),2)+Math.pow(y.e(3),2));
        var mu, factor;
        mu = 398600.44189; 
        factor = - mu / Math.pow(r,3);
        farray[0] = y.e(4);
        farray[1] = y.e(5);
        farray[2] = y.e(6);
        farray[3] = factor * y.e(1);
        farray[4] = factor * y.e(2);
        farray[5] = factor * y.e(3);
        return Vector.create(farray);
    };

	return myobject;
}());

String.prototype.toHHMMSS = function () {
    var sec_num = parseInt(this, 10); // don't forget the second param
    var abs_sec_num = Math.abs(sec_num)
    var hours   = Math.floor(abs_sec_num / 3600);
    var minutes = Math.floor((abs_sec_num - (hours * 3600)) / 60);
//    var seconds = sec_num - (hours * 3600) - (minutes * 60);
    if (hours   < 10) {hours   = "0"+hours;}
    if (sec_num < 0) { hours = "-"+hours; }
    if (minutes < 10) {minutes = "0"+minutes;}
//    if (seconds < 10) {seconds = "0"+seconds;}
    var time    = hours+'h '+minutes+'m';
    return time;
}
