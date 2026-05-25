#!/usr/bin/env python3
"""SPA-aware dev server — redirects all unknown paths to index.html"""
import http.server, os

PORT = 8080
ROOT = os.path.dirname(os.path.abspath(__file__))

class SPAHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def do_GET(self):
        # Try to serve the real file first; fall back to index.html
        path = self.translate_path(self.path)
        if not os.path.exists(path) or os.path.isdir(path) and not os.path.exists(os.path.join(path, 'index.html')):
            self.path = '/index.html'
        super().do_GET()

    def log_message(self, format, *args):
        pass  # silence request logs

if __name__ == '__main__':
    with http.server.HTTPServer(('', PORT), SPAHandler) as httpd:
        print(f'Dev server running at http://localhost:{PORT}')
        httpd.serve_forever()
