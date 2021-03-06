import numpy as np

from surface import CircularWave


class Surface(object):

    def __init__(self, size=(50, 50), nwave=5, max_height=0.2):
        self.size = size
        self.waves = []
        for each in range(nwave):
            self.waves.append(CircularWave.random_wave(nwave, max_height))

    def coords(self):
        # N x 1 array
        x = np.linspace(-1, 1, self.size[0])[:, np.newaxis]
        # 1 x N array
        y = np.linspace(-1, 1, self.size[1])[np.newaxis, :]

        return x, y

    def empty_arr(self, shape):
        # each cell equals 0
        return np.zeros(shape, dtype=np.float32)

    def position(self):
        x, y = self.coords()

        # last 2 is to store 2d coords of each point
        shape = (self.size[0], self.size[1], 2)
        grid = self.empty_arr(shape)

        # grid[i][j].x = x[i][0]
        grid[..., 0] = x
        # grid[i][j].y = y[0][j]
        grid[..., 1] = y
        return grid

    def triangulation(self):
        # generates array with 2 cells
        # first cell is 2D array with x of each cell of original NxM array
        # for N = 3, M = 3 it's [[0, 0, 0], [1, 1, 1], [2, 2, 2]]
        # second - y
        # for N = 3, M = 3 it's [[0, 1, 2], [0, 1, 2], [0, 1, 2]]
        a = np.indices((self.size[0] - 1, self.size[1] - 1))
        # creates array [[[1]], [[0]]]
        # that way, for each x we add 1, for each y we add 0
        b = a + np.array([1, 0])[:, np.newaxis, np.newaxis]
        c = a + np.array([1, 1])[:, np.newaxis, np.newaxis]
        d = a + np.array([0, 1])[:, np.newaxis, np.newaxis]

        # convert 3D array to 2D array of [[all x], [all y]]
        # -1 means that length is inferred from the length of original array
        a = a.reshape((2, -1))
        b = b.reshape((2, -1))
        c = c.reshape((2, -1))
        d = d.reshape((2, -1))

        # from 2D NxM array get 1D array, where arr[i * M + j] = old[i][j]
        a = np.ravel_multi_index(a, self.size)
        b = np.ravel_multi_index(b, self.size)
        c = np.ravel_multi_index(c, self.size)
        d = np.ravel_multi_index(d, self.size)

        # for each of three arrays make 2D array, where each inner array contains single number from the original one
        # Concatenate arrays so there will be [[a0, b0, c0], ..., [ai, bi, ci]] array
        abc = np.concatenate((a[..., None], b[..., None], c[..., None]), axis=-1)
        acd = np.concatenate((a[..., None], c[..., None], d[..., None]), axis=-1)

        return np.concatenate((abc, acd), axis=0).astype(np.uint32)

    @staticmethod
    def ambient_color():
        return np.array([0.0, 0.3, 0.5], dtype=np.float32)
