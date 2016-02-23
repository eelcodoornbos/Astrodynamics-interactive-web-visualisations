model = {
    stepsize: 0,
    duration: 1e30,
    semiMajorAxis0: 6378+500, 
    eccentricity0: 0.05, 
    inclination0: 45,
    ascendingNode0: 0, 
    argumentOfPerigee0: 0, 
    timeSincePerigee0: 0,
    y0: Vector.create([-2384.46, 5729.01, 3050.46, -7.36138, -2.98997, 1.64354]),    
    time: 0,
    numsteps: 0,
    osculating_steps: 360,
    orbit: {},
    applyJ2: false,
    j2factor: 1,
    applyDrag: false,
    surfaceDensity: 1,
    scaleHeight: 20,
    deltaVMode: "Impulsive shot",
    deltaVDirection: "Along-track",
    deltaVMagnitude: 100,
    timePrevDeltaV: 0,
    ballisticCoefficient: 0.005,
    initialize: function() {
        model.numsteps = model.duration / model.stepsize;
        model.orbitFromInitialKepler();
    },
    orbitFromInitialKepler: function orbitFromInitialKepler() {
      var torad = Math.PI/180.0;
      var argper = model.argumentOfPerigee0 * torad;
      var cosargper = Math.cos(argper);
      var sinargper = Math.sin(argper);
      var raan = model.ascendingNode0 * torad;
      var cosraan = Math.cos(raan);
      var sinraan = Math.sin(raan);
      var i = model.inclination0 * torad;
      var cosi = Math.cos(i);
      var sini = Math.sin(i);
      var semiMajorAxis = model.semiMajorAxis0;
      var eccentricity = model.eccentricity0;
      var tau = model.timeSincePerigee0;
      var n = Math.sqrt(astro.earth.gravitationalParameter/Math.pow(semiMajorAxis,3));
      var theta = 0; //astro.trueAnomaly_from_meanAnomaly(n*(-1*model.timeSincePerigee0), eccentricity)
      var costheta = Math.cos(theta);
      var sintheta = Math.sin(theta);

      l1 = cosargper*cosraan - sinargper*sinraan*cosi;
      m1 = cosargper*sinraan + sinargper*cosraan*cosi;
      n1 = sinargper*sini;
      l2 = -sinargper*cosraan - cosargper*sinraan*cosi;
      m2 = -sinargper*sinraan + cosargper*cosraan*cosi;
      n2 = cosargper*sini; 

      var r = semiMajorAxis * ( 1 - Math.pow(eccentricity,2) ) / ( 1 + eccentricity * costheta);
      var H = Math.sqrt(astro.earth.gravitationalParameter*semiMajorAxis*(1-Math.pow(eccentricity,2)));
      var muoverh = astro.earth.gravitationalParameter / H;
      
      var x = r * (l1 * costheta + l2 * sintheta);
      var y = r * (m1 * costheta + m2 * sintheta);
      var z = r * (n1 * costheta + n2 * sintheta);
      var xdot = muoverh * ( -l1 * sintheta + l2 * (eccentricity + costheta));
      var ydot = muoverh * ( -m1 * sintheta + m2 * (eccentricity + costheta));
      var zdot = muoverh * ( -n1 * sintheta + n2 * (eccentricity + costheta));
      model.y0 = Vector.create([x, y, z, xdot, ydot, zdot]);
    },
    orbitFromPositionVelocity: function orbitFromPositionVelocity(position, velocity) {
      var orbit = {};
      var velocitySquared = velocity.dot(velocity);
      var muoverr = astro.earth.gravitationalParameter / position.modulus();
      var rdotv = position.dot(velocity);
      orbit.positionVector = position;
      orbit.velocityVector = velocity;
      orbit.radius = position.modulus();
      orbit.velocity = velocity.modulus();
      orbit.semiMajorAxis = orbit.radius / ( 2.0 - (orbit.radius * Math.pow(orbit.velocity,2)) / astro.earth.gravitationalParameter );
      
      var esinE = Math.sqrt(1.0/(astro.earth.gravitationalParameter*orbit.semiMajorAxis)) * rdotv;
      var ecosE = 1 - orbit.radius/orbit.semiMajorAxis;
      orbit.eccentricAnomaly = Math.atan2(esinE,ecosE);
      
      orbit.angularMomentumVector = position.cross(velocity);
      orbit.angularMomentum = orbit.angularMomentumVector.modulus();
      orbit.eccentricityVector = position.multiply(velocitySquared-muoverr).subtract(velocity.multiply(rdotv)).multiply(1/astro.earth.gravitationalParameter);
      orbit.eccentricity = orbit.eccentricityVector.modulus();
      orbit.ascendingNodeVector = Vector.k.cross(orbit.angularMomentumVector);
      orbit.ascendingNode = orbit.ascendingNodeVector.modulus();
      var ezdotH = Vector.k.dot(orbit.angularMomentumVector);
      orbit.inclination = Math.acos(ezdotH/orbit.angularMomentum);
     if (orbit.inclination > 1e-9) {
        orbit.rightAscensionAscendingNode = Math.acos(Vector.i.dot(orbit.ascendingNodeVector)/orbit.ascendingNode);
        if (orbit.ascendingNodeVector.e(2) < 0) { orbit.rightAscensionAscendingNode = Math.PI * 2 - orbit.rightAscensionAscendingNode; }
      } else {
        orbit.rightAscensionAscendingNode = 0;
      }
      if (orbit.eccentricity > 1e-9 && orbit.inclination > 1e-9) {
        orbit.argumentOfPerigee = Math.acos(orbit.ascendingNodeVector.dot(orbit.eccentricityVector)/(orbit.ascendingNode * orbit.eccentricity));
        if (orbit.eccentricityVector.e(3) < 0) { orbit.argumentOfPerigee = Math.PI * 2 - orbit.argumentOfPerigee; }        
      } else {
        orbit.argumentOfPerigee = 0;
      }
      orbit.trueAnomaly = Math.acos(orbit.eccentricityVector.dot(orbit.positionVector)/(orbit.eccentricity*orbit.radius ) );
      if (rdotv < 0) { orbit.trueAnomaly = Math.PI * 2 - orbit.trueAnomaly; }
      orbit.argumentOfLatitude = Math.acos(orbit.ascendingNodeVector.dot(position) / (orbit.ascendingNode * orbit.radius ) )
      if (position.e(3) < 0) { orbit.argumentOfLatitude = Math.PI * 2 - orbit.argumentOfLatitude; }

      orbit.osculatingOrbit = [];
      // Compute osculating orbit
      var cosargper = Math.cos(orbit.argumentOfPerigee);
      var sinargper = Math.sin(orbit.argumentOfPerigee);
      var cosraan = Math.cos(orbit.rightAscensionAscendingNode);
      var sinraan = Math.sin(orbit.rightAscensionAscendingNode);
      var cosi = Math.cos(orbit.inclination);
      var sini = Math.sin(orbit.inclination);
      var maxtheta = Math.PI;
      var mintheta = -maxtheta;
      
      var l1 = cosargper*cosraan - sinargper*sinraan*cosi;
      var m1 = cosargper*sinraan + sinargper*cosraan*cosi;
      var n1 = sinargper*sini;
      var l2 = -sinargper*cosraan - cosargper*sinraan*cosi;
      var m2 = -sinargper*sinraan + cosargper*cosraan*cosi;
      var n2 = cosargper*sini;

      for (var i = 0; i <= model.osculating_steps; i++) {
          orbit.osculatingOrbit[i] = {};
          var theta = mintheta + (i/model.osculating_steps) * (maxtheta - mintheta);
          costheta = Math.cos(theta); // Speed this up by storing costheta and sintheta as arrays in memory?
          sintheta = Math.sin(theta);
          var r = orbit.semiMajorAxis * ( 1 - Math.pow(orbit.eccentricity,2) ) / ( 1 + orbit.eccentricity * costheta);
          var x = r * (l1 * costheta + l2 * sintheta);
          var y = r * (m1 * costheta + m2 * sintheta);
          var z = r * (n1 * costheta + n2 * sintheta);
          orbit.osculatingOrbit[i] = Vector.create([x,y,z]);
      }
      return orbit;
    }
};


view = {
    cameraPosition: "Free",
    viewEarth: true,
    viewEarthMap: true,
    viewEarthGrid: true,
    viewEquatorialPlane: false,
    viewGroundTrack: false,
    viewInertialAxes: false,
    viewPerifocalAxes: false,
    viewPropagatedOrbitLine: true,
    viewOsculatingOrbitLine: true,
    viewCelestialSphere: true,
    linelength: 100000,
    earthTexture: "Gray",

    satelliteColor: 0x5080a0,

    perifocalAxes: new THREE.Object3D,
  
    celestialSphere: new THREE.Object3D(),

    eccentricityVector: new THREE.Line( new THREE.Geometry(), 
                        new THREE.LineBasicMaterial( { color: 0x880000, linewidth: 2 } )),

    angularMomentumVector: new THREE.Line( new THREE.Geometry(), 
                           new THREE.LineBasicMaterial( { color: 0x000088, linewidth: 2 } )),

    semiLatusRectumVector: new THREE.Line( new THREE.Geometry(), 
                           new THREE.LineBasicMaterial( { color: 0x008800, linewidth: 2 } )),


    propagatedOrbitLine: new THREE.Line( new THREE.Geometry(), 
                               new THREE.LineBasicMaterial( { color: 0xbb3333, linewidth: 2 } )),

    osculatingOrbitLine: new THREE.Line( new THREE.Geometry(), 
                               new THREE.LineBasicMaterial( { color: 0x5080a0, linewidth: 3 } )),

    osculatingOrbitPlane: new THREE.Mesh( new THREE.Geometry(), 
                                          new THREE.MeshLambertMaterial( { emissive: 0x5080a0, side: THREE.DoubleSide, transparent: true, opacity: 0.5 } ) ),
  
    groundTrackLine: new THREE.Line( new THREE.Geometry(), 
                                     new THREE.LineBasicMaterial( { color: 0x000088,linewidth: 1.5 } )),
    
    buildAxes: function( length ) {
        var axes = new THREE.Object3D();

       axes.add( view.buildAxis( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( length, 0, 0 ), 0xFF0000, false ) ); // +X
       axes.add( view.buildAxis( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( -length, 0, 0 ), 0xFF0000, true) ); // -X
       axes.add( view.buildAxis( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, length, 0 ), 0x00FF00, false ) ); // +Y
       axes.add( view.buildAxis( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, -length, 0 ), 0x00FF00, true ) ); // -Y
       axes.add( view.buildAxis( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, length ), 0x0000FF, false ) ); // +Z
       axes.add( view.buildAxis( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, -length ), 0x0000FF, true ) ); // -Z

        return axes;
    },

    buildAxis: function( src, dst, colorHex, dashed ) {
        var geom = new THREE.Geometry(),
            mat; 

        if(dashed) {
                mat = new THREE.LineDashedMaterial({ linewidth: 1, color: colorHex, dashSize: 0.5, gapSize: 0.5 });
        } else {
                mat = new THREE.LineBasicMaterial({ linewidth: 1, color: colorHex });
        }

        geom.vertices.push( src.clone() );
        geom.vertices.push( dst.clone() );
        geom.computeLineDistances(); // This one is SUPER important, otherwise dashed lines will appear as simple plain lines

        var axis = new THREE.Line( geom, mat, THREE.LinePieces );

        return axis;
    },

    reorientSatellite: function reorientSatellite() {
            // Reorient the satellite
            var up = new THREE.Vector3(0, 1, 0);
            var axis = new THREE.Vector3( );

            tangent = new THREE.Vector3(y.e(4),y.e(5),y.e(6)).normalize();
            axis.crossVectors(up, tangent).normalize();
            radians = Math.acos( up.dot( tangent ) );
            satellite.quaternion.setFromAxisAngle( axis, radians );
    },

    animate: function animate() {
        requestAnimationFrame( animate );

        if (model.time < model.duration) {
            
            // Integrate the orbit one time step
            model.time += model.stepsize;
            
            y = astro.rungekutta4_singlestep(astro.ode_2body_j2, model.y0, model.time, model.stepsize);

            // Compute the properties of the osculating orbit
            model.orbit = model.orbitFromPositionVelocity(Vector.create([y.e(1),y.e(2),y.e(3)]), Vector.create([y.e(4),y.e(5),y.e(6)]) );
            
            // Compute the position vector in view units (10^6 m)
            positionViewUnits = new THREE.Vector3(model.orbit.positionVector.e(1)/1e3,model.orbit.positionVector.e(2)/1e3,model.orbit.positionVector.e(3)/1e3);

            // Determine the camera position
            if (view.cameraPosition == "Satellite") {
              cameraPosition = positionViewUnits.clone().add(positionViewUnits.clone().setLength(4));
              camera.position.set(cameraPosition.x, cameraPosition.y, cameraPosition.z)
            } else if (view.cameraPosition == "H vector") {
              cameraPosition = model.orbit.angularMomentumVector.toUnitVector().multiply(80)
              camera.position.set(cameraPosition.e(1), cameraPosition.e(2), cameraPosition.e(3))
            } else if (view.cameraPosition == "e vector") {
              cameraPosition = model.orbit.eccentricityVector.toUnitVector().multiply(80)
              camera.position.set(cameraPosition.e(1), cameraPosition.e(2), cameraPosition.e(3))
            } else {
              controls.target = new THREE.Vector3(0,0,0);
            }

            satellite.position.set(positionViewUnits.x, positionViewUnits.y, positionViewUnits.z);
            
            // Adjust velocity in case a Delta-V is applied
            var positiveDeltaVKey = view.keyboard.pressed("x");
            var negativeDeltaVKey = view.keyboard.pressed("z");
            var timeticker = new Date();
            if (positiveDeltaVKey || negativeDeltaVKey) { // Apply Delta Vs this time step
              var deltaVReady = true;
              if (model.deltaVMode == "Impulsive shot") {
                var deltaTime = timeticker.getTime() - model.timePrevDeltaV;
                if (deltaTime < 1000) { deltaVReady = false; }
              }
              if (deltaVReady) {
                model.timePrevDeltaV = timeticker.getTime();
              
                var multiplier = 1;
                if (negativeDeltaVKey) { multiplier = -1; }
                if (model.deltaVDirection == "Along-track") {
                  var deltaV = model.orbit.velocityVector.dup().toUnitVector().multiply(model.deltaVMagnitude);
                } else if (model.deltaVDirection == "Cross-track") {
                  var deltaV = model.orbit.positionVector.dup().cross(model.orbit.velocityVector.dup()).toUnitVector().multiply(model.deltaVMagnitude);
                } else if (model.deltaVDirection == "Radial") {
                  var deltaV = model.orbit.positionVector.dup().toUnitVector().multiply(model.deltaVMagnitude);
                } 
                var deltaV = deltaV.multiply(multiplier);
                y.setElements([y.e(1),y.e(2),y.e(3),y.e(4)+deltaV.e(1)/1e3,y.e(5)+deltaV.e(2)/1e3,y.e(6)+deltaV.e(3)/1e3]);
              }
            }            
            
            model.y0 = y.dup();
            
            view.reorientSatellite();
                        
            // Update orbit trail line
            view.propagatedOrbitLine.geometry.vertices.push(view.propagatedOrbitLine.geometry.vertices.shift());
            view.propagatedOrbitLine.geometry.vertices[view.linelength - 1] = positionViewUnits;
            view.propagatedOrbitLine.geometry.verticesNeedUpdate = true;
            
            // Update osculating orbit line
            for (var i = 0; i <= model.osculating_steps; i++) {
              view.osculatingOrbitLine.geometry.vertices[i] = new THREE.Vector3(model.orbit.osculatingOrbit[i].e(1),model.orbit.osculatingOrbit[i].e(2),model.orbit.osculatingOrbit[i].e(3)).multiplyScalar(1e-3);
            }
            view.osculatingOrbitLine.geometry.verticesNeedUpdate = true;

            // Update osculating orbit plane
              // 1. Add vertices
            for (var i = 0; i <= model.osculating_steps; i++) {
              view.osculatingOrbitPlane.geometry.vertices[i] = new THREE.Vector3(model.orbit.osculatingOrbit[i].e(1),model.orbit.osculatingOrbit[i].e(2),model.orbit.osculatingOrbit[i].e(3)).multiplyScalar(1e-3);
            }
            view.osculatingOrbitPlane.geometry.vertices[model.osculating_steps+1] = new THREE.Vector3(0,0,0); // Add extra vertix at the centre
              // 2. Add faces
            for (var i = 0; i < model.osculating_steps; i++) {
              view.osculatingOrbitPlane.geometry.faces[i] = new THREE.Face3( model.osculating_steps+1, i, i+1);
            }
            view.osculatingOrbitPlane.geometry.verticesNeedUpdate = true;
                                    
            // Update line from centre of Earth to satellite
            radiusLine.geometry.vertices[1] = positionViewUnits;
            radiusLine.geometry.verticesNeedUpdate = true;

            // Update eccentricity and angular momentum vectors
            var angularMomentumEndPoint = model.orbit.angularMomentumVector.toUnitVector().multiply(10);
            view.angularMomentumVector.geometry.vertices[1] = ( new THREE.Vector3(angularMomentumEndPoint.e(1), angularMomentumEndPoint.e(2), angularMomentumEndPoint.e(3)) );
            view.angularMomentumVector.geometry.verticesNeedUpdate = true;

            var eccentricityEndPoint = model.orbit.eccentricityVector.toUnitVector().multiply(10);
            view.eccentricityVector.geometry.vertices[1] = ( new THREE.Vector3(eccentricityEndPoint.e(1), eccentricityEndPoint.e(2), eccentricityEndPoint.e(3)) );
            view.eccentricityVector.geometry.verticesNeedUpdate = true;

            var semiLatusRectumEndPoint = model.orbit.angularMomentumVector.toUnitVector().cross(model.orbit.eccentricityVector.toUnitVector()).multiply(10);
            view.semiLatusRectumVector.geometry.vertices[1] = ( new THREE.Vector3(semiLatusRectumEndPoint.e(1), semiLatusRectumEndPoint.e(2), semiLatusRectumEndPoint.e(3)) );
            view.semiLatusRectumVector.geometry.verticesNeedUpdate = true;

            earthRotationAngle = model.time/86400*2*Math.PI;

            // Update ground track
            groundtrackposition = positionViewUnits.clone().normalize().multiplyScalar(6.395);
            view.groundTrackLine.geometry.vertices.push(view.groundTrackLine.geometry.vertices.shift());
            view.groundTrackLine.geometry.vertices[view.linelength - 1] =
                new THREE.Vector3( (+1*groundtrackposition.x*Math.cos(earthRotationAngle) + groundtrackposition.y*Math.sin(earthRotationAngle) ),
                                   (-1*groundtrackposition.x*Math.sin(earthRotationAngle) + groundtrackposition.y*Math.cos(earthRotationAngle) ), 
                                    groundtrackposition.z );
            view.groundTrackLine.geometry.verticesNeedUpdate = true;

            // Spin the Earth            
            view.earth.rotation.set(0,0,earthRotationAngle);
    
        } else {
        }
        controls.update();
        renderer.render( scene, camera );
    },

    initialize_renderer: function() {
        // Start listening to the keyboard
        view.keyboard = new THREEx.KeyboardState();
      
        // Set up rendering
        renderer = new THREE.WebGLRenderer( { antialias: true } );
        renderer.setClearColor( 0xffffff, 1);
        renderer.setSize(window.innerWidth, window.innerHeight);
        canvas = document.body.appendChild(renderer.domElement);

        // Scene
        scene = new THREE.Scene();
        
        // Camera
        camera = new THREE.PerspectiveCamera(18, window.innerWidth/window.innerHeight, 0.1, 50000);
       // camera = new THREE.OrthographicCamera(-5,5,-5,5,0,20);
        camera.up.set( 0, 0, 1 );        
        camera.position.set(60, 30, 60);
        camera.lookAt(new THREE.Vector3(0, 0, 0));
     
        // Light    
        var light = new THREE.AmbientLight( 0x505050 ); // soft white light
        scene.add( light );
               
        var light = new THREE.PointLight( 0xffffff, 9, 100000 );
        light.position.set( 90000, 0, 0 );
        scene.add( light );
        
        // Controls    
        controls = new THREE.OrbitControls( camera, renderer.domElement );
        controls.rotateSpeed = 1.0;
        controls.zoomSpeed = 0.5;
        controls.panSpeed = 0.8;
        
        controls.noZoom = false;
        controls.noPan = false;
        
        controls.staticMoving = true;
        controls.dynamicDampingFactor = 0.3;
    },
      
    initialize_axes: function() {  
        // Axes
        axes = view.buildAxes( 20 );
        if (view.viewInertialAxes) {
          scene.add(axes);
        }
    },
    
    remove_orbit: function() {
      var viewposition, gtposition, i;
      viewposition = new THREE.Vector3(model.y0.e(1)/1e3,model.y0.e(2)/1e3,model.y0.e(3)/1e3);
      gtposition = viewposition.clone().normalize().multiplyScalar(6.39);
      for (i=0; i < view.linelength; i++) {
          view.groundTrackLine.geometry.vertices[i] = gtposition;
          view.propagatedOrbitLine.geometry.vertices[i] = viewposition;
      }
      view.groundTrackLine.geometry.verticesNeedUpdate = true;
      view.propagatedOrbitLine.geometry.verticesNeedUpdate = true;
    },
    
    initialize_orbit: function() {
        view.remove_orbit();
        // Orbit
        if (view.viewPropagatedOrbitLine) {
          scene.add(view.propagatedOrbitLine);
        }
        if (view.viewOsculatingOrbitLine) {
          scene.add(view.osculatingOrbitLine);          
        }
        scene.add(view.osculatingOrbitPlane);
        
        view.angularMomentumVector.geometry.vertices[0] = ( new THREE.Vector3(0, 0, 0) );
        view.eccentricityVector.geometry.vertices[0] = ( new THREE.Vector3(0, 0, 0) );
        view.semiLatusRectumVector.geometry.vertices[0] = ( new THREE.Vector3(0, 0, 0) );
        
        view.perifocalAxes.add(view.eccentricityVector);
        view.perifocalAxes.add(view.angularMomentumVector);
        view.perifocalAxes.add(view.semiLatusRectumVector);
        
        if (view.viewPerifocalAxes) {
          scene.add(view.perifocalAxes);
        }
    },
    
    initialize_satellite: function() {    
        // Satellite
        var geometry = new THREE.CylinderGeometry( 0.3, 0.3, 1.6, 16 );
        var material = new THREE.MeshPhongMaterial( { color: view.satelliteColor } );
        satellite = new THREE.Mesh (geometry, material);
        scene.add(satellite);
        var material = new THREE.LineBasicMaterial( { color: 0x000000,linewidth: 1.5 } );
        var geometry = new THREE.Geometry();
        radiusLine = new THREE.Line(geometry, material);
        radiusLine.geometry.vertices.push( new THREE.Vector3(0,0,0));
        radiusLine.geometry.vertices.push( new THREE.Vector3(model.y0.e(1)/1e3,model.y0.e(2)/1e3,model.y0.e(3)/1e3) );

        scene.add(radiusLine);
    },
     
    initialize_earth: function() {    
        // Earth    
        view.earth = new THREE.Object3D();
        view.earthMaterial = new THREE.MeshPhongMaterial();
        view.initialize_earthTexture();
        var geometry = new THREE.SphereGeometry( 6.378, 64, 64 );
        // ellipsoidgeometry = new THREE.Geometry();
        // view.ellipsoid();
        earthsphere = new THREE.Mesh( geometry, view.earthMaterial );
        earthsphere.rotation.set(0.5*Math.PI,0,0)
        view.earth.add( earthsphere );
        if (view.viewGroundTrack) { view.earth.add(view.groundTrackLine); }
        scene.add(view.earth);
                
        var circleGeometry = new THREE.CircleGeometry( 10, 360 );
        view.equatorialPlane = new THREE.Mesh( circleGeometry, new THREE.MeshLambertMaterial( { emissive: 0xa08050, side: THREE.DoubleSide, transparent: true, opacity: 0.3 } ) );
        if (view.viewEquatorialPlane) {
          scene.add( view.equatorialPlane );
        }
    },
    initialize_earthTexture: function() {
      if (view.earthTexture == "Colour") {
        view.earthMaterial.transparent = false;        
        view.earthMaterial.map = THREE.ImageUtils.loadTexture("earthmap1k.jpg");
        view.earthMaterial.bumpMap = THREE.ImageUtils.loadTexture('earthbump4k.jpg');
        view.earthMaterial.bumpScale = 0.1;
      } else if (view.earthTexture == "None") {
        view.earthMaterial.transparent = false;
        view.earthMaterial.map = THREE.ImageUtils.loadTexture("blankmap.png");
        view.earthMaterial.bumpMap = null;
        view.earthMaterial.bumpScale = 0;
      } else if (view.earthTexture == "Transparent") {
        view.earthMaterial.transparent = true;
        view.earthMaterial.opacity = 0.1;
        view.earthMaterial.map = THREE.ImageUtils.loadTexture("blankmap.png");
        view.earthMaterial.bumpMap = null;         
        view.earthMaterial.bumpScale = 0.0;
      } else {
        view.earthMaterial.transparent = false;
        // var loader = new THREE.TextureLoader()
        // loader.load("map.png", function(texture) { view.earthMaterial.map = texture; } );
        view.earthMaterial.map = THREE.ImageUtils.loadTexture("map.png");
        view.earthMaterial.bumpMap = null
        view.earthMaterial.bumpScale = 0.0;
      }
      view.earthMaterial.map.needsUpdate = true;
      view.earthMaterial.needsUpdate = true;
    },
    
    initialize_gridlines: function(distance,spacingDeg,offset,segments,lineWidth) {
        var gridlines = new THREE.Object3D();
        var geometry = new THREE.Geometry();
        var material = new THREE.LineBasicMaterial( { color: 0xdddddd, linewidth: lineWidth } );
        for (var imeridian = 0; imeridian < 180; imeridian += spacingDeg) {
            var angley = (imeridian+offset)/180*Math.PI;          
            for (var i = 0; i <= segments; i++) {
                var anglex = i/segments*2*Math.PI;
                geometry.vertices.push( new THREE.Vector3( 
                    distance*Math.sin(anglex)*Math.cos(angley),
                    -1*distance*Math.sin(anglex)*Math.sin(angley),
                    distance*Math.cos(anglex)
                ) );
            }
            gridline = new THREE.Line (geometry, material);
            gridlines.add(gridline);
        }
        for (var iparallel = -90; iparallel < 90; iparallel += spacingDeg) {
            var geometry = new THREE.Geometry();
            var material = new THREE.LineBasicMaterial( { color: 0xdddddd, linewidth: lineWidth } );
            var angley = (iparallel+offset)/180*Math.PI;            
            for (var i = 0; i <= segments; i++) {
                var anglex = i/segments*2*Math.PI;
                geometry.vertices.push( new THREE.Vector3( 
                    distance*Math.sin(anglex)*Math.cos(angley), 
                    distance*Math.cos(anglex)*Math.cos(angley),
                    distance*Math.sin(angley)
                ) );
            }
            gridline = new THREE.Line (geometry, material);
            gridlines.add(gridline);
        }
        return gridlines;
    },
    
    initialize: function() {
      view.initialize_renderer();
      view.initialize_orbit();
      view.initialize_satellite();
      view.initialize_axes();
      view.initialize_earth();
      view.earthGridLines = view.initialize_gridlines(6.39,30,0,64,1);
      if (view.viewEarthGrid) { view.earth.add(view.earthGridLines); }
      
      var grid = view.initialize_gridlines(15000,30,0,180,5);
      view.celestialSphere.add(grid);
      grid = view.initialize_gridlines(15000,15,5,180,1);
      view.celestialSphere.add(grid)
      grid = view.initialize_gridlines(15000,15,10,180,1);
      view.celestialSphere.add(grid)
      grid = view.initialize_gridlines(15000,15,15,180,1);
      view.celestialSphere.add(grid)      
      
      if (view.viewCelestialSphere) {
        scene.add(view.celestialSphere);      
      }
      view.animate();
    },

};

var gui = new dat.GUI();
gui.add(model,"stepsize",-180,180).name("Step size");

keplerFolder = gui.addFolder('Initial elements');
keplerFolder.add(model,"semiMajorAxis0",6378+100,45000).name("Semi-major axis").onChange( function(value) { model.initialize(); view.remove_orbit(); } );
keplerFolder.add(model,"eccentricity0",0,0.95).name('Eccentricity').onChange( function(value) { model.initialize(); view.remove_orbit(); } );
keplerFolder.add(model,"inclination0",0,180).name('Inclination').onChange( function(value) { model.initialize(); view.remove_orbit(); } );
keplerFolder.add(model,"ascendingNode0",0,360).name('Right ascension of the ascending node').onChange( function(value) { model.initialize(); view.remove_orbit(); } );
keplerFolder.add(model,"argumentOfPerigee0",0,360).name('Argument of perigee').onChange( function(value) { model.initialize(); view.remove_orbit(); } );

forceModelGravityFolder = gui.addFolder('Gravity field');
forceModelGravityFolder.add(model,"applyJ2").name("Apply J2 gravity");
forceModelGravityFolder.add(model,"j2factor",-50,50).name("J2 factor");
forceModelDragFolder = gui.addFolder('Drag force');
forceModelDragFolder.add(model,"applyDrag").name("Apply drag");
forceModelDragFolder.add(model,"surfaceDensity",0,10).name("Surface density");
forceModelDragFolder.add(model,"scaleHeight",0,100).name("Scale height");
forceModelDragFolder.add(model,"ballisticCoefficient",0.0,0.1).name("Ballistic coefficient");

deltaVFolder = gui.addFolder('Delta V (use z and x keys)');
deltaVFolder.add(model,"deltaVMode",["Impulsive shot","Continuous thrust"]).name("Mode");
deltaVFolder.add(model,"deltaVDirection",["Along-track","Cross-track","Radial"]).name("Direction");
deltaVFolder.add(model,"deltaVMagnitude",0,1000).name("Magnitude");

// deltaVFolder.add(model,"alongTrackDeltaV",-1000,1000).name("Along-track Delta-V");
// deltaVFolder.add(model,"crossTrackDeltaV",-1000,1000).name("Cross-track Delta-V");
// deltaVFolder.add(model,"radialDeltaV",-1000,1000).name("Radial Delta-V");

viewFolder = gui.addFolder('View');
viewFolder.add(view,"cameraPosition",["Free","Satellite","H vector","e vector"]).name("Camera position");
viewFolder.add(view,"earthTexture",["Gray","Colour","Transparent","None"]).name("Earth texture").onChange(function(value) { view.initialize_earthTexture() });

viewEarthGridButton = viewFolder.add(view,"viewEarthGrid").name("Lat/lon grid");
viewEarthGridButton.onChange(function(value) {
  if (value) {
    view.earth.add(view.earthGridLines);
  } else {
    view.earth.remove(view.earthGridLines);
  }
});

viewEquatorialPlaneButton = viewFolder.add(view,"viewEquatorialPlane").name("Equatorial plane");
viewEquatorialPlaneButton.onChange(function(value) {
  if (value) {
    scene.add(view.equatorialPlane);
  } else {
    scene.remove(view.equatorialPlane);
  }
});


viewCelestialSphereGrid = viewFolder.add(view,"viewCelestialSphere").name("Celestial sphere grid");
viewCelestialSphereGrid.onChange(function(value) {
  if (value) {
    scene.add(view.celestialSphere);
  } else {
    scene.remove(view.celestialSphere);
  }
});


orbitsFolder = gui.addFolder('Orbit views');
viewPropagatedOrbitLineButton = orbitsFolder.add(view,"viewPropagatedOrbitLine").name("Propagated orbit");
viewPropagatedOrbitLineButton.onChange(function(value) {
  if (value) {
    scene.add(view.propagatedOrbitLine);
  } else {
    scene.remove(view.propagatedOrbitLine);
  }
});

viewOsculatingOrbitLineButton = orbitsFolder.add(view,"viewOsculatingOrbitLine").name("Osculating orbit");
viewOsculatingOrbitLineButton.onChange(function(value) {
  if (value) {
    scene.add(view.osculatingOrbitLine);
    scene.add(view.osculatingOrbitPlane);

  } else {
    scene.remove(view.osculatingOrbitLine);
    scene.remove(view.osculatingOrbitPlane);
  }
});

viewGroundTrackButton = orbitsFolder.add(view,"viewGroundTrack").name("Ground track");
viewGroundTrackButton.onChange(function(value) {
  if (value) {
    view.earth.add(view.groundTrackLine);
  } else {
    view.earth.remove(view.groundTrackLine);
  }
});

axesFolder = gui.addFolder('Coordinate axes');
viewPerifocalAxesButton = axesFolder.add(view,"viewPerifocalAxes").name("Perifocal axes");
viewPerifocalAxesButton.onChange(function(value) {
  if (value) {
    scene.add(view.perifocalAxes);
  } else {
    scene.remove(view.perifocalAxes);  
  }
});
viewInertialAxesButton = axesFolder.add(view,"viewInertialAxes").name("Inertial axes");
viewInertialAxesButton.onChange(function(value) {
  if (value) {
    scene.add(axes);
  } else {
    scene.remove(axes);    
  }
})


// gui.remember(model);
model.initialize();
view.initialize();