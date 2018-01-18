var Copter = function() {
    this.copterGeometry = new THREE.BoxGeometry( 1, 0.3, 1 );

    this.red = new THREE.MeshBasicMaterial( { color: 0xff0000 } );
    this.blue = new THREE.MeshBasicMaterial( { color: 0x000fff } );

    this.copterBody = new THREE.Mesh( this.copterGeometry, this.red );

    this.rotorGeometry = new THREE.BoxGeometry(0.3, 0.05, 0.05);

    this.rotors = [];
    for(var i = 0; i < 4; i++)
        this.rotors[i] = new THREE.Mesh( this.rotorGeometry, this.blue ).translateZ(0.175);

    this.rotors[0].translateY(-0.5);
    this.rotors[1].translateX(0.5);
    this.rotors[2].translateY(0.5);
    this.rotors[3].translateX(-0.5);

    var m = new THREE.Matrix4();
    m.makeRotationX(3.14/2);
    this.copterBody.applyMatrix(m);

    this.object = new THREE.Object3D();
    this.object.add( this.copterBody );

    for(var i = 0; i < 4; i++)
        this.object.add( this.rotors[i] );

    // Controls
    this.controls = new FlightControl(this);

    // COPTER VARIABLES
    // variables for intertial frame
    // element 0 is x-axis -> right/left on screen
    // element 1 is y-axis -> up/down on screen
    // element 2 is z-axis -> in/out on screen
    this.positionInertial = math.matrix([[0], [0], [2]]);

    this.anglesInertial = math.matrix([[0], [0], [0]]);

    this.angularVelocityInertial = math.matrix([[0], [0], [0]]);
    this.accelerationInertial = math.matrix([[0], [0], [0]]);
    this.velocityInertial = math.matrix([[0], [0], [0]]);

    // Variables for body frame
    this.angularVelocity = math.matrix([[0], [0], [0]]);
    this.acceleration = math.matrix([[0], [0], [0]]);
    this.velocity = math.matrix([[0], [0], [0]]);

    this.rotorAngularVelocity = math.matrix([[554.65], [554.65], [554.65], [554.65]]);

    // TODO: change the "2", it should be adjustable by the user in flightControl.
    // Used as: Desired position, get from keys pressed
    this.posMat = math.matrix([[0],[0],[2]]);
    // TODO: change "30", it should be adjustable by user
    // Used as: desired angle, get from keys pressed
    this.angMat = math.matrix([[0],[0],[0]]);
}

Copter.prototype.update = function(delta){
    this.controls.update(delta);
    this.rotorAngularVelocity = math.matrix([[Math.sqrt(this.controls.rotors.r1)*this.controls.hover],
                                            [Math.sqrt(this.controls.rotors.r2)*this.controls.hover],
                                            [Math.sqrt(this.controls.rotors.r3)*this.controls.hover],
                                            [Math.sqrt(this.controls.rotors.r4)*this.controls.hover]]);

    var pos = this.newPos(delta);

    this.object.position.x = pos[0];
    this.object.position.y = pos[1];
    this.object.position.z = pos[2];

    this.object.rotateOnAxis(new THREE.Vector3( 1, 0, 0 ), pos[3]);
    this.object.rotateOnAxis(new THREE.Vector3( 0, 1, 0 ), pos[4]);
    this.object.rotateOnAxis(new THREE.Vector3( 0, 0, 1 ), pos[5]);

    return pos;
}
