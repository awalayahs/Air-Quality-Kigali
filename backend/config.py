import os

class Config:
    BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    DATA_DIR = os.path.join(BASE_DIR, 'data')
    
    FORECAST_NATIVE_PATH = os.path.join(DATA_DIR, 'forecast_native.csv')
    FORECAST_DEMO_PATH = os.path.join(DATA_DIR, 'forecast_demo.csv')
    MODEL_METADATA_PATH = os.path.join(DATA_DIR, 'model_metadata.json')
    MODEL_COMPARISON_PATH = os.path.join(DATA_DIR, 'model_comparison.json')
    
    DEBUG = True
    PORT = 5000
    HOST = '0.0.0.0'
