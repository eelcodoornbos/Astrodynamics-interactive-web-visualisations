model = {
    
    stepsize: 60,
    
    duration: 1e30,
    
    y0: Vector.create([0, 6878, 6878, 7.8, 0, 0]),
    
    time: 0,
    
    numsteps: 0,
    
    deltav: 0.1,
    
    deltavdir: 1,
    
    deltavsign: 1,
    
    initialize: function() {
        model.numsteps = model.duration / model.stepsize;
    },

};


view = {
        
    cameraonsat: false,
    linelength: 10000,
    satelliteColor: 0x5080a0,

    orbitLine: new THREE.Line( new THREE.Geometry(), 
                               new THREE.LineBasicMaterial( { color: 0x5080a0, linewidth: 1.5 } )),
    groundTrackLine: new THREE.Line( new THREE.Geometry(), 
                                     new THREE.LineBasicMaterial( { color: 0xcc6666,linewidth: 3 } )),
    
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
            y = astro.rungekutta4_singlestep(astro.ode_2body, model.y0, model.time, model.stepsize);

            position = new THREE.Vector3(y.e(1)/1e3,y.e(2)/1e3,y.e(3)/1e3);
            unitposition = position.clone().normalize();

            if (view.cameraonsat) {
                //scene.remove(satellite);           
                cameraPosition = position.clone().add(position.clone().setLength(4));
                camera.position.set(cameraPosition.x, cameraPosition.y, cameraPosition.z)
            } else {
                controls.target = new THREE.Vector3(0,0,0);
            }
            
            satellite.position.set(position.x, position.y, position.z);
            model.y0 = y.dup();
            
            view.reorientSatellite();
                        
            // Update orbit trail line
            view.orbitLine.geometry.vertices.push(view.orbitLine.geometry.vertices.shift());
            view.orbitLine.geometry.vertices[view.linelength - 1] = position;
            view.orbitLine.geometry.verticesNeedUpdate = true;
            
            // Update line from centre of Earth to satellite
            radiusLine.geometry.vertices[1] = position;
            radiusLine.geometry.verticesNeedUpdate = true;

            earthRotationAngle = model.time/86400*2*Math.PI;

            // Update ground track
            groundtrackposition = position.clone().normalize().multiplyScalar(6.39);
            view.groundTrackLine.geometry.vertices.push(view.groundTrackLine.geometry.vertices.shift());
            view.groundTrackLine.geometry.vertices[view.linelength - 1] = 
                new THREE.Vector3( (groundtrackposition.x*Math.cos(-earthRotationAngle) + groundtrackposition.z*Math.sin(-earthRotationAngle) ),
                                    groundtrackposition.y,
                                   (-1*groundtrackposition.x*Math.sin(-earthRotationAngle) + groundtrackposition.z*Math.cos(-earthRotationAngle) ) );
            view.groundTrackLine.geometry.verticesNeedUpdate = true;

            // Spin the Earth            
            earth.rotation.set(0,earthRotationAngle,0);
    
        } else {
        }
        controls.update();
        renderer.render( scene, camera );
    },

    initialize_renderer: function() {
        // Set up rendering
        renderer = new THREE.WebGLRenderer( { antialias: true } );
        renderer.setClearColor( 0xffffff, 1);
        renderer.setSize(window.innerWidth, window.innerHeight);
        canvas = document.body.appendChild(renderer.domElement);

        // Scene
        scene = new THREE.Scene();
        
        // Camera
        camera = new THREE.PerspectiveCamera(50, window.innerWidth/window.innerHeight, 0.1, 5000);
        camera.position.set(30, 15, 30);
        camera.lookAt(new THREE.Vector3(0, 0, 0));
     
        // Light    
        var light = new THREE.AmbientLight( 0x808080 ); // soft white light
        scene.add( light );
               
        var light = new THREE.PointLight( 0xa0a0a0, 5.5, 30000 );
        light.position.set( 0, 0, 25000 );
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
        scene.add(axes);
    },
    
    initialize_orbit: function() {    
        // Orbit
        for (i=0; i < view.linelength; i++) {
            gtposition = new THREE.Vector3(model.y0.e(1)/1e3,model.y0.e(2)/1e3,model.y0.e(3)/1e3);
            gtposition.normalize().multiplyScalar(6.39);
            view.orbitLine.geometry.vertices.push( new THREE.Vector3(model.y0.e(1)/1e3,model.y0.e(2)/1e3,model.y0.e(3)/1e3) );
            view.groundTrackLine.geometry.vertices.push( gtposition );
        }
        scene.add(view.orbitLine);
    },
    
    initialize_satellite: function() {    
        // Satellite
        var geometry = new THREE.CylinderGeometry( 0.15, 0.15, 0.8, 16 );
        var material = new THREE.MeshPhongMaterial( { color: view.satelliteColor, ambient: view.satelliteColor } );
        satellite = new THREE.Mesh (geometry, material);
        scene.add(satellite);
        var material = new THREE.LineBasicMaterial( { color: 0x000000,linewidth: 1 } );
        var geometry = new THREE.Geometry();
        radiusLine = new THREE.Line(geometry, material);
        radiusLine.geometry.vertices.push( new THREE.Vector3(0,0,0));
        radiusLine.geometry.vertices.push( new THREE.Vector3(model.y0.e(1)/1e3,model.y0.e(2)/1e3,model.y0.e(3)/1e3) );

        scene.add(radiusLine);
    },
     
    initialize_earth: function() {    
        // Earth    
        earth = new THREE.Object3D();
        var map = THREE.ImageUtils.loadTexture("map.png");
        var material = new THREE.MeshLambertMaterial({ map: map, transparent: true, opacity: 1, ambient: 0xdddddd });
        var geometry = new THREE.SphereGeometry( 6.378, 64, 64 );
        earthsphere = new THREE.Mesh( geometry, material );
        earth.add( earthsphere );
        earth.add(view.groundTrackLine);
        scene.add(earth);
    },
    
    initialize_gridlines: function() {
        for (var imeridian = 0; imeridian < 180; imeridian +=30) {
            var geometry = new THREE.Geometry();
            var material = new THREE.LineBasicMaterial( { color: 0x404040, linewidth: 0.5 } );
            for (var i = 0; i <= 64; i++) {
                geometry.vertices.push( new THREE.Vector3( 
                    6.39*Math.sin(i/64*2*Math.PI)*Math.cos(imeridian/180*Math.PI), 
                    6.39*Math.cos(i/64*2*Math.PI), 
                    -6.39*Math.sin(i/64*2*Math.PI)*Math.sin(imeridian/180*Math.PI) 
                ) );
            }
            gridline = new THREE.Line (geometry, material);
            earth.add(gridline);
        }
        for (var iparallel = -90; iparallel < 90; iparallel +=30) {
            var geometry = new THREE.Geometry();
            var material = new THREE.LineBasicMaterial( { color: 0x404040, linewidth: 0.5 } );
            for (var i = 0; i <= 64; i++) {
                geometry.vertices.push( new THREE.Vector3( 
                    6.39*Math.sin(i/64*2*Math.PI)*Math.cos(iparallel/180*Math.PI), 
                    6.39*Math.sin(iparallel/180*Math.PI),
                    6.39*Math.cos(i/64*2*Math.PI)*Math.cos(iparallel/180*Math.PI) 
                ) );
            }
            gridline = new THREE.Line (geometry, material);
            earth.add(gridline);
        }
    },
    
    initialize: function() {
      view.initialize_renderer();
      view.initialize_orbit();
      view.initialize_satellite();
      view.initialize_axes();
      view.initialize_earth();
      view.initialize_gridlines();
      view.animate();
    },

};

var gui = new dat.GUI();
gui.add(model,"stepsize",1/60,180);
gui.add(view,"cameraonsat");
/*
gui.add(text, 'speed', -5, 5);
gui.add(text, 'displayOutline');
gui.add(text, 'explode');
*/
model.initialize();
view.initialize();
