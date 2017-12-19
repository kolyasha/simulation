from vispy import app
from Canvas import Canvas
from surface import Surface


if __name__ == '__main__':
    c = Canvas(surface=Surface.Surface(nwave=5, max_height=0.05), size=(500, 500))
    app.run()
