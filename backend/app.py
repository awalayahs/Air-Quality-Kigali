import os
from flask import Flask, render_template
from backend.config import Config
from backend.api.routes import api_bp

def create_app():
    frontend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'frontend'))
    template_folder = os.path.join(frontend_dir, 'templates')
    static_folder = os.path.join(frontend_dir, 'static')

    app = Flask(__name__, template_folder=template_folder, static_folder=static_folder)
    app.config.from_object(Config)

    app.register_blueprint(api_bp)

    @app.route('/')
    def index():
        return render_template('index.html')

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(host=Config.HOST, port=Config.PORT, debug=Config.DEBUG)
