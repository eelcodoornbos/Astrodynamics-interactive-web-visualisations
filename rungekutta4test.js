protosatellites = [
{
    semiMajorAxis0: 6378+2500, 
    eccentricity0: 0.0, 
    inclination0: 45,
    ascendingNode0: 0, 
    argumentOfPerigee0: 0, 
    timeSincePerigee0: 0,
    trueAnomaly0: 0,
    osculatingSemiMajorAxis: 6378.0,
    osculatingEccentricity: 0.01,
    osculatingInclination: 0.01,
    osculatingRightAscensionAscendingNode: 0.01,
    osculatingArgumentOfPerigee: 0.01,
    osculatingTrueAnomaly: 0.01,
    osculatingArgumentOfLatitude: 0.01,
    osculatingRightAscension: 0.01,
    y0: Vector.create([-2384.46, 5729.01, 3050.46, -7.36138, -2.98997, 1.64354]),
    deltaVMode: "Impulsive shot",
    deltaVDirection: "Along-track",
    deltaVMagnitude: 100,
    timePrevDeltaV: 0,
    ballisticCoefficient: 0.005,
    deltaVUsed: 0,
    satelliteColor: 0x5080a0, 
    emissiveColor: 0x000040,
    viewSatelliteBody: true,
    viewGroundTrack: false,
    viewPropagatedOrbitLine: false,
    viewOsculatingOrbitLine: true,
    viewOsculatingOrbitPlane: true,
    viewOsculatingOrbitPlaneOpacity: 0.5,
    viewRadiusLine: true,
    viewPerifocalAxes: false,  
},
{
    semiMajorAxis0: 6378+1505, 
    eccentricity0: 0.05, 
    inclination0: 15,
    ascendingNode0: 30, 
    argumentOfPerigee0: 40, 
    timeSincePerigee0: 0,
    trueAnomaly0: 0,  
    osculatingSemiMajorAxis: 6378.0,
    osculatingEccentricity: 0.01,
    osculatingInclination: 0.01,
    osculatingRightAscensionAscendingNode: 0.01,
    osculatingArgumentOfPerigee: 0.01,
    osculatingTrueAnomaly: 0.01,
    osculatingArgumentOfLatitude: 0.01,
    osculatingRightAscension: 0.01,
    y0: Vector.create([-2384.46, 5729.01, 3050.46, -7.36138, -2.98997, 1.64354]),
    deltaVMode: "Impulsive shot",
    deltaVDirection: "Along-track",
    deltaVMagnitude: 100,
    timePrevDeltaV: 0,
    ballisticCoefficient: 0.005,
    deltaVUsed: 0,
    satelliteColor: 0xf03030,
    emissiveColor: 0x400000,
    viewSatelliteBody: false,
    viewGroundTrack: false,
    viewPropagatedOrbitLine: false,
    viewOsculatingOrbitLine: false,
    viewOsculatingOrbitPlane: true,
    viewOsculatingOrbitPlaneOpacity: 0.0,  
    viewRadiusLine: false,
    viewPerifocalAxes: false,
}
];
satellites = [];
satellites = protosatellites.slice();

model = {
    stepsize: 0,
    duration: 1e30,
    time: 0,
    numsteps: 0,
    osculating_steps: 360,
    orbit: {},
    applyJ2: false,
    j2factor: 1,
    applyDrag: false,
    surfaceDensity: 1,
    scaleHeight: 20,
    initialize: function() {
      model.numsteps = model.duration / model.stepsize;
      for (var i = 0; i < satellites.length; i++) {
        satellites[i].y0 = cartesianStateFromKepler( { 
          semiMajorAxis: satellites[i].semiMajorAxis0,
          eccentricity: satellites[i].eccentricity0,
          inclination: satellites[i].inclination0,
          argumentOfPerigee: satellites[i].argumentOfPerigee0,
          rightAscensionAscendingNode: satellites[i].ascendingNode0,
          trueAnomaly: satellites[i].trueAnomaly0
        });
      }
    }
};


view = {
    cameraPosition: "Free",
    viewEarth: true,
    viewEarthMap: true,
    viewEarthGrid: true,
    equatorialPlaneRadius: 6368,
    viewCelestialSphere: true,
    viewInertialAxes: false,
    linelength: 100000,
    celestialSphereDistance: 10000,
    satellites: [],
    earthTexture: "Gray",
    celestialSphere: new THREE.Object3D(),

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

    reorientSatellite: function reorientSatellite(satelliteModel,satelliteView) {
            // Reorient the satellite
            var up = new THREE.Vector3(0, 1, 0);
            var axis = new THREE.Vector3( );
            var tangent = new THREE.Vector3(satelliteModel.y.e(4),satelliteModel.y.e(5),satelliteModel.y.e(6)).normalize();

            axis.crossVectors(up, tangent).normalize();
            var radians = Math.acos( up.dot( tangent ) );

            satelliteView.satelliteBody.quaternion.setFromAxisAngle( axis, radians );
//            satellite.translateOnAxis( up, -0.6 );
    },

    animate: function animate() {
        requestAnimationFrame( animate );

        if (model.time < model.duration) {
          // Spin the Earth
          earthRotationAngle = model.time/86400*2*Math.PI;          
          view.earth.rotation.set(0,0,earthRotationAngle);          
          // Integrate the orbit one time step
          model.time += model.stepsize;

          for (j = 0; j < satellites.length; j++) {
            // Integrate
            satellites[j].y = astro.rungekutta4_singlestep(astro.ode_2body_j2, satellites[j].y0, model.time, model.stepsize);
            // if (Math.abs(satellites[j].y.e(4)) < 0.1 && Math.abs(satellites[j].y.e(5)) < 0.1 && Math.abs(satellites[j].y.e(6)) < 0.1) {
            //   console.log("Crashed",satellites[j].y);
            // }

            // Compute the properties of the osculating orbit
            satellites[j].orbit = orbitFromPositionVelocity(Vector.create([satellites[j].y.e(1),satellites[j].y.e(2),satellites[j].y.e(3)]), 
                                                            Vector.create([satellites[j].y.e(4),satellites[j].y.e(5),satellites[j].y.e(6)]) );
            
            // Store in model properties for DAT.GUI access:
            satellites[j].osculatingSemiMajorAxis = satellites[j].orbit.semiMajorAxis;
            satellites[j].osculatingEccentricity = satellites[j].orbit.eccentricity;
            satellites[j].osculatingInclination = satellites[j].orbit.inclination * 180 / Math.PI;
            satellites[j].osculatingRightAscensionAscendingNode = satellites[j].orbit.rightAscensionAscendingNode * 180 / Math.PI;
            satellites[j].osculatingArgumentOfPerigee = satellites[j].orbit.argumentOfPerigee * 180 / Math.PI;
            satellites[j].osculatingTrueAnomaly = satellites[j].orbit.trueAnomaly * 180 / Math.PI;
            satellites[j].osculatingArgumentOfLatitude = satellites[j].orbit.argumentOfLatitude * 180 / Math.PI;
            satellites[j].osculatingRightAscension = satellites[j].orbit.rightAscension * 180 / Math.PI;            
            
            // Compute the position vector in view units (10^6 m) and update
            view.satellites[j].positionViewUnits = new THREE.Vector3(satellites[j].orbit.positionVector.e(1)/1e3,satellites[j].orbit.positionVector.e(2)/1e3,satellites[j].orbit.positionVector.e(3)/1e3);
            view.satellites[j].satelliteBody.position.set(view.satellites[j].positionViewUnits.x, view.satellites[j].positionViewUnits.y, view.satellites[j].positionViewUnits.z);
                        
            // Adjust velocity in case a Delta-V is applied
            var positiveDeltaVKey = view.keyboard.pressed("x");
            var negativeDeltaVKey = view.keyboard.pressed("z");
            var timeticker = new Date();
            if (positiveDeltaVKey || negativeDeltaVKey) { // Apply Delta Vs this time step
              var deltaVReady = true;
              if (satellites[j].deltaVMode == "Impulsive shot") {
                var deltaTime = timeticker.getTime() - satellites[j].timePrevDeltaV;
                if (deltaTime < 500) { deltaVReady = false; }
              }
              if (deltaVReady) {
                satellites[j].timePrevDeltaV = timeticker.getTime();
              
                var multiplier = 1;
                if (negativeDeltaVKey) { multiplier = -1; }
                if (satellites[j].deltaVDirection == "Along-track") {
                  var deltaV = satellites[j].orbit.velocityVector.dup().toUnitVector().multiply(satellites[j].deltaVMagnitude);
                } else if (satellites[j].deltaVDirection == "Cross-track") {
                  var deltaV = satellites[j].orbit.positionVector.dup().cross(satellites[j].orbit.velocityVector.dup()).toUnitVector().multiply(satellites[j].deltaVMagnitude);
                } else if (satellites[j].deltaVDirection == "Radial") {
                  var deltaV = satellites[j].orbit.positionVector.dup().toUnitVector().multiply(satellites[j].deltaVMagnitude);
                } 
                var deltaV = deltaV.multiply(multiplier);
                satellites[j].y.setElements([satellites[j].y.e(1),
                                          satellites[j].y.e(2),
                                          satellites[j].y.e(3),
                                          satellites[j].y.e(4)+deltaV.e(1)/1e3,
                                          satellites[j].y.e(5)+deltaV.e(2)/1e3,
                                          satellites[j].y.e(6)+deltaV.e(3)/1e3]);
                satellites[j].deltaVUsed += deltaV.modulus();
              }
            }
            satellites[j].y0 = satellites[j].y.dup();            
            
            view.reorientSatellite(satellites[j],view.satellites[j]);
                                    
            // Update orbit trail line
            view.satellites[j].propagatedOrbitLine.geometry.vertices.push(view.satellites[j].propagatedOrbitLine.geometry.vertices.shift());
            view.satellites[j].propagatedOrbitLine.geometry.vertices[view.linelength - 1] = view.satellites[j].positionViewUnits;
            view.satellites[j].propagatedOrbitLine.geometry.verticesNeedUpdate = true;
            
            // Update osculating orbit line
            for (var i = 0; i <= model.osculating_steps; i++) {
              view.satellites[j].osculatingOrbitLine.geometry.vertices[i] = new THREE.Vector3(satellites[j].orbit.osculatingOrbit[i].e(1),
                                                                                              satellites[j].orbit.osculatingOrbit[i].e(2),
                                                                                              satellites[j].orbit.osculatingOrbit[i].e(3)).multiplyScalar(1e-3);
            }
            view.satellites[j].osculatingOrbitLine.geometry.verticesNeedUpdate = true;

            // Update osculating orbit plane
              // 1. Add vertices
            for (var i = 0; i <= model.osculating_steps; i++) {
              view.satellites[j].osculatingOrbitPlane.geometry.vertices[i] = new THREE.Vector3(satellites[j].orbit.osculatingOrbit[i].e(1),
                                                                                               satellites[j].orbit.osculatingOrbit[i].e(2),
                                                                                               satellites[j].orbit.osculatingOrbit[i].e(3)).multiplyScalar(1e-3);
            }
            view.satellites[j].osculatingOrbitPlane.geometry.vertices[model.osculating_steps+1] = new THREE.Vector3(0,0,0); // Add extra vertix at the centre
              // 2. Add faces
            for (var i = 0; i < model.osculating_steps; i++) {
              view.satellites[j].osculatingOrbitPlane.geometry.faces[i] = new THREE.Face3( model.osculating_steps+1, i, i+1);
            }
            view.satellites[j].osculatingOrbitPlane.geometry.verticesNeedUpdate = true;
                                    
            // Update line from centre of Earth to satellite
            view.satellites[j].radiusLine.geometry.vertices[1] = view.satellites[j].positionViewUnits;
            view.satellites[j].radiusLine.geometry.verticesNeedUpdate = true;

            // Update eccentricity and angular momentum vectors
            var angularMomentumEndPoint = satellites[j].orbit.angularMomentumVector.toUnitVector().multiply(view.celestialSphereDistance);
            view.satellites[j].angularMomentumVector.geometry.vertices[1] = ( new THREE.Vector3(angularMomentumEndPoint.e(1), angularMomentumEndPoint.e(2), angularMomentumEndPoint.e(3)) );
            view.satellites[j].angularMomentumVector.geometry.verticesNeedUpdate = true;

            var eccentricityEndPoint = satellites[j].orbit.eccentricityVector.toUnitVector().multiply(view.celestialSphereDistance);
            view.satellites[j].eccentricityVector.geometry.vertices[1] = ( new THREE.Vector3(eccentricityEndPoint.e(1), eccentricityEndPoint.e(2), eccentricityEndPoint.e(3)) );
            view.satellites[j].eccentricityVector.geometry.verticesNeedUpdate = true;

            var semiLatusRectumEndPoint = satellites[j].orbit.angularMomentumVector.toUnitVector().cross(satellites[j].orbit.eccentricityVector.toUnitVector()).multiply(view.celestialSphereDistance);
            view.satellites[j].semiLatusRectumVector.geometry.vertices[1] = ( new THREE.Vector3(semiLatusRectumEndPoint.e(1), semiLatusRectumEndPoint.e(2), semiLatusRectumEndPoint.e(3)) );
            view.satellites[j].semiLatusRectumVector.geometry.verticesNeedUpdate = true;

            // Update ground track
            var groundtrackposition = view.satellites[j].positionViewUnits.clone().normalize().multiplyScalar(6.395);
            view.satellites[j].groundTrackLine.geometry.vertices.push(view.satellites[j].groundTrackLine.geometry.vertices.shift());
            view.satellites[j].groundTrackLine.geometry.vertices[view.linelength - 1] =
                new THREE.Vector3( (+1*groundtrackposition.x*Math.cos(earthRotationAngle) + groundtrackposition.y*Math.sin(earthRotationAngle) ),
                                   (-1*groundtrackposition.x*Math.sin(earthRotationAngle) + groundtrackposition.y*Math.cos(earthRotationAngle) ), 
                                    groundtrackposition.z );
            view.satellites[j].groundTrackLine.geometry.verticesNeedUpdate = true;

          } // End of loop over the satellites
          // Determine the camera position
          if (view.cameraPosition == "Satellite") {
            // cameraPosition = view.satellites[0].positionViewUnits.clone().add(view.satellites[0].positionViewUnits.clone().setLength(4));
            // camera.position.set(cameraPosition.x, cameraPosition.y, cameraPosition.z)
            controls.target = view.satellites[0].positionViewUnits;
            
            // var cameraup = view.satellites[0].angularMomentumVector.geometry.vertices[1].clone().normalize();
//            var cameraup = view.satellites[0].positionViewUnits.clone().normalize();

            // console.log(cameraup);
           camera.up.set( cameraup.x, cameraup.y, cameraup.z );
          // } else if (view.cameraPosition == "H vector") {
          //   cameraPosition = model.orbit.angularMomentumVector.toUnitVector().multiply(80)
          //   camera.position.set(cameraPosition.e(1), cameraPosition.e(2), cameraPosition.e(3))
          // } else if (view.cameraPosition == "e vector") {
          //   cameraPosition = model.orbit.eccentricityVector.toUnitVector().multiply(80)
          //   camera.position.set(cameraPosition.e(1), cameraPosition.e(2), cameraPosition.e(3))
          } else {
            controls.target = new THREE.Vector3(0,0,0);
            camera.up.set( 0, 0, 1 );                    
          }          
        } else { // Do nothing past the end of time
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
        var light = new THREE.AmbientLight( 0x707070 ); // soft white light
        scene.add( light );
               
        var light = new THREE.PointLight( 0xffffff, 8, 100000 );
        light.position.set( 94000, 0, 0 );
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
        axes = view.buildAxes( view.celestialSphereDistance );
        if (view.viewInertialAxes) {
          scene.add(axes);
        }
    },
    remove_orbit: function() {
      var viewposition, gtposition;
      for (var j = 0; j < satellites.length; j++) {
        viewposition = new THREE.Vector3(satellites[j].y0.e(1)/1e3,satellites[j].y0.e(2)/1e3,satellites[j].y0.e(3)/1e3);
        gtposition = viewposition.clone().normalize().multiplyScalar(6.39);
        for (var i=0; i < view.linelength; i++) {
            view.satellites[j].groundTrackLine.geometry.vertices[i] = gtposition;
            view.satellites[j].propagatedOrbitLine.geometry.vertices[i] = viewposition;
        }
        view.satellites[j].groundTrackLine.geometry.verticesNeedUpdate = true;
        view.satellites[j].propagatedOrbitLine.geometry.verticesNeedUpdate = true;
        satellites[j].deltaVUsed = 0;
      }
    },
    initialize_satellite: function(satelliteModel) {    
        // Satellite
        satelliteView = {};
        
        var geometry = new THREE.CylinderGeometry( 0.0, 0.3, 1.2, 32 );
        var material = new THREE.MeshPhongMaterial( { color: satelliteModel.satelliteColor, emissive: satelliteModel.emissiveColor } );
        satelliteView.satelliteBody = new THREE.Mesh(geometry, material);

        if (satelliteModel.viewSatelliteBody) {
          scene.add(satelliteView.satelliteBody);
        }
        return satelliteView;
    },
    initialize_orbitviews: function(satelliteModel,satelliteView) {
      satelliteView.propagatedOrbitLine = new THREE.Line( new THREE.Geometry(), new THREE.LineBasicMaterial( { color: satelliteModel.satelliteColor, linewidth: 3 } ));
      satelliteView.osculatingOrbitLine = new THREE.Line( new THREE.Geometry(),new THREE.LineBasicMaterial( { color: satelliteModel.satelliteColor, linewidth: 3 } ));
      satelliteView.osculatingOrbitPlane = new THREE.Mesh( new THREE.Geometry(), new THREE.MeshLambertMaterial( { emissive: satelliteModel.satelliteColor, side: THREE.DoubleSide, transparent: true, opacity: satelliteModel.viewOsculatingOrbitPlaneOpacity } ) );
      satelliteView.groundTrackLine = new THREE.Line( new THREE.Geometry(), new THREE.LineBasicMaterial( { color: satelliteModel.satelliteColor,linewidth: 1.5 } ));
      satelliteView.radiusLine = new THREE.Line(new THREE.Geometry(), new THREE.LineBasicMaterial( { color: satelliteModel.satelliteColor,linewidth: 1.5 } ) );
      satelliteView.radiusLine.geometry.vertices[0] = new THREE.Vector3(0,0,0);

      satelliteView.perifocalAxes = new THREE.Object3D();
      satelliteView.eccentricityVector = new THREE.Line( new THREE.Geometry(), new THREE.LineBasicMaterial( { color: satelliteModel.satelliteColor, linewidth: 4 } ));
      satelliteView.eccentricityVector.geometry.vertices[0] = new THREE.Vector3(0,0,0);      
      satelliteView.angularMomentumVector = new THREE.Line( new THREE.Geometry(), new THREE.LineBasicMaterial( { color: satelliteModel.satelliteColor, linewidth: 4 } ));
      satelliteView.angularMomentumVector.geometry.vertices[0] = new THREE.Vector3(0,0,0);
      satelliteView.semiLatusRectumVector = new THREE.Line( new THREE.Geometry(), new THREE.LineBasicMaterial( { color: satelliteModel.satelliteColor, linewidth: 4 } ));
      satelliteView.semiLatusRectumVector.geometry.vertices[0] = new THREE.Vector3(0,0,0);      
      satelliteView.perifocalAxes.add(satelliteView.eccentricityVector);
      satelliteView.perifocalAxes.add(satelliteView.angularMomentumVector);
//      satelliteView.perifocalAxes.add(satelliteView.semiLatusRectumVector);

      var viewposition = new THREE.Vector3(satelliteModel.y0.e(1)/1e3,satelliteModel.y0.e(2)/1e3,satelliteModel.y0.e(3)/1e3);
      var gtposition = viewposition.clone().normalize().multiplyScalar(6.39);      
      for (var i=0; i < view.linelength; i++) {
          satelliteView.groundTrackLine.geometry.vertices[i] = gtposition;
          satelliteView.propagatedOrbitLine.geometry.vertices[i] = viewposition;
      }      
      if (satelliteModel.viewPropagatedOrbitLine) {
        scene.add(satelliteView.propagatedOrbitLine);
      }
      if (satelliteModel.viewOsculatingOrbitLine) {
        scene.add(satelliteView.osculatingOrbitLine);
      }
      if (satelliteModel.viewOsculatingOrbitPlane) {
        scene.add(satelliteView.osculatingOrbitPlane);
      }
      if (satelliteModel.viewGroundTrack) {
        view.earth.add(satelliteView.groundTrackLine);
      }
      if (satelliteModel.viewRadiusLine) {
        scene.add(satelliteView.radiusLine);
      }
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
        // if (view.viewGroundTrack) { view.earth.add(view.groundTrackLine); }
        scene.add(view.earth);
                
        view.equatorialPlane = new THREE.Mesh( new THREE.CircleGeometry( view.equatorialPlaneRadius/1000, 360 ), new THREE.MeshLambertMaterial( { emissive: 0x000000, side: THREE.DoubleSide, transparent: true, opacity: 0.8 } ) );
        scene.add( view.equatorialPlane );
    },
    initialize_earthTexture: function() {
      if (view.earthTexture == "Colour") {
        view.earthMaterial.transparent = false;        
        view.earthMaterial.map = THREE.ImageUtils.loadTexture("earthmap1k.jpg");
        view.earthMaterial.bumpMap = THREE.ImageUtils.loadTexture('earthbump4k.jpg');
        view.earthMaterial.bumpScale = 0.05;
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
    setOrRemove: function setOrRemove(element, parentElement) {
      return function(value) {
        var parentEl;
        if (typeof parentElement != 'undefined') { parentEl = parentElement; } else { parentEl = scene; }
        if (value) {
          parentEl.add(element);
        } else {
          parentEl.remove(element);
        }
      };
    },
    initialize: function() {
      view.initialize_renderer();
      view.initialize_earth();
      for (i = 0; i < satellites.length; i++) {        
        view.satellites[i] = view.initialize_satellite(satellites[i]);
        view.satellites[i] = view.initialize_satellite(satellites[i]);
        view.initialize_orbitviews(satellites[i],view.satellites[i]);
      }
      view.initialize_axes();
      view.earthGridLines = view.initialize_gridlines(6.39,30,0,64,1);
      if (view.viewEarthGrid) { view.earth.add(view.earthGridLines); }
      var grid = view.initialize_gridlines(view.celestialSphereDistance,30,0,180,3);
      view.celestialSphere.add(grid);
      grid = view.initialize_gridlines(view.celestialSphereDistance,15,5,180,1);
      view.celestialSphere.add(grid)
      grid = view.initialize_gridlines(view.celestialSphereDistance,15,10,180,1);
      view.celestialSphere.add(grid)
      grid = view.initialize_gridlines(view.celestialSphereDistance,15,15,180,1);
      view.celestialSphere.add(grid)      
      
      if (view.viewCelestialSphere) {
        scene.add(view.celestialSphere);      
      }
    },
};
var testval = true;
model.initialize();
view.initialize();

var masterGUI = new dat.GUI();

masterGUI.add(model,"stepsize",-180,180).name("Step size");
var guiEnvironment = masterGUI.addFolder("Environment");
forceModelGravityFolder = guiEnvironment.addFolder('Gravity field');
forceModelGravityFolder.add(model,"applyJ2").name("Apply J2 gravity");
forceModelGravityFolder.add(model,"j2factor",-50,50).name("J2 factor");
forceModelDragFolder = guiEnvironment.addFolder('Atmospheric drag');
forceModelDragFolder.add(model,"applyDrag").name("Apply drag");
forceModelDragFolder.add(model,"surfaceDensity",0,10).name("Surface density");
forceModelDragFolder.add(model,"scaleHeight",0,100).name("Scale height");

var guiSatellite = new Array;
for (var i = 0; i < satellites.length; i++) {
  guiSatellite[i] = masterGUI.addFolder("Satellite " + (i+1));

  satelliteViewFolder = guiSatellite[i].addFolder('View');
  viewSatelliteBodyButton = satelliteViewFolder.add(satellites[i],"viewSatelliteBody").name("Satellite");
  viewSatelliteBodyButton.onChange(view.setOrRemove(view.satellites[i].satelliteBody));
  viewPropagatedOrbitLineButton = satelliteViewFolder.add(satellites[i],"viewPropagatedOrbitLine").name("Propagated orbit");
  viewPropagatedOrbitLineButton.onChange(view.setOrRemove(view.satellites[i].propagatedOrbitLine));
  viewOsculatingOrbitLineButton = satelliteViewFolder.add(satellites[i],"viewOsculatingOrbitLine").name("Osculating orbit");
  viewOsculatingOrbitLineButton.onChange(view.setOrRemove(view.satellites[i].osculatingOrbitLine));
  function setOpacity(object) {
    return function(value) {
      object.material.opacity = value;
    }
  }
  viewOsculatingOrbitPlane = satelliteViewFolder.add(satellites[i],"viewOsculatingOrbitPlaneOpacity",0.0,1.0).name("Orbit plane");
  viewOsculatingOrbitPlane.onChange( setOpacity(view.satellites[i].osculatingOrbitPlane) ); 
  viewGroundTrackButton = satelliteViewFolder.add(satellites[i],"viewGroundTrack").name("Ground track");
  viewGroundTrackButton.onChange(view.setOrRemove(view.satellites[i].groundTrackLine,view.earth));
  viewRadiusButton = satelliteViewFolder.add(satellites[i],"viewRadiusLine").name("Radius");
  viewRadiusButton.onChange(view.setOrRemove(view.satellites[i].radiusLine) );
  viewPerifocalAxesButton = satelliteViewFolder.add(satellites[i],"viewPerifocalAxes").name("Perifocal axes");
  viewPerifocalAxesButton.onChange(view.setOrRemove(view.satellites[i].perifocalAxes));  
  
  keplerFolder = guiSatellite[i].addFolder('Initial elements');
  keplerFolder.add(satellites[i],"semiMajorAxis0",6378+100,45000).name("Semi-major axis").onChange( function(value) { model.initialize(); view.remove_orbit(); } );
  keplerFolder.add(satellites[i],"eccentricity0",0,0.95).name('Eccentricity').onChange( function(value) { model.initialize(); view.remove_orbit(); } );
  keplerFolder.add(satellites[i],"inclination0",0,180).name('Inclination').onChange( function(value) { model.initialize(); view.remove_orbit(); } );
  keplerFolder.add(satellites[i],"ascendingNode0",0,360).name('Right ascension of the ascending node').onChange( function(value) { model.initialize(); view.remove_orbit(); } );
  keplerFolder.add(satellites[i],"argumentOfPerigee0",0,360).name('Argument of perigee').onChange( function(value) { model.initialize(); view.remove_orbit(); } );
  keplerFolder.add(satellites[i],"trueAnomaly0",0,360).name('True anomaly').onChange( function(value) { model.initialize(); view.remove_orbit(); } );
  
  osculatingFolder = guiSatellite[i].addFolder('Osculating elements (read only)');
  osculatingFolder.add(satellites[i],"osculatingSemiMajorAxis").name("Semi-major axis").listen();
  osculatingFolder.add(satellites[i],"osculatingEccentricity",0,1).name("Eccentricity").listen();
  osculatingFolder.add(satellites[i],"osculatingInclination",0,180).name("Inclination").listen();
  osculatingFolder.add(satellites[i],"osculatingRightAscensionAscendingNode",0,360).name("Right ascension of the ascending node").listen();
  osculatingFolder.add(satellites[i],"osculatingArgumentOfPerigee",0,360).name("Argument of perigee").listen();
  osculatingFolder.add(satellites[i],"osculatingTrueAnomaly",0,360).name("True anomaly").listen();
  osculatingFolder.add(satellites[i],"osculatingArgumentOfLatitude",0,360).name("Argument of latitude").listen();
//  osculatingFolder.add(satellites[i],"osculatingRightAscension",0,360).name("Right Ascension").listen();    
//  osculatingFolder.add(satellites[i],"ballisticCoefficient",0.0,0.1).name("Ballistic coefficient");

  deltaVFolder = guiSatellite[i].addFolder('Thrust (use z and x keys)');
  deltaVFolder.add(satellites[i],"deltaVMode",["Impulsive shot","Continuous thrust"]).name("Mode");
  deltaVFolder.add(satellites[i],"deltaVDirection",["Along-track","Cross-track","Radial"]).name("Direction");
  deltaVFolder.add(satellites[i],"deltaVMagnitude",0,1000).name("Magnitude");
  deltaVFolder.add(satellites[i],"deltaVUsed").name("Used Delta V").listen();  
}
viewFolder = guiEnvironment.addFolder('View');
viewFolder.add(view,"cameraPosition",["Free","Satellite","H vector","e vector"]).name("Camera position");
viewFolder.add(view,"earthTexture",["Gray","Colour","Transparent","None"]).name("Earth texture").onChange(function(value) { view.initialize_earthTexture() });
viewEarthGridButton = viewFolder.add(view,"viewEarthGrid").name("Lat/lon grid");
viewEarthGridButton.onChange(view.setOrRemove(view.earthGridLines,view.earth));

viewEquatorialPlaneRadius = viewFolder.add(view,"equatorialPlaneRadius",6370,view.celestialSphereDistance*5).name("Equatorial plane");
viewEquatorialPlaneRadius.onChange(function(value) {
  view.equatorialPlane.geometry = new THREE.CircleGeometry( value/1000, 360 );
  view.equatorialPlane.geometryNeedsUpdate = true;
});

viewCelestialSphereGrid = viewFolder.add(view,"viewCelestialSphere").name("Celestial sphere grid");
viewCelestialSphereGrid.onChange(view.setOrRemove(view.celestialSphere));

viewInertialAxesButton = viewFolder.add(view,"viewInertialAxes").name("Inertial axes");
viewInertialAxesButton.onChange(function(value) {
  if (value) {
    scene.add(axes);
  } else {
    scene.remove(axes);    
  }
})

view.animate();

function cartesianStateFromKepler( keplerObject ) {
  var torad = Math.PI/180.0;
  var argper = keplerObject.argumentOfPerigee * torad;
  var cosargper = Math.cos(argper);
  var sinargper = Math.sin(argper);
  var raan = keplerObject.rightAscensionAscendingNode * torad;
  var cosraan = Math.cos(raan);
  var sinraan = Math.sin(raan);
  var i = keplerObject.inclination * torad;
  var cosi = Math.cos(i);
  var sini = Math.sin(i);
  var semiMajorAxis = keplerObject.semiMajorAxis;
  var eccentricity = keplerObject.eccentricity;
  var tau = keplerObject.timeSincePerigee;
  var n = Math.sqrt(astro.earth.gravitationalParameter/Math.pow(semiMajorAxis,3));
  var theta = keplerObject.trueAnomaly * torad;
  var costheta = Math.cos(theta);
  var sintheta = Math.sin(theta);

  var l1 = cosargper*cosraan - sinargper*sinraan*cosi;
  var m1 = cosargper*sinraan + sinargper*cosraan*cosi;
  var n1 = sinargper*sini;
  var l2 = -sinargper*cosraan - cosargper*sinraan*cosi;
  var m2 = -sinargper*sinraan + cosargper*cosraan*cosi;
  var n2 = cosargper*sini; 

  var r = semiMajorAxis * ( 1 - Math.pow(eccentricity,2) ) / ( 1 + eccentricity * costheta);
  var H = Math.sqrt(astro.earth.gravitationalParameter*semiMajorAxis*(1-Math.pow(eccentricity,2)));
  var muoverh = astro.earth.gravitationalParameter / H;
  
  var x = r * (l1 * costheta + l2 * sintheta);
  var y = r * (m1 * costheta + m2 * sintheta);
  var z = r * (n1 * costheta + n2 * sintheta);
  var xdot = muoverh * ( -l1 * sintheta + l2 * (eccentricity + costheta));
  var ydot = muoverh * ( -m1 * sintheta + m2 * (eccentricity + costheta));
  var zdot = muoverh * ( -n1 * sintheta + n2 * (eccentricity + costheta));
  var y0 = Vector.create([x, y, z, xdot, ydot, zdot]);
  return y0;
}

function orbitFromPositionVelocity(position, velocity) {
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
  if (orbit.inclination > 0) {
    orbit.rightAscensionAscendingNode = Math.acos(Vector.i.dot(orbit.ascendingNodeVector)/orbit.ascendingNode);
    if (orbit.ascendingNodeVector.e(2) < 0) { orbit.rightAscensionAscendingNode = Math.PI * 2 - orbit.rightAscensionAscendingNode; }
  } else {
    orbit.rightAscensionAscendingNode = 0;
  }

  if (orbit.eccentricity > 1e-9 && orbit.ascendingNode > 1e-9) {
    orbit.argumentOfPerigee = Math.acos(orbit.ascendingNodeVector.dot(orbit.eccentricityVector)/(orbit.ascendingNode * orbit.eccentricity));
    if (orbit.eccentricityVector.e(3) < 0) { orbit.argumentOfPerigee = Math.PI * 2 - orbit.argumentOfPerigee; }        
  } else {
    orbit.argumentOfPerigee = 0;
  }
  if (isNaN(orbit.argumentOfPerigee)) { console.log("Argument of perigee is NaN for: ", orbit.ascendingNode,orbit.eccentricity); }

  orbit.trueAnomaly = Math.acos(orbit.eccentricityVector.dot(orbit.positionVector)/(orbit.eccentricity*orbit.radius ) );
  if (rdotv < 0) { orbit.trueAnomaly = Math.PI * 2 - orbit.trueAnomaly; }
  orbit.argumentOfLatitude = Math.acos(orbit.ascendingNodeVector.dot(position) / (orbit.ascendingNode * orbit.radius ) )
  if (position.e(3) < 0) { orbit.argumentOfLatitude = Math.PI * 2 - orbit.argumentOfLatitude; }
  orbit.rightAscension = Math.atan2(position.e(2),position.e(1));
  if (orbit.rightAscension < 0) { orbit.rightAscension += Math.PI * 2; }
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