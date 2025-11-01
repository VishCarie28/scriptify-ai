import json
import pathlib


class ConfigManager:
    CONFIG_PATH = pathlib.Path(__file__).parent.parent / "config" / "config.json"

    @staticmethod
    def get_config():
        with open(ConfigManager.CONFIG_PATH, "r") as f:
            return json.load(f)
