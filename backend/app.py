from flask import Flask, render_template
from backend.api.routes import api_bp

app = Flask(__name__, template_folder='../frontend/templates', static_folder='../frontend/static')
app.register_blueprint(api_bp, url_prefix='/api')

@app.route('/')
def index():
    return render_template('index.html')

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)