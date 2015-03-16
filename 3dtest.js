    <script src='https://cdnjs.cloudflare.com/ajax/libs/three.js/r70/three.min.js'></script>

	var onRenderFcts= [];
	var renderer	= new THREE.WebGLRenderer();
	renderer.setSize( 400, 400 );
	renderer.setClearColor( 0xffffff, 1 );
	document.body.appendChild( renderer.domElement );
   
    var scene	= new THREE.Scene();
    var camera	= new THREE.PerspectiveCamera(45, 1, 0.01, 1000 );
    camera.position.set(0,0,2.5);
    
    var light	= new THREE.AmbientLight( 0x888888 )
    scene.add( light )

    var light	= new THREE.DirectionalLight( 0xaaaaaa, 1)
    light.position.set(5,5,5)
    light.target.position.set( 0, 0, 0 )
    scene.add( light )
    
/*
    var light	= new THREE.DirectionalLight( 0xcccccc, 1 )
    light.position.set(5,3,5)
    scene.add( light )
*/
    
    var geometry   = new THREE.SphereGeometry(0.5, 32, 32);
    var material  = new THREE.MeshPhongMaterial( {color: 0x888888} );
    var earthMesh = new THREE.Mesh(geometry, material);
    scene.add(earthMesh);
    
    	onRenderFcts.push(function(){
    		renderer.render( scene, camera );		
    	});
    
    	var lastTimeMsec= null;
    	requestAnimationFrame(function animate(nowMsec){
    		// keep looping
    		requestAnimationFrame( animate );
    		// measure time
    		lastTimeMsec	= lastTimeMsec || nowMsec-1000/60;
    		var deltaMsec	= Math.min(200, nowMsec - lastTimeMsec);
    		lastTimeMsec	= nowMsec;
    		// call each update function
    		onRenderFcts.forEach(function(onRenderFct){
    			onRenderFct(deltaMsec/1000, nowMsec/1000)
    		});
    	});



