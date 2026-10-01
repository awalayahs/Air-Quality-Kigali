from flask import Blueprint, jsonify, request, send_file
from backend.services.data_service import DataService

api_bp = Blueprint('api', __name__)
service = DataService()

@api_bp.route('/health', methods=['GET'])
def health_check():
    return jsonify(service.check_health())

@api_bp.route('/forecast', methods=['GET'])
def get_forecast():
    kind = request.args.get('kind', 'native')
    return jsonify(service.load_forecast_csv(kind=kind))

@api_bp.route('/forecast/summary', methods=['GET'])
def get_forecast_summary():
    return jsonify(service.get_forecast_summary())

@api_bp.route('/forecast/download', methods=['GET'])
def download_forecast():
    kind = request.args.get('kind', 'native')
    filepath = service.get_forecast_filepath(kind=kind)
    if not filepath.exists():
        return jsonify({"status": "error", "message": "File not found."}), 404
    return send_file(filepath, as_attachment=True)

@api_bp.route('/metrics', methods=['GET'])
def get_metrics():
    return jsonify(service.get_metrics())

@api_bp.route('/metrics/comparison', methods=['GET'])
def get_comparison():
    return jsonify(service.load_json_artifact('model_comparison.json'))

@api_bp.route('/model', methods=['GET'])
def get_model_info():
    metadata = service.load_json_artifact('model_metadata.json')
    return jsonify({
        "selected_model": metadata.get("model_name", "Random Forest"),
        "training_cutoff": metadata.get("training_cutoff", "2023-12-19")
    })

@api_bp.route('/trends', methods=['GET'])
def get_trends():
    return jsonify({"status": "success", "data": []})

@api_bp.route('/correlations', methods=['GET'])
def get_correlations():
    return jsonify(service.load_json_artifact('meteorological_correlations.json'))

@api_bp.route('/meteorology', methods=['GET'])
def get_meteorology():
    return jsonify({"status": "success", "data": []})