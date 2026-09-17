import csv
import json
from backend.config import Config

class DataService:
    @staticmethod
    def get_csv_data(filepath):
        data = []
        with open(filepath, mode='r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            for row in reader:
                row['pm25'] = float(row['pm25'])
                row['aqi'] = int(row['aqi'])
                data.append(row)
        return data

    @staticmethod
    def get_json_data(filepath):
        with open(filepath, mode='r', encoding='utf-8') as file:
            return json.load(file)

    def load_native_forecast(self):
        return self.get_csv_data(Config.FORECAST_NATIVE_PATH)

    def load_demo_forecast(self):
        return self.get_csv_data(Config.FORECAST_DEMO_PATH)

    def load_model_metadata(self):
        return self.get_json_data(Config.MODEL_METADATA_PATH)

    def load_model_comparison(self):
        return self.get_json_data(Config.MODEL_COMPARISON_PATH)
