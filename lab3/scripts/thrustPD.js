Copter.prototype.PD = function(gravity, mass, Ixx, Iyy, Izz, vDesired, vActual, posDesired, posActual, anglesDesired, anglesActual, angVelDesired, angVelActual){
	// Function PD
	// constant needs to be fixed
	var kzpD = 800;
	var kxD = 100;
	var kyD = 100;
	var kzD = 100;
	var kzpP = 200;
	var kxP = 200;
	var kyP = 200;
	var kzP = 200;

	// calculating the angles in degrees
	var cx = Math.cos(this.anglesInertial._data[0][0]/180*Math.PI);
	var cy = Math.cos(this.anglesInertial._data[1][0]/180*Math.PI);
	var thrust = (gravity + kzpD * (vDesired._data[2]-vActual._data[2]) + kzpP*(posDesired._data[2]-posActual._data[2]))*mass/(cx*cy);
	var torqX = (kxD*(angVelDesired._data[0]-angVelActual._data[0])+kxP*(anglesDesired._data[0]-anglesActual._data[0]))*Ixx;
	var torqY = (kyD*(angVelDesired._data[1]-angVelActual._data[1])+kyP*(anglesDesired._data[1]-anglesActual._data[1]))*Iyy;
	var torqZ = (kzD*(angVelDesired._data[2]-angVelActual._data[2])+kzP*(anglesDesired._data[2]-anglesActual._data[2]))*Izz;

	return {
    	torqX: torqX,
    	torqY: torqY,
    	torqZ: torqZ,
    	thrust: thrust
  	};
}

Copter.prototype.thrustPD = function(torqX, torqY,torqZ, T, k ,l, b, rav) {
	// Calculating rotor angular velocity from regulator
	// T = thrust (from function PD)
    rav._data[0][0] = Math.sqrt(Math.max(T/(4*k) - torqY/(2*k*l) - torqZ/(4*b),0));
    rav._data[1][0] = Math.sqrt(Math.max(T/(4*k) - torqX/(2*k*l) + torqZ/(4*b),0));
    rav._data[2][0] = Math.sqrt(Math.max(T/(4*k) + torqY/(2*k*l) - torqZ/(4*b),0));
    rav._data[3][0] = Math.sqrt(Math.max(T/(4*k) + torqX/(2*k*l) + torqZ/(4*b),0));
    return {
    	rav: rav
    };
}
