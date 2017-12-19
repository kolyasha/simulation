#version 120

precision mediump float;
varying vec3 v_position;
uniform samplerCube u_skybox;

void main() {
    gl_FragColor = textureCube(u_skybox, v_position);
}
