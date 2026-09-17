from flask import Blueprint, jsonify
from backend.services.data_service import DataService

api_bp = Blueprint('api', __name__, url_prefix='/api')
data_service = DataService()

@api_bp.route('/forecast/native', methods=['GET'])
def get_native_forecast():
    return jsonify(data_service.load_native_forecast())

@api_bp.route('/forecast/demo', methods=['GET'])
def get_demo_forecast():
    return jsonify(data_service.load_demo_forecast())

@api_bp.route('/metadata', methods=['GET'])
def get_metadata():
    return jsonify(data_service.load_model_metadata())

@api_bp.route('/comparison', methods=['GET'])
def get_comparison():
    return jsonify(data_service.load_model_comparison())
