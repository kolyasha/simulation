#version 120

uniform sampler2D u_bed_texture;
uniform highp vec3 u_sun_direction;
uniform highp vec3 u_sun_diffused_color;
uniform highp vec3 u_sun_reflected_color;
uniform highp vec3 u_water_ambient_color;
uniform highp float u_alpha;
uniform highp float u_bed_depth;

uniform highp float u_reflected_mult;
uniform highp float u_diffused_mult;
uniform highp float u_bed_mult;
uniform highp float u_depth_mult;
uniform highp float u_sky_mult;

varying highp vec3 v_normal;
varying highp vec3 v_position;
varying highp vec3 v_from_eye;

uniform samplerCube u_skybox;

highp float reflection_refraction(in highp vec3 from_eye, in highp vec3 outer_normal,
in highp float alpha, in highp float c1, out highp vec3 reflected, out highp vec3 refracted) {
    reflected=normalize(from_eye-2.0*outer_normal*c1);
    highp float k=max(0.0, 1.0-alpha*alpha*(1.0-c1*c1));
    refracted=normalize(alpha*from_eye-(alpha*c1+sqrt(k))*outer_normal);
    highp float c2=dot(refracted,outer_normal);

    highp float reflectance_s=pow((alpha*c1-c2)/(alpha*c1+c2),2.0);
    highp float reflectance_p=pow((alpha*c2-c1)/(alpha*c2+c1),2.0);
    return (reflectance_s+reflectance_p)/2.0;
}

highp vec3 bed_intersection(highp vec3 position, highp vec3 direction) {
    highp float t=(-u_bed_depth-position.z)/direction.z;
    return position+t*direction;
}

highp vec2 get_bed_texcoord(highp vec3 point_on_bed) {
    return point_on_bed.xy+vec2(0.5,0.5);
}

highp vec3 sun_contribution(highp vec3 direction, highp vec3 normal) {
    highp float diffused_intensity=u_diffused_mult*max(-dot(normal, u_sun_direction), 0.0);
    highp float cosphi=max(dot(u_sun_direction,direction), 0.0);
    highp float reflected_intensity=u_reflected_mult*pow(cosphi,100.0);
    return diffused_intensity*u_sun_diffused_color+reflected_intensity*u_sun_reflected_color;
}

highp vec3 water_decay(highp vec3 color, highp float distance) {
    highp float mask=exp(-distance*u_depth_mult);
    return mix(u_water_ambient_color, color, mask);
}

void main() {
    // normalize directions
    highp vec3 normal=normalize(v_normal);
    highp float distance_to_eye=length(v_from_eye);
    highp vec3 from_eye=v_from_eye/distance_to_eye;
    // compute reflection and refraction
    highp float c=dot(v_normal,from_eye);
    highp vec3 reflected;
    highp vec3 refracted;
    highp vec2 bed_texcoord;
    highp float reflectance;
    highp float path_in_water;

    highp vec3 sky_color;

    if(c>0.0) { // looking from air to water
        reflectance=reflection_refraction(from_eye, -normal, u_alpha, -c, reflected, refracted);
        highp vec3 point_on_bed=bed_intersection(v_position, refracted);
        bed_texcoord=get_bed_texcoord(point_on_bed);
        path_in_water=length(point_on_bed-v_position);
        sky_color=textureCube(u_skybox, reflected).rgb;
    } else { // looking from water to air
        reflectance=reflection_refraction(from_eye, normal, 1.0/u_alpha, c, reflected, refracted);
        highp vec3 point_on_bed=bed_intersection(v_position, reflected);
        bed_texcoord=get_bed_texcoord(point_on_bed);
        path_in_water=length(point_on_bed-v_position);
        sky_color=textureCube(u_skybox, refracted).rgb;
    };
    highp vec3 bed_color=texture2D(u_bed_texture, bed_texcoord).rgb;

    // compute colors
    highp vec3 rgb;
    highp vec3 sky=u_sky_mult*sky_color;
    if(c>0.0) { // in the air
        sky+=sun_contribution(reflected, normal);
        highp vec3 bed=water_decay(bed_color*u_bed_mult, path_in_water);
        rgb=mix(bed, sky, reflectance);
    } else { // under water
        sky+=sun_contribution(refracted, normal);
        highp vec3 bed=water_decay(bed_color*u_bed_mult, path_in_water);
        rgb=water_decay(mix(sky, bed, reflectance),distance_to_eye);
    };
    gl_FragColor.rgb = clamp(rgb,0.0,1.0);
    gl_FragColor.a = 1.0;
}
