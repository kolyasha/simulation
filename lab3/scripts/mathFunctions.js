
function validateDimensions(a, b){
    var ax = a._data.length;
    var ay = a._data[0].length;

    var bx = b._data.length;
    var by = b._data[0].length;

    if(ax != bx || ay != by) return true; // Dimensions do not agree
    return false;
}

/**
 * CROSS
 * Compute the cross product
 */
function cross(a, b){
    if(validateDimensions(a,b)) return; // Dimensions do not agree

    return math.matrix([[a._data[1]*b._data[2]-a._data[2]*b._data[1]],
                        [a._data[2]*b._data[0]-a._data[0]*b._data[2]],
                        [a._data[0]*b._data[1]-a._data[2]*b._data[0]]]);
}

/**
 * TRANSP
 */
function transp(a){
    var ax = a._data[0].length;
    var ay = a._data.length;

    var b = [];
    for(var x = 0; x < ax; x++){
        var temp = [];
        for(var y = 0; y < ay; y++){
            temp.push(a._data[y][x])
        }
        b.push(temp);
    }
    return math.matrix(b);
}

/**
 * Addition of matrices
 */
function matrixAdd(a, b){
    if(validateDimensions(a,b)) return; // Dimensions do not agree

    var ax = a._data[0].length;
    var ay = a._data.length;

    var c = [];
    for(var y = 0; y < ay; y++){
        var temp = [];
        for(var x = 0; x < ax; x++){
            temp.push(a._data[y][x] + b._data[y][x]);
        }
        c.push(temp);
    }
    return math.matrix(c);
}

/**
 * Subtraction of matrices
 */
function matrixSub(a, b){
    if(validateDimensions(a,b)) return; // Dimensions do not agree

    var ax = a._data[0].length;
    var ay = a._data.length;

    var c = [];
    for(var y = 0; y < ay; y++){
        var temp = [];
        for(var x = 0; x < ax; x++){
            temp.push(a._data[y][x] - b._data[y][x]);
        }
        c.push(temp);
    }
    return math.matrix(c);
}

/**
 * Multiply a constant with a matrix
 * c is a constant
 * a is a matrix
 */
function dotMultiply(a, c){
    var temp = [];
    for (var i = a._data.length - 1; i >= 0; i--) {
        var t = []
        for (var j = a._data[0].length - 1; j >= 0; j--) {
            t.push([c*a._data[i][j]]);
        };
        temp.push(t);
    };
    return math.matrix(temp);
}

/**
 * Modulus for matrices
 */
function modMat(a, mod){
    var temp = [];
    for (var i = 0; i < a._data.length; i++) {
        var t = [];
        for (var j = 0; j < a._data[0].length; j++) {
            t.push([a._data[i][j] % mod]);
        };
        temp.push(t);
    };
    return math.matrix(temp);
}
