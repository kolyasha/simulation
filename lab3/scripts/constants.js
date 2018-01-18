/**
 * CONSTANTS
 */
// gravity
var gravity = 9.82;
// mass
var mass = 0.2;
// inertia
var Ixx = 4.856e-3;
var Iyy = Ixx;
var Izz = 8.801e-3;
// lift constant
var k = 7.98e-6
// drag contant
var b = 1.14e-7
// arm length on quad
var l = 0.225;
// Air resistance
var A = 0.25;
var Ar = dotMultiply(math.eye(3), A);
