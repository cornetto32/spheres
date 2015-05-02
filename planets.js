var canvas;
var gl;

var numTimesToSubdivide = 3;
 
var index = 0;

var pointsArray = [];
var normalsArray = [];

var near = 0.01; // camera information
var far = 100.0;
var theta  = 0;
var moonTheta = 0;
 
var eye = vec3(-50*Math.cos(radians(30)),-50*Math.sin(radians(30)),50*Math.sin(radians(30)));
var at = vec3(5.0, 5.0, 0.0);
var up = vec3(0.0, 0.0, 1.0);

var  fovy = 45.0;  // Field-of-view in Y direction angle (in degrees)
var  aspect = 1.0;       // Viewport aspect ratio
var  fovh = fovy*aspect; // horizontal field of view for 'n' and 'w'

var va = vec4(0.0, 0.0, -1.0,1);
var vb = vec4(0.0, 0.942809, 0.333333, 1);
var vc = vec4(-0.816497, -0.471405, 0.333333, 1);
var vd = vec4(0.816497, -0.471405, 0.333333,1);
var center = vec4(0.0,0.0,0.0,0.0);

var sunColor = vec4( 1, 1 , 0.0, 1.0 );

var lightPosition = vec4(0.0, 0.0, 0.0, 1.0);
var lightAmbient = vec4(1.0, 1.0, 1, 1.0);
var lightDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );

var materialAmbient = vec4( 0.05, 0.05, 0.05, 1.0 );
var materialDiffuse = vec4( 1.0, 0.8, 0.0, 1.0 );
var materialSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );
var materialShininess = 10000;
var ambientLoc, diffuseLoc, specularLoc;

var shade = 1.0;
var shadingLoc;
var shineLoc;
var ctm;
var ambientColor, diffuseColor, specularColor;

var modelViewMatrix, projectionMatrix;
var modelViewMatrixLoc, projectionMatrixLoc;
var transformMatrix, transformMatrixLoc;
var normalMatrix, normalMatrixLoc;
var flatShading = 2.0;

var iFrequency = 16;
var myInterval = 0;

// animate the orbits
function animate() {
    if(myInterval > 0) clearInterval(myInterval);
    myInterval = setInterval( "doSomething()", iFrequency );
}

function doSomething()
{
    theta+=0.5;
	moonTheta+=0.5;
}  

function triangle(a, b, c){
	
    pointsArray.push(a);
    pointsArray.push(b);      
    pointsArray.push(c);
    
     // normals are vectors

	if (flatShading == 1){
		var t1 = subtract(b, a);
		var t2 = subtract(c, a);
		var normal = normalize(cross(t2, t1));
		normal = vec4(normal);

		normalsArray.push(normal);
		normalsArray.push(normal);
		normalsArray.push(normal);
	}
	else{
		normalsArray.push(a[0],a[1], a[2], 0.0);
		normalsArray.push(b[0],b[1], b[2], 0.0);
		normalsArray.push(c[0],c[1], c[2], 0.0);
	}

     index += 3;
     
}


function divideTriangle(a, b, c, count) {
    if ( count > 0 ) {
                
        var ab = mix( a, b, 0.5);
        var ac = mix( a, c, 0.5);
        var bc = mix( b, c, 0.5);
                
        ab = normalize(ab, true);
        ac = normalize(ac, true);
        bc = normalize(bc, true);
                                
        divideTriangle( a, ab, ac, count - 1);
        divideTriangle( ab, b, bc, count - 1);
        divideTriangle( bc, c, ac, count - 1);
        divideTriangle( ab, bc, ac, count - 1);
    }
    else { 
        triangle( a, b, c);
    }
}


function tetrahedron(a, b, c, d, n) {
    divideTriangle(a, b, c, n);
    divideTriangle(d, c, b, n);
    divideTriangle(a, d, b, n);
    divideTriangle(a, c, d, n);
}

function Sphere() {
	tetrahedron(va, vb, vc , vd, numTimesToSubdivide);
}
	
window.onload = function init() {
    
    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
	aspect =  canvas.width/canvas.height;
	fovh = fovy*aspect;
	
    gl.clearColor( 0.0, 0.0, 0.0, 1.0 );
    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
	    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    

    ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);

	Sphere();
    
 
	var nBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW );
    
    var vNormal = gl.getAttribLocation( program, "vNormal" );
    gl.vertexAttribPointer( vNormal, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vNormal);

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);
    
    var vPosition = gl.getAttribLocation( program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    
    modelViewMatrixLoc = gl.getUniformLocation( program, "modelViewMatrix" );
    projectionMatrixLoc = gl.getUniformLocation( program, "projectionMatrix" );
	transformMatrixLoc = gl.getUniformLocation( program, "transformMatrix");
	normalMatrixLoc = gl.getUniformLocation( program, "normalMatrix" );
	shadingLoc = gl.getUniformLocation( program, "shading");
	diffuseLoc = gl.getUniformLocation( program, "diffuseProduct");
	specularLoc = gl.getUniformLocation( program, "specularProduct");
	ambientLoc = gl.getUniformLocation( program, "ambientProduct");
	shineLoc = gl.getUniformLocation( program, "shininess");
	modelViewMatrix = lookAt(eye, at , up);

    gl.uniform4fv( gl.getUniformLocation(program, 
       "ambientProduct"),flatten(ambientProduct) );
    gl.uniform4fv( gl.getUniformLocation(program, 
       "diffuseProduct"),flatten(diffuseProduct) );
    gl.uniform4fv( gl.getUniformLocation(program, 
       "specularProduct"),flatten(specularProduct) );	
    gl.uniform4fv( gl.getUniformLocation(program, 
       "lightPosition"),flatten(lightPosition) );
    gl.uniform1f( gl.getUniformLocation(program, 
       "shininess"),materialShininess );
	gl.uniform1f( gl.getUniformLocation(program, 
      "shading"),shade );
	  
	 getInput();
	 animate();
    render();
}


function render() {
    
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    	fovy = fovh/aspect; //calculate vertical fov


    projectionMatrix = perspective(fovy, aspect, near, far);
    normalMatrix = [
        vec3(modelViewMatrix[0][0], modelViewMatrix[0][1], modelViewMatrix[0][2]),
        vec3(modelViewMatrix[1][0], modelViewMatrix[1][1], modelViewMatrix[1][2]),
        vec3(modelViewMatrix[2][0], modelViewMatrix[2][1], modelViewMatrix[2][2])
    ];

            
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix) );
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix) );
	gl.uniformMatrix3fv(normalMatrixLoc, false, flatten(normalMatrix) );
	//draw Sun
	materialDiffuse = sunColor;
	materialShininess = 100000;
	transformMatrix = mult(translate(5.0,5.0,0.0), scale(4.0,4.0,4.0));
	shade = 0.0;
	updateSphere();
    for( var i=0; i<index; i+=3) 
        gl.drawArrays( gl.TRIANGLES, i, 3 );

	
	//draw planet 1
	transformMatrix = mult( translate(5+6.0*Math.cos(radians(5*theta)),
								5+6.0*Math.sin(radians(5*theta)),
								0.0), scale(0.1,0.1,0.1));
	materialDiffuse = vec4(1.0,1.0,1.0, 1.0);
	materialShininess = 100000;
	shade = flatShading;
	updateSphere();
    for( var i=0; i<index; i+=3) 
        gl.drawArrays( gl.TRIANGLES, i, 3 );
	
	//draw planet 2
	transformMatrix = mult( translate(5+12.0*Math.cos(radians(2*theta)),
								5+12.0*Math.sin(radians(2*theta)),
								0.0), scale(0.8,0.8,0.8));
	materialDiffuse = vec4(0.0,1.0,0.2, 1.0);
	materialShininess = 20.0;
	updateSphere();

    for( var i=0; i<index; i+=3) 
        gl.drawArrays( gl.TRIANGLES, i, 3 );
  
  	//draw moon of planet 2
	transformMatrix = mult( translate(5+12.0*Math.cos(radians(2*theta)) - 1.5*Math.cos(radians(10*moonTheta)),
								5+12.0*Math.sin(radians(2*theta))-1.5*Math.sin(radians(10*moonTheta)),
								0.0), scale(0.2,0.2,0.2));
	materialDiffuse = vec4(1.0,1.0,1.0, 1.0);
	materialShininess = 50;
	updateSphere();

    for( var i=0; i<index; i+=3) 
        gl.drawArrays( gl.TRIANGLES, i, 3 );
	
	//draw planet 3
	transformMatrix = mult( translate(5+20.0*Math.cos(radians(1.4*theta)),
								5+20.0*Math.sin(radians(1.4*theta)),
								0.0), scale(0.5,0.5,0.5));
	materialDiffuse = vec4(0.5,0.8,1.0, 1.0);
	materialShininess = 50;
	updateSphere();

    for( var i=0; i<index; i+=3) 
        gl.drawArrays( gl.TRIANGLES, i, 3 );
	
	//draw planet 4
	transformMatrix = mult( translate(5+30.0*Math.cos(radians(0.25*theta)),
								5+30.0*Math.sin(radians(0.25*theta)),
								0.0), scale(0.8,0.8,0.8));
	materialDiffuse = vec4(0.54,0.27,0.07, 1.0);
	materialShininess = 100000000;
	updateSphere();

    for( var i=0; i<index; i+=3) 
        gl.drawArrays( gl.TRIANGLES, i, 3 );
	materialShininess = 10;
	updateSphere();
	window.requestAnimFrame(render);
}


function updateSphere() //sendc colors and shading information to shaders
{    
	gl.uniformMatrix4fv(transformMatrixLoc, false, flatten(transformMatrix) );
 	ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);
	
    gl.uniform4fv( ambientLoc,flatten(ambientProduct) );
    gl.uniform4fv( diffuseLoc,flatten(diffuseProduct) );
    gl.uniform4fv( specularLoc,flatten(specularProduct) );	
	gl.uniform1f( shadingLoc ,shade );
	gl.uniform1f( shineLoc , materialShininess );
}

function getInput()
{
	//get input for keyboard functions
	document.addEventListener('keydown', function(event) {
		if (event.keyCode == 67) {
		//    c key, cycle through colors
			changeColors();
		}
		else if (event.keyCode == 38) {
		 //   up key, move the camera up the y-axis
			modelViewMatrix = mult(translate(0.0,-0.25,0.0), modelViewMatrix);
		}
		else if (event.keyCode == 40) {
		 //   down key, move the camera down the y-axis
			modelViewMatrix = mult(translate(0.0,0.25,0.0), modelViewMatrix);
		}
		else if (event.keyCode == 73) {
		 //   i key, move camera forward (objects towards camera actually)
			modelViewMatrix = mult(translate(0.0,0.0,0.25), modelViewMatrix);
		//moveAll(vec4(0.0,0.0,-0.25,0.0));
		}	
		else if (event.keyCode == 74) {
		 //   j key, move objects perpendicularly right to the direction the camera points
			modelViewMatrix = mult(translate(0.25,0.0,0.0), modelViewMatrix);
		}	
		else if (event.keyCode == 75) {
		 //   k key, move objects perpendicularly left to the direction the camera points
			modelViewMatrix = mult(translate(-0.25,0.0,0.0), modelViewMatrix);
		}
		else if (event.keyCode == 77) {
		 //   m key move camera backward (objects away from camera actually)
			modelViewMatrix = mult(translate(0.0,0.0,-0.25), modelViewMatrix);
		}
		else if(event.keyCode == 39) {
		 // right key
			modelViewMatrix = mult(rotate(1, 0.0,1.0,0.0), modelViewMatrix);
			}
		else if(event.keyCode == 37) {
		 // left key
			modelViewMatrix = mult(rotate(1, 0.0,-1.0,0.0), modelViewMatrix);
			}
		else if(event.keyCode == 82) { // 'r', reset view
			fovy = 45.0;  // Field-of-view in Y direction angle (in degrees)
			aspect =  canvas.width/canvas.height;
			fovh = fovy*aspect;
			modelViewMatrix = lookAt(eye, at, up);
		}
		else if(event.keyCode == 78) {
			fovh--; //decrease the horizontal fov
		}
		else if(event.keyCode == 87) {
			fovh++; //increase the horizontal fov
		}
	}, true);
}
