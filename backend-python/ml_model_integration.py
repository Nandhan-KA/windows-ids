import os
import json
import logging
import time
import random
import threading
import numpy as np
from datetime import datetime
from collections import deque
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("ml_model_integration")
try:
    import tensorflow as tf
    from tensorflow.keras.models import load_model
    HAS_TENSORFLOW = True
    logger.info("TensorFlow successfully imported")
except ImportError:
    HAS_TENSORFLOW = False
    logger.warning("TensorFlow not available. Install with: pip install tensorflow")
ATTACK_TYPES = {
    "normal": 0,
    "dos": 1,
    "probe": 2,
    "r2l": 3,
    "u2r": 4,
}
ATTACK_TYPES_REVERSE = {v: k for k, v in ATTACK_TYPES.items()}
FEATURE_NAMES = [
    "duration", "protocol_type", "service", "flag", "src_bytes",
    "dst_bytes", "land", "wrong_fragment", "urgent", "hot",
    "num_failed_logins", "logged_in", "num_compromised", "root_shell",
    "su_attempted", "num_root", "num_file_creations", "num_shells",
    "num_access_files", "num_outbound_cmds", "is_host_login",
    "is_guest_login", "count", "srv_count", "serror_rate"
]
class MLModelIntegration:
    def __init__(self):
        self.model = None
        self.norm_params = None
        self.is_initialized = False
        self.model_path = None
        self.norm_params_path = None
        self.detection_threshold = 0.7  
        self.feature_mean = None
        self.feature_std = None
        self.callbacks = []
        self.training_data = deque(maxlen=10000)  
        self.running = False
        self.processing_thread = None
    def initialize(self, model_path=None, norm_params_path=None):
        if not HAS_TENSORFLOW:
            logger.error("Cannot initialize ML model without TensorFlow")
            return False
        if not model_path:
            model_path = os.path.join(os.environ.get('USERPROFILE', ''), 
                                     'Desktop', 'ids', 'models', 
                                     'large_model', 'best_fast_model.h5')
        if not norm_params_path:
            norm_params_path = os.path.join(os.environ.get('USERPROFILE', ''), 
                                           'Desktop', 'ids', 'models', 
                                           'large_model', 'normalization_params.json')
        if not os.path.exists(model_path):
            logger.error(f"Model file not found: {model_path}")
            return False
        if not os.path.exists(norm_params_path):
            logger.error(f"Normalization parameters file not found: {norm_params_path}")
            return False
        try:
            logger.info(f"Loading model from {model_path}")
            self.model = load_model(model_path)
            logger.info(f"Loading normalization parameters from {norm_params_path}")
            with open(norm_params_path, 'r') as f:
                self.norm_params = json.load(f)
            self.feature_mean = np.array(self.norm_params['mean'])
            self.feature_std = np.array(self.norm_params['std'])
            self.model_path = model_path
            self.norm_params_path = norm_params_path
            self.is_initialized = True
            logger.info("ML model integration initialized successfully")
            return True
        except Exception as e:
            logger.error(f"Error initializing ML model: {e}")
            return False
    def start(self):
        if not self.is_initialized:
            logger.error("Cannot start ML processing - model not initialized")
            return False
        if self.running:
            logger.warning("ML processing already running")
            return True
        self.running = True
        self.processing_thread = threading.Thread(target=self._processing_loop)
        self.processing_thread.daemon = True
        self.processing_thread.start()
        logger.info("ML processing thread started")
        return True
    def stop(self):
        self.running = False
        if self.processing_thread and self.processing_thread.is_alive():
            self.processing_thread.join(timeout=3)
        logger.info("ML processing stopped")
        return True
    def register_callback(self, callback):
        if callback not in self.callbacks:
            self.callbacks.append(callback)
        return True
    def unregister_callback(self, callback):
        if callback in self.callbacks:
            self.callbacks.remove(callback)
        return True
    def _notify_callbacks(self, attack_data):
        for callback in self.callbacks:
            try:
                callback(attack_data)
            except Exception as e:
                logger.error(f"Error in callback: {e}")
    def normalize_features(self, features):
        if not self.is_initialized:
            return features
        normalized = (features - self.feature_mean) / (self.feature_std + 1e-10)
        return normalized
    def connection_to_features(self, connection):
        features = np.zeros(len(FEATURE_NAMES))
        if 'duration' in connection:
            features[0] = float(connection.get('duration', 0))
        if 'protocol' in connection:
            protocol = connection['protocol'].lower()
            if protocol == 'tcp':
                features[1] = 1
            elif protocol == 'udp':
                features[1] = 2
            elif protocol == 'icmp':
                features[1] = 3
        if 'src_bytes' in connection:
            features[4] = float(connection.get('src_bytes', 0))
        if 'dst_bytes' in connection:
            features[5] = float(connection.get('dst_bytes', 0))
        if 'count' in connection:
            features[22] = float(connection.get('count', 0))
        if 'srv_count' in connection:
            features[23] = float(connection.get('srv_count', 0))
        return features
    def predict_connection(self, connection):
        if not self.is_initialized or not self.model:
            logger.error("Model not initialized")
            return {'attack_type': 'unknown', 'confidence': 0, 'is_attack': False}
        features = self.connection_to_features(connection)
        normalized_features = self.normalize_features(features)
        features_batch = np.expand_dims(normalized_features, axis=0)
        try:
            predictions = self.model.predict(features_batch, verbose=0)
            attack_class = np.argmax(predictions[0])
            confidence = float(predictions[0][attack_class])
            attack_type = ATTACK_TYPES_REVERSE.get(attack_class, "unknown")
            is_attack = attack_type != "normal" and confidence >= self.detection_threshold
            return {
                'attack_type': attack_type,
                'confidence': confidence,
                'is_attack': is_attack,
                'predictions': [float(p) for p in predictions[0]]
            }
        except Exception as e:
            logger.error(f"Error making prediction: {e}")
            return {'attack_type': 'unknown', 'confidence': 0, 'is_attack': False}
    def process_connection(self, connection):
        self.training_data.append(connection)
        prediction = self.predict_connection(connection)
        if prediction['is_attack']:
            prediction['timestamp'] = datetime.now().isoformat()
            prediction['details'] = f"{prediction['attack_type'].upper()} attack detected with {prediction['confidence']:.2f} confidence"
            if prediction['attack_type'] == 'u2r' or prediction['attack_type'] == 'r2l':
                prediction['severity'] = 'critical'
            elif prediction['attack_type'] == 'dos':
                prediction['severity'] = 'high'
            else:
                prediction['severity'] = 'medium'
            prediction['connection'] = connection
            self._notify_callbacks(prediction)
            logger.info(f"ML model detected {prediction['attack_type']} attack with {prediction['confidence']:.2f} confidence")
        return prediction
    def _processing_loop(self):
        try:
            import multiprocessing_monitor
            logger.info("Using multiprocessing_monitor for connection data")
            use_multiprocessing = True
        except ImportError:
            logger.warning("multiprocessing_monitor not available, using fallback")
            import network_monitor
            use_multiprocessing = False
        logger.info("ML model processing loop started")
        while self.running:
            try:
                if use_multiprocessing:
                    connections = multiprocessing_monitor.get_network_connections()
                else:
                    connections = network_monitor.get_connections()
                if connections:
                    for connection in connections:
                        self.process_connection(connection)
                time.sleep(0.2)
            except Exception as e:
                logger.error(f"Error in ML processing loop: {e}")
                time.sleep(5)  
        logger.info("ML model processing loop stopped")
    def reinforce_learning(self, connection, feedback):
        connection['feedback'] = feedback
        self.training_data.append(connection)
        logger.info(f"Stored reinforcement learning feedback for connection")
    def export_training_data(self, filepath):
        try:
            with open(filepath, 'w') as f:
                json.dump(list(self.training_data), f)
            logger.info(f"Exported {len(self.training_data)} training examples to {filepath}")
            return True
        except Exception as e:
            logger.error(f"Error exporting training data: {e}")
            return False
model_integration = MLModelIntegration()
def initialize(model_path=None, norm_params_path=None):
    return model_integration.initialize(model_path, norm_params_path)
def start():
    return model_integration.start()
def stop():
    return model_integration.stop()
def process_connection(connection):
    return model_integration.process_connection(connection)
def register_callback(callback):
    return model_integration.register_callback(callback)
def unregister_callback(callback):
    return model_integration.unregister_callback(callback)
def reinforce_learning(connection, feedback):
    return model_integration.reinforce_learning(connection, feedback)
def export_training_data(filepath):
    return model_integration.export_training_data(filepath)
__all__ = ['MLModelIntegration', 'model_integration', 'initialize', 'start', 'stop',
           'process_connection', 'register_callback', 'unregister_callback',
           'reinforce_learning', 'export_training_data'] 