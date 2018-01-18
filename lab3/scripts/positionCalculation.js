/**
 * FUNCTIONS
 */

Copter.prototype.newPos = function(delta){
    accelerations = this.calculateLinAcc();
    this.accelerationInertial = accelerations.inertial;
    this.acceleration = accelerations.body;

    angularAccelerations = this.calculateAngularAcc();
    angularAccelerationInertial = angularAccelerations.inertial;
    angularAcceleration = angularAccelerations.body;

    // euler steps for velocity and position
    temp = math.matrix([[this.accelerationInertial._data[0][0]*delta],
                        [this.accelerationInertial._data[1][0]*delta],
                        [this.accelerationInertial._data[2][0]*delta]]);

    this.velocityInertial = matrixAdd(this.velocityInertial, temp);

    temp = math.matrix([[this.velocityInertial._data[0][0]*delta],
                        [this.velocityInertial._data[1][0]*delta],
                        [this.velocityInertial._data[2][0]*delta]]);

    this.positionInertial = matrixAdd(this.positionInertial, temp);

    // euler steps for angularvelocity and angles
    temp = math.matrix([[angularAccelerationInertial._data[0][0]*delta],
                        [angularAccelerationInertial._data[1][0]*delta],
                        [angularAccelerationInertial._data[2][0]*delta]]);

    this.angularVelocityInertial = matrixAdd(this.angularVelocityInertial, temp);

    temp = math.matrix([[this.angularVelocityInertial._data[0][0]*delta],
                        [this.angularVelocityInertial._data[1][0]*delta],
                        [this.angularVelocityInertial._data[2][0]*delta]]);

    this.anglesInertial = matrixAdd(this.anglesInertial, temp);

    temp = math.matrix([[angularAcceleration._data[0][0]*delta],
                        [angularAcceleration._data[1][0]*delta],
                        [angularAcceleration._data[2][0]*delta]]);

    this.angularVelocity = matrixAdd(this.angularVelocity, temp);

    temp = [];
    temp[0] = this.positionInertial._data[0][0];
    temp[1] = this.positionInertial._data[1][0];
    temp[2] = this.positionInertial._data[2][0];
    temp[3] = this.angularVelocityInertial._data[0][0]*delta;
    temp[4] = this.angularVelocityInertial._data[1][0]*delta;
    temp[5] = this.angularVelocityInertial._data[2][0]*delta;

    var rotorTorque = this.calculateRotorTorque(this.rotorAngularVelocity);
    var bodyTorque = this.calculateBodyTorque(this.rotorAngularVelocity, rotorTorque);
    var force = this.calculateForce(this.rotorAngularVelocity);
    var thrust = this.calculateThrust(force);

    temp[6] = thrust._data[2][0];
    temp[7] = bodyTorque._data[0][0];
    temp[8] = bodyTorque._data[1][0];
    temp[9] = bodyTorque._data[2][0];

    temp[10] = this.velocityInertial._data[0][0];
    temp[11] = this.velocityInertial._data[1][0];
    temp[12] = this.velocityInertial._data[2][0];

    return temp;
}

// Calculate the linear acceleration in both inertial and body.
Copter.prototype.calculateLinAcc = function()
{
    R = this.rotationMatrix(this.anglesInertial);

    var G = math.matrix([[0], [0], [-gravity]]);

    // Make PD to stabilize system
    // Get output rotorAngularVelocity
    // Use zeroMat for desiredVelocity and desired angularVelocity
    var zeroMat = math.matrix([[0],[0],[0]]);
    var PDvar = this.PD(gravity, mass, Ixx, Iyy, Izz, zeroMat, this.velocity, this.posMat, this.positionInertial, this.angMat, this.anglesInertial, zeroMat, this.angularVelocity);
    var rotorAngularTemp = this.thrustPD(PDvar.torqX, PDvar.torqY, PDvar.torqZ, PDvar.thrust, k, l, b, this.rotorAngularVelocity);

    // var force = calculateForce(rotorAngularVelocity);
    this.rotorAngularVelocity = rotorAngularTemp.rav;
    var force = this.calculateForce(this.rotorAngularVelocity);
    var thrust = this.calculateThrust(force);
    var rg = math.multiply(transp(R),G);
    var rgt = matrixAdd(rg, thrust);
    var aVmv = cross(this.angularVelocity, dotMultiply(this.velocity, mass));

    //body
    var acc = dotMultiply((matrixSub(rgt, aVmv)), 1/mass);

    //Inertial
    var rt = math.matrix([  [R._data[0][0]*thrust._data[0] + R._data[0][1]*thrust._data[1] + R._data[0][2]*thrust._data[2]],
                            [R._data[1][0]*thrust._data[0] + R._data[1][1]*thrust._data[1] + R._data[1][2]*thrust._data[2]],
                            [R._data[2][0]*thrust._data[0] + R._data[2][1]*thrust._data[1] + R._data[2][2]*thrust._data[2]]]); // R * rf.t

    var arvi = math.matrix([[this.velocityInertial._data[0] * Ar._data[0][0]],
                            [this.velocityInertial._data[1] * Ar._data[1][1]],
                            [this.velocityInertial._data[2] * Ar._data[2][2]]]); // Ar * vI

    var grtArvI = matrixSub(matrixAdd(G, rt), arvi);

    var accI = math.matrix([[grtArvI._data[0]*(1/mass)],
                            [grtArvI._data[1]*(1/mass)],
                            [grtArvI._data[2]*(1/mass)]]);

    return {
        body: acc,
        inertial: accI
    };
}


Copter.prototype.calculateAngularAcc = function() {
    rotorTorque = this.calculateRotorTorque(this.rotorAngularVelocity);
    bodyTorque = this.calculateBodyTorque(this.rotorAngularVelocity, rotorTorque);
    var angAcc1 = math.matrix([ [((Iyy-Izz)*this.angularVelocity._data[1][0]*this.angularVelocity._data[2][0])/Ixx],
                                [((Izz-Ixx)*this.angularVelocity._data[0][0]*this.angularVelocity._data[2][0])/Iyy],
                                [((Ixx-Iyy)*this.angularVelocity._data[0][0]*this.angularVelocity._data[1][0])/Izz]]);

    var angAcc3 = math.matrix([ [bodyTorque._data[0][0]/Ixx],
                                [bodyTorque._data[1][0]/Iyy],
                                [bodyTorque._data[2][0]/Izz]]);

    var angAcc = matrixAdd(angAcc1,angAcc3);
    var dtiTM = this.ddtinvTransMatrix(this.anglesInertial);
    var iTM = this.invTransMatrix(this.anglesInertial);
    var angAccI1 = math.matrix([[dtiTM._data[0][0]*this.angularVelocity._data[0][0]+dtiTM._data[0][1]*this.angularVelocity._data[1][0]+dtiTM._data[0][2]*this.angularVelocity._data[2][0]],
                                [dtiTM._data[1][0]*this.angularVelocity._data[0][0]+dtiTM._data[1][1]*this.angularVelocity._data[1][0]+dtiTM._data[1][2]*this.angularVelocity._data[2][0]],
                                [dtiTM._data[2][0]*this.angularVelocity._data[0][0]+dtiTM._data[2][1]*this.angularVelocity._data[1][0]+dtiTM._data[2][2]*this.angularVelocity._data[2][0]]]);

    var angAccI2 = math.matrix([[iTM._data[0][0]*angAcc._data[0][0]+iTM._data[0][1]*angAcc._data[1][0]+iTM._data[0][2]*angAcc._data[2][0]],
                                [iTM._data[1][0]*angAcc._data[0][0]+iTM._data[1][1]*angAcc._data[1][0]+iTM._data[1][2]*angAcc._data[2][0]],
                                [iTM._data[2][0]*angAcc._data[0][0]+iTM._data[2][1]*angAcc._data[1][0]+iTM._data[2][2]*angAcc._data[2][0]]]);

    var angAccI = matrixAdd(angAccI1, angAccI2);

    return {
        body: angAcc,
        inertial: angAccI
    };
}


Copter.prototype.calculateForce = function(rav) {
    var f = [];

    //could write "rav._data.length" instead of 4..
    for(var i = 0; i < 4; i++) {
        var temp = k*Math.pow(rav._data[i][0], 2);
        f.push([temp]);
    }
    return math.matrix(f);
}


Copter.prototype.calculateThrust = function(f) {
    sum = 0;
    for(var i = 0; i < f._data.length; i++) {
        var temp = f._data[i][0];
        sum += temp;
    }
    return math.matrix([[0], [0], [sum]]);
}

Copter.prototype.calculateRotorTorque = function(rav) {
    var tm = []; //should also have +Im*wdot but us omitted. Im = 3.357e-5
    for(var i = 0; i < rav._data.length; i++){
        var temp = b*Math.pow(rav._data[i][0], 2);
        tm.push([temp])
    }
    return math.matrix(tm);
}

Copter.prototype.calculateBodyTorque = function(rav, rotorTorque) {
    return math.matrix([  [ l*k*(-Math.pow(rav._data[1][0], 2) + Math.pow(rav._data[3][0],2)) ],
                            [ l*k*(-Math.pow(rav._data[0][0], 2) + Math.pow(rav._data[2][0],2)) ],
                            [-rotorTorque._data[0][0]+rotorTorque._data[1][0]-rotorTorque._data[2]+rotorTorque._data[3][0]]
                        ]);
}


// Creates the rotational matrix
// Returns a matrix
Copter.prototype.rotationMatrix = function(rot) {
    var cx = Math.cos(rot._data[0]);
    var cy = Math.cos(rot._data[1]);
    var cz = Math.cos(rot._data[2]);
    var sx = Math.sin(rot._data[0]);
    var sy = Math.sin(rot._data[1]);
    var sz = Math.sin(rot._data[2]);

    return math.matrix([[cz*cy, cz*sy*sx-sz*cx, cz*sy*cx+sz*sx],
                        [sz*cy, sz*sy*sx+cz*cx, sz*sy*cx-cz*sx],
                        [-sy,   cy*sx,          cy*cx]]);
}

Copter.prototype.ddtinvTransMatrix = function(angI){
    // etadot = inv(W_eta)*nu
    var sx = Math.sin(angI._data[0][0]);
    var cx = Math.cos(angI._data[0][0]);
    var cy = Math.cos(angI._data[1][0]);
    var ty = Math.tan(angI._data[1][0]);

    return math.matrix([[0, angI._data[0][0]*cx*ty+angI._data[1][0]*sx/Math.pow(cy,2), -angI._data[0][0]*sx*ty+angI._data[1][0]*cy/Math.pow(cy,2)],
                        [0, -angI._data[0][0]*sx, -angI._data[0][0]*cx],
                        [0, angI._data[0][0]*sx/cy+angI._data[1][0]*sx*ty/cy, -angI._data[0][0]*sx/cy+angI._data[1][0]*cx*ty/cy]]);
}

Copter.prototype.invTransMatrix = function(angI){
    var sx = Math.sin(angI._data[0][0]);
    var cx = Math.cos(angI._data[0][0]);
    var cy = Math.cos(angI._data[1][0]);
    var ty = Math.tan(angI._data[1][0]);

    return math.matrix([[1, sx*ty, cx*ty],
                        [0, cx, -sx],
                        [0, sx/cy, cx/cy]]);
}
