import numpy as np
from vispy import app
from vispy import gloo
from vispy import io

import shaders
from methods.runge_kutta import RungeKutta
from methods.euler import Euler
from methods.verlet import Verlet
from surface.Sun import Sun
from surface.Skybox import Skybox


class Canvas(app.Canvas):

    def __init__(self, surface, bed="img\seabed.png", size=(600, 600)):
        # app window dimensions
        self.width = size[0]
        self.height = size[1]

        # set method - delta is 1. Parametrize just v and sigma
        self.resolver = RungeKutta(method="vertical", is_shallow=False)

        # initial time to count heights of points
        self.time = 0

        app.Canvas.__init__(self, size=(self.width, self.height), title='Waves Surface Simulator')

        self.surface = surface
        self.h_description = None
        self.bed = io.read_png(bed)
        self.triangles = gloo.IndexBuffer(self.surface.triangulation())
        self.sun = Sun(np.asarray([0, 1, 0.1], dtype=np.float32))

        skybox = Skybox(front="../img/skybox/sky-front.png", back="../img/skybox/sky-back.png",
                        left="../img/skybox/sky-left.png", right="../img/skybox/sky-right.png",
                        up="../img/skybox/sky-up.png", down="../img/skybox/sky-down.png")

        position = self.surface.position()

        self.program = gloo.Program(shaders.vert_shader, shaders.frag_shader)
        self.programSkybox = gloo.Program(shaders.vert_shader_skybox, shaders.frag_shader_skybox)

        self.program['a_position'] = position
        self.programSkybox['a_position'] = position

        self.program['u_bed_texture'] = gloo.Texture2D(self.bed, wrapping='repeat', interpolation='linear')

        self.program['u_skybox'] = gloo.TextureCubeMap(data=skybox.texture, interpolation='linear', wrapping='clamp_to_edge', internalformat='rgb32f')
        self.programSkybox['u_skybox'] = gloo.TextureCubeMap(data=skybox.texture, interpolation='linear', wrapping='clamp_to_edge', internalformat='rgb32f')

        self.program['u_eye_height'] = 3
        self.program['u_alpha'] = 0.5
        self.program['u_bed_depth'] = 0.8

        self.program['u_sun_direction'] = self.sun.normalized_direction()
        self.program['u_sun_diffused_color'] = self.sun.diffused_color()
        self.program['u_sun_reflected_color'] = self.sun.reflected_color()

        # GUI set up
        self.camera = np.array([0, 0, 1], dtype=np.float32)
        self.up = np.array([0, 1, 0], dtype=np.float32)
        self.set_camera()

        self.drag_start = None
        self.diffused_flag = True
        self.reflected_flag = True
        self.bed_flag = True
        self.depth_flag = True
        self.sky_flag = True
        self.bed_type = "normal"
        self.stop_flag = False
        self.apply_flags()

        self.timer = app.Timer('auto', connect=self.on_timer, start=True)
        self.activate_zoom()
        self.show()

    def set_camera(self):
        rotation = np.zeros((4, 4), dtype=np.float32)
        rotation[3, 3] = 1
        rotation[0, :3] = np.cross(self.up, self.camera)
        rotation[1, :3] = self.up
        rotation[2, :3] = self.camera
        world_view = rotation
        self.program['u_world_view'] = world_view.T
        self.programSkybox['u_world_view'] = world_view.T

    def rotate_camera(self, shift):
        right = np.cross(self.up, self.camera)
        new_camera = self.camera - right * shift[0] + self.up * shift[1]
        new_up = self.up - self.camera * shift[0]
        self.camera = Canvas.normalize(new_camera)
        self.up = Canvas.normalize(new_up)
        self.up = np.cross(self.camera, np.cross(self.up, self.camera))

    def apply_flags(self):
        self.program["u_diffused_mult"] = 0.5 if self.diffused_flag else 0
        self.program["u_reflected_mult"] = 1 if self.reflected_flag else 0
        self.program["u_bed_mult"] = 1 if self.bed_flag else 0
        self.program["u_depth_mult"] = 1 if self.depth_flag else 0
        self.program["u_sky_mult"] = 1 if self.sky_flag else 0

        self.program["u_water_ambient_color"] = self.surface.ambient_color()

    def activate_zoom(self):
        self.width, self.height = self.size
        gloo.set_viewport(0, 0, *self.physical_size)

    def on_draw(self, event):
        gloo.set_state(clear_color=(0, 0, 0, 1), blend=False)
        gloo.clear()
        self.h_description = self.resolver.get_heights(self.h_description) if not self.stop_flag else self.h_description
        height = self.h_description[0]
        normal = self.resolver.get_normal(height)
        self.program['a_height'] = height
        self.program['a_normal'] = normal

        gloo.set_state(depth_test=True)
        self.program.draw('triangles', self.triangles)
        self.programSkybox.draw('triangles', self.triangles)

    def on_timer(self, event):
        if not self.stop_flag:
            self.time += 0.004
            self.update()

    def on_resize(self, event):
        self.activate_zoom()

    def on_key_press(self, event):
        if event.key == 'Escape':
            self.close()

        elif event.key == '1':
            self.diffused_flag = not self.diffused_flag
            print("Show sun diffused light:", self.diffused_flag)
            self.apply_flags()

        elif event.key == '2':
            self.bed_flag = not self.bed_flag
            print("Show refracted image of seabed:", self.bed_flag)

        elif event.key == '3':
            self.depth_flag = not self.depth_flag
            print("Show ambient light in water:", self.depth_flag)

        elif event.key == '4':
            self.sky_flag = not self.sky_flag
            print("Show reflected image of sky:", self.sky_flag)

        elif event.key == '5':
            self.reflected_flag = not self.reflected_flag
            print("Show reflected image of sun:", self.reflected_flag)

        elif event.key == 'p':
            self.stop_flag = not self.stop_flag
            print("Pause:", self.stop_flag)

        self.apply_flags()

    def on_mouse_press(self, event):
        self.drag_start = self.screen_to_gl_coordinates(event.pos)

    def on_mouse_release(self, event):
        self.drag_start = None

    def on_mouse_move(self, event):
        if not self.drag_start is None:
            pos = self.screen_to_gl_coordinates(event.pos)
            self.rotate_camera(pos - self.drag_start)
            self.drag_start = pos
            self.set_camera()
            self.update()

    def screen_to_gl_coordinates(self, pos):
        return 2 * np.array(pos) / np.array(self.size) - 1

    @staticmethod
    def normalize(vec):
        vec = np.asanyarray(vec, dtype=np.float32)
        return vec / np.sqrt(np.sum(vec * vec, axis=-1))[..., None]
