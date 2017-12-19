import os
import numpy as np
from PIL import Image


class Skybox:
    def __init__(self, front="", back="", left="", right="", up="", down=""):
        self.texture = np.zeros((6, 1024, 1024, 3), dtype=np.float32)

        local_directory = os.path.dirname(__file__) or '.'

        front = os.path.join(local_directory, front)
        back = os.path.join(local_directory, back)
        left = os.path.join(local_directory, left)
        right = os.path.join(local_directory, right)
        up = os.path.join(local_directory, up)
        down = os.path.join(local_directory, down)

        if os.path.isfile(front) and os.path.isfile(back) and os.path.isfile(left) and \
                os.path.isfile(right) and os.path.isfile(up) and os.path.isfile(down):

            self.texture[0] = np.array(Image.open(front)) / 255.
            self.texture[1] = np.array(Image.open(back)) / 255.
            self.texture[2] = np.array(Image.open(left)) / 255.
            self.texture[3] = np.array(Image.open(right)) / 255.
            self.texture[4] = np.array(Image.open(up)) / 255.
            self.texture[5] = np.array(Image.open(down)) / 255.

        else:
            print("Error: skybox files not found")
            exit(1)

    @staticmethod
    def cube():
        """
        Build vertices for a colored cube.

        V  is the vertices
        I1 is the indices for a filled cube (use with GL_TRIANGLES)
        I2 is the indices for an outline cube (use with GL_LINES)
        """
        vtype = [('a_position', np.float32, 3),
                 ('a_normal', np.float32, 3),
                 ('a_color', np.float32, 4)]
        # Vertices positions
        v = [[1, 1, 1], [-1, 1, 1], [-1, -1, 1], [1, -1, 1],
             [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, -1]]
        # Face Normals
        n = [[0, 0, 1], [1, 0, 0], [0, 1, 0],
             [-1, 0, 1], [0, -1, 0], [0, 0, -1]]
        # Vertice colors
        c = [[0, 1, 1, 1], [0, 0, 1, 1], [0, 0, 0, 1], [0, 1, 0, 1],
             [1, 1, 0, 1], [1, 1, 1, 1], [1, 0, 1, 1], [1, 0, 0, 1]]

        V = np.array([(v[0], n[0], c[0]), (v[1], n[0], c[1]),
                      (v[2], n[0], c[2]), (v[3], n[0], c[3]),
                      (v[0], n[1], c[0]), (v[3], n[1], c[3]),
                      (v[4], n[1], c[4]), (v[5], n[1], c[5]),
                      (v[0], n[2], c[0]), (v[5], n[2], c[5]),
                      (v[6], n[2], c[6]), (v[1], n[2], c[1]),
                      (v[1], n[3], c[1]), (v[6], n[3], c[6]),
                      (v[7], n[3], c[7]), (v[2], n[3], c[2]),
                      (v[7], n[4], c[7]), (v[4], n[4], c[4]),
                      (v[3], n[4], c[3]), (v[2], n[4], c[2]),
                      (v[4], n[5], c[4]), (v[7], n[5], c[7]),
                      (v[6], n[5], c[6]), (v[5], n[5], c[5])],
                     dtype=vtype)
        I1 = np.resize(np.array([0, 1, 2, 0, 2, 3], dtype=np.uint32), 6 * (2 * 3))
        I1 += np.repeat(4 * np.arange(2 * 3, dtype=np.uint32), 6)

        I2 = np.resize(
            np.array([0, 1, 1, 2, 2, 3, 3, 0], dtype=np.uint32), 6 * (2 * 4))
        I2 += np.repeat(4 * np.arange(6, dtype=np.uint32), 8)

        return V, I1, I2
