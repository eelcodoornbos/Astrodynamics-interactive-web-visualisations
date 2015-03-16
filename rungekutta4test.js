function rungekutta4(ode_function, t0, y0, tf, h) {
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
}

function ode_orbit(t,y) {
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
}

function buildAxes( length ) {
        var axes = new THREE.Object3D();

        axes.add( buildAxis( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( length, 0, 0 ), 0xFF0000, false ) ); // +X
        axes.add( buildAxis( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( -length, 0, 0 ), 0xFF0000, true) ); // -X
        axes.add( buildAxis( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, length, 0 ), 0x00FF00, false ) ); // +Y
        axes.add( buildAxis( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, -length, 0 ), 0x00FF00, true ) ); // -Y
        axes.add( buildAxis( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, length ), 0x0000FF, false ) ); // +Z
        axes.add( buildAxis( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, -length ), 0x0000FF, true ) ); // -Z

        return axes;
}

function buildAxis( src, dst, colorHex, dashed ) {
        var geom = new THREE.Geometry(),
            mat; 

        if(dashed) {
                mat = new THREE.LineDashedMaterial({ linewidth: 0.25, color: colorHex, dashSize: 0.5, gapSize: 0.5 });
        } else {
                mat = new THREE.LineBasicMaterial({ linewidth: 0.25, color: colorHex });
        }

        geom.vertices.push( src.clone() );
        geom.vertices.push( dst.clone() );
        geom.computeLineDistances(); // This one is SUPER important, otherwise dashed lines will appear as simple plain lines

        var axis = new THREE.Line( geom, mat, THREE.LinePieces );

        return axis;
}

function animate() {
        requestAnimationFrame( animate );
        if (iframe > numsteps - 1) { iframe = 0; }
        iframe++;
        satellite.position.set(orbit[iframe].e(1)/1e3,orbit[iframe].e(2)/1e3,orbit[iframe].e(3)/1e3);
        earth.rotation.set(0,iframe * stepsize/86400*2*Math.PI,0);
        controls.update();
        renderer.render( scene, camera );
}

function initialize_model() {
    stepsize = 60;
    duration = 24*60*60;
    numsteps = duration / stepsize;
    
    var y0 = Vector.create([7878, 0, 0, 0, 6.5, 2]);
    orbit = rungekutta4(ode_orbit, 0, y0, duration, stepsize);
}

function initialize_view() {
    // Set up rendering
    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setClearColor( 0xffffff, 1);
    renderer.setSize(800, 800);
    document.body.appendChild(renderer.domElement);
    
    // Camera
    camera = new THREE.PerspectiveCamera(45, 300/300, 1, 500);
    camera.position.set(0, 0, 50);
    camera.lookAt(new THREE.Vector3(0, 0, 0));
    scene = new THREE.Scene();
    
    // Axes
    axes = buildAxes( 20 );
    scene.add(axes);
    
    // Orbit
    var geometry = new THREE.Geometry();
    for (var i = 0; i < orbit.length; i++) {
        geometry.vertices.push(new THREE.Vector3(orbit[i].e(1)/1e3,orbit[i].e(2)/1e3,orbit[i].e(3)/1e3));
    }
    var material = new THREE.LineBasicMaterial( { color: 0x000000,linewidth: 3 } );
    var line = new THREE.Line(geometry, material);
    scene.add(line);
    
    // Satellite
    var geometry = new THREE.SphereGeometry( 0.3, 16, 16 );
    var material = new THREE.MeshBasicMaterial( { color: 0xff0000 } );
    satellite = new THREE.Mesh (geometry, material);
    satellite.position.set(orbit[0].e(1)/1e3,orbit[0].e(2)/1e3,orbit[0].e(3)/1e3);
    scene.add(satellite);
    
    // Earth    
    var map = THREE.ImageUtils.loadTexture("map.png");
    var material = new THREE.MeshLambertMaterial({ map: map });
    var geometry = new THREE.SphereGeometry( 6.378, 64, 64 );
    earth = new THREE.Mesh( geometry, material );
    scene.add( earth );
    
    // Light    
    var light = new THREE.AmbientLight( 0xA0A0A0 ); // soft white light
    scene.add( light );
   
    
    var light = new THREE.PointLight( 0xA0A0A0, 1.2, 100 );
    light.position.set( 25, 5, 25 );
    scene.add( light );
    
    // Controls    
    controls = new THREE.OrbitControls( camera );
    controls.rotateSpeed = 1.0;
    controls.zoomSpeed = 0.2;
    controls.panSpeed = 0.8;
    
    controls.noZoom = false;
    controls.noPan = false;
    
    controls.staticMoving = true;
    controls.dynamicDampingFactor = 0.3;
    iframe = 0;
}
/*
var gui = new dat.GUI();
gui.add(text, 'message');
gui.add(text, 'speed', -5, 5);
gui.add(text, 'displayOutline');
gui.add(text, 'explode');
*/
initialize_model();
initialize_view();
animate();