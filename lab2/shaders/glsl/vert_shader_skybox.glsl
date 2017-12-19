#version 120

uniform mat4 u_world_view;

attribute vec2 a_position;

varying vec3 v_position;
varying vec3 v_from_eye;

vec4 from_clipspace(vec2 position) {
    return vec4(position,-1.0,1.0);
}

void main (void) {
    gl_Position=vec4(a_position,0.0,1.0);
    v_position=(from_clipspace(a_position)*u_world_view).xyz;
}
