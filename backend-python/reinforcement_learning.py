import os
import sys
import json
import time
import random
import logging
import threading
import numpy as np
from datetime import datetime
from collections import deque
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("reinforcement_learning")
try:
    import gym
    from gym import spaces
    HAS_GYM = True
    logger.info("Gym successfully imported")
except ImportError:
    HAS_GYM = False
    logger.warning("Gym not available. Install with: pip install gym")
try:
    import tensorflow as tf
    from tensorflow import keras
    HAS_TF = True
    logger.info("TensorFlow successfully imported")
except ImportError:
    HAS_TF = False
    logger.warning("TensorFlow not available. Install with: pip install tensorflow")
MAX_MEMORY_SIZE = 10000
BATCH_SIZE = 64
GAMMA = 0.95
EPSILON = 1.0
EPSILON_MIN = 0.01
EPSILON_DECAY = 0.995
LEARNING_RATE = 0.001
FEATURES = [
    "connection_duration", "protocol_type", "service", "src_bytes", "dst_bytes",
    "flag", "land", "wrong_fragment", "urgent", "hot", "num_failed_logins",
    "logged_in", "num_compromised", "root_shell", "su_attempted", "num_root",
    "num_file_creations", "num_shells", "num_access_files", "num_outbound_cmds",
    "is_host_login", "is_guest_login", "count", "srv_count", "serror_rate",
    "srv_serror_rate", "rerror_rate", "srv_rerror_rate", "same_srv_rate",
    "diff_srv_rate", "srv_diff_host_rate", "dst_host_count", "dst_host_srv_count",
    "dst_host_same_srv_rate", "dst_host_diff_srv_rate", "dst_host_same_src_port_rate",
    "dst_host_srv_diff_host_rate", "dst_host_serror_rate", "dst_host_srv_serror_rate",
    "dst_host_rerror_rate", "dst_host_srv_rerror_rate"
]
ACTIONS = {
    0: "no_action",              
    1: "block_ip",               
    2: "rate_limit",             
    3: "redirect_honeypot",      
    4: "alert_only",             
    5: "increase_monitoring",    
    6: "block_port",             
    7: "block_protocol"          
}
class IDSGymEnvironment(gym.Env):
    metadata = {'render.modes': ['console']}
    def __init__(self, use_simulator=False, simulator_path=None):
        super().__init__()
        self.action_space = spaces.Discrete(len(ACTIONS))
        self.observation_space = spaces.Box(
            low=0, high=1, 
            shape=(len(FEATURES),), 
            dtype=np.float32
        )
        self.reset()
        self.use_simulator = use_simulator
        self.simulator_path = simulator_path
        self.simulator_connected = False
        if use_simulator and simulator_path:
            self._connect_to_simulator()
    def _connect_to_simulator(self):
        if not os.path.exists(self.simulator_path):
            logger.error(f"Simulator not found at: {self.simulator_path}")
            return False
        try:
            sys.path.append(os.path.dirname(self.simulator_path))
            simulator_module = os.path.basename(self.simulator_path).replace('.py', '')
            self.simulator = __import__(simulator_module)
            self.simulator_connected = True
            logger.info(f"Connected to external simulator: {self.simulator_path}")
            return True
        except Exception as e:
            logger.error(f"Failed to connect to simulator: {e}")
            self.simulator_connected = False
            return False
    def reset(self):
        self.state = np.zeros(len(FEATURES), dtype=np.float32)
        self.episode_step = 0
        self.total_reward = 0
        self.done = False
        self.info = {}
        self.current_attack = None
        self.attack_detected = False
        if hasattr(self, 'simulator') and self.simulator_connected:
            try:
                initial_state = self.simulator.get_initial_state()
                self.state = self._normalize_state(initial_state)
            except Exception as e:
                logger.error(f"Error getting state from simulator: {e}")
                self.state = self._generate_normal_traffic()
        else:
            self.state = self._generate_normal_traffic()
        return self.state
    def _normalize_state(self, state):
        numeric_state = []
        for i, feature in enumerate(state):
            if isinstance(feature, (int, float)):
                numeric_state.append(feature)
            elif isinstance(feature, str):
                numeric_state.append(hash(feature) % 100 / 100.0)
            else:
                numeric_state.append(0.0)
        return np.clip(np.array(numeric_state, dtype=np.float32), 0, 1)
    def _generate_normal_traffic(self):
        state = np.zeros(len(FEATURES), dtype=np.float32)
        state[0] = random.uniform(0, 0.2)  
        state[1] = random.choice([0.1, 0.2, 0.3])  
        state[2] = random.choice([0.1, 0.2, 0.3, 0.4])  
        state[3] = random.uniform(0, 0.3)  
        state[4] = random.uniform(0, 0.3)  
        state[5] = 0.1  
        state[22] = random.uniform(0, 0.2)  
        state[23] = random.uniform(0, 0.2)  
        state[28] = random.uniform(0.7, 1.0)  
        return state
    def _generate_attack_traffic(self, attack_type=None):
        state = self._generate_normal_traffic()
        if attack_type is None:
            attack_types = ["dos", "probe", "r2l", "u2r"]
            attack_type = random.choice(attack_types)
        if attack_type == "dos":
            state[0] = random.uniform(0, 0.1)  
            state[3] = random.uniform(0.7, 1.0)  
            state[22] = random.uniform(0.8, 1.0)  
            state[23] = random.uniform(0.8, 1.0)  
            state[24] = random.uniform(0.7, 1.0)  
        elif attack_type == "probe":
            state[0] = random.uniform(0, 0.05)  
            state[3] = random.uniform(0, 0.1)  
            state[22] = random.uniform(0.5, 0.9)  
            state[29] = random.uniform(0.7, 1.0)  
        elif attack_type == "r2l":
            state[0] = random.uniform(0.2, 0.6)  
            state[10] = random.uniform(0.5, 1.0)  
            state[11] = 1.0  
        elif attack_type == "u2r":
            state[0] = random.uniform(0.3, 0.8)  
            state[12] = random.uniform(0.7, 1.0)  
            state[13] = 1.0  
            state[15] = random.uniform(0.7, 1.0)  
        self.current_attack = attack_type
        return state
    def step(self, action):
        self.episode_step += 1
        reward = 0
        info = {'action_name': ACTIONS[action]}
        if hasattr(self, 'simulator') and self.simulator_connected:
            try:
                next_state_raw, is_attack = self.simulator.get_next_state(action)
                next_state = self._normalize_state(next_state_raw)
                self.attack_detected = is_attack
            except Exception as e:
                logger.error(f"Error getting next state from simulator: {e}")
                if random.random() < 0.2:  
                    next_state = self._generate_attack_traffic()
                    self.attack_detected = True
                else:
                    next_state = self._generate_normal_traffic()
                    self.attack_detected = False
        else:
            if random.random() < 0.2:  
                next_state = self._generate_attack_traffic()
                self.attack_detected = True
            else:
                next_state = self._generate_normal_traffic()
                self.attack_detected = False
        reward = self._calculate_reward(action, self.attack_detected)
        done = self.episode_step >= 100  
        self.state = next_state
        self.total_reward += reward
        self.done = done
        info.update({
            'step': self.episode_step,
            'total_reward': self.total_reward,
            'attack_detected': self.attack_detected,
            'attack_type': self.current_attack if self.attack_detected else None
        })
        self.info = info
        return self.state, reward, done, info
    def _calculate_reward(self, action, is_attack):
        if is_attack:
            if action == 0:  
                return -10
            elif action == 4:  
                return 5
            else:  
                return 10
        else:
            if action == 0:  
                return 5
            elif action == 4:  
                return 0
            else:  
                return -10
    def render(self, mode='console'):
        if mode != 'console':
            raise NotImplementedError()
        print(f"Step: {self.episode_step}")
        print(f"Action: {self.info.get('action_name', 'unknown')}")
        print(f"Attack detected: {self.attack_detected}")
        print(f"Attack type: {self.current_attack if self.attack_detected else 'none'}")
        print(f"Reward: {self.info.get('total_reward', 0)}")
        print(f"State: {self.state[:5]}... (truncated)")
        print("-" * 40)
    def close(self):
        pass
class DQNAgent:
    def __init__(self, state_size, action_size):
        self.state_size = state_size
        self.action_size = action_size
        self.memory = deque(maxlen=MAX_MEMORY_SIZE)
        self.gamma = GAMMA  
        self.epsilon = EPSILON  
        self.epsilon_min = EPSILON_MIN
        self.epsilon_decay = EPSILON_DECAY
        self.learning_rate = LEARNING_RATE
        self.model = self._build_model()
        self.target_model = self._build_model()
        self.update_target_model()
    def _build_model(self):
        if not HAS_TF:
            logger.error("Cannot build model: TensorFlow not available")
            return None
        model = keras.Sequential()
        model.add(keras.layers.Dense(64, input_dim=self.state_size, activation='relu'))
        model.add(keras.layers.Dense(64, activation='relu'))
        model.add(keras.layers.Dense(self.action_size, activation='linear'))
        model.compile(loss='mse', optimizer=keras.optimizers.Adam(learning_rate=self.learning_rate))
        return model
    def update_target_model(self):
        if not HAS_TF:
            return
        self.target_model.set_weights(self.model.get_weights())
    def remember(self, state, action, reward, next_state, done):
        self.memory.append((state, action, reward, next_state, done))
    def act(self, state):
        if not HAS_TF or random.random() <= self.epsilon:
            return random.randrange(self.action_size)
        act_values = self.model.predict(state.reshape(1, -1), verbose=0)
        return np.argmax(act_values[0])
    def replay(self, batch_size=BATCH_SIZE):
        if not HAS_TF:
            return
        if len(self.memory) < batch_size:
            return
        minibatch = random.sample(self.memory, batch_size)
        states = np.zeros((batch_size, self.state_size))
        targets = np.zeros((batch_size, self.action_size))
        for i, (state, action, reward, next_state, done) in enumerate(minibatch):
            states[i] = state
            target = reward
            if not done:
                target = reward + self.gamma * np.amax(
                    self.target_model.predict(next_state.reshape(1, -1), verbose=0)[0]
                )
            targets[i] = self.model.predict(state.reshape(1, -1), verbose=0)
            targets[i][action] = target
        self.model.fit(states, targets, epochs=1, verbose=0)
        if self.epsilon > self.epsilon_min:
            self.epsilon *= self.epsilon_decay
    def load_model(self, model_path):
        if not HAS_TF:
            logger.error("Cannot load model: TensorFlow not available")
            return False
        if not os.path.exists(model_path):
            logger.error(f"Model file not found: {model_path}")
            return False
        try:
            self.model.load_weights(model_path)
            self.target_model.load_weights(model_path)
            logger.info(f"Model loaded from {model_path}")
            return True
        except Exception as e:
            logger.error(f"Error loading model: {e}")
            return False
    def save_model(self, model_path):
        if not HAS_TF:
            logger.error("Cannot save model: TensorFlow not available")
            return False
        try:
            os.makedirs(os.path.dirname(model_path), exist_ok=True)
            self.model.save_weights(model_path)
            logger.info(f"Model saved to {model_path}")
            return True
        except Exception as e:
            logger.error(f"Error saving model: {e}")
            return False
class ReinforcementLearningIntegration:
    def __init__(self):
        self.env = None
        self.agent = None
        self.state_size = len(FEATURES)
        self.action_size = len(ACTIONS)
        self.training = False
        self.training_thread = None
        self.training_episodes = 0
        self.episode_rewards = []
        self.callbacks = []
        self.is_initialized = False
    def initialize(self, model_path=None, use_simulator=False, simulator_path=None):
        if not HAS_GYM or not HAS_TF:
            logger.error("Cannot initialize RL: missing dependencies")
            return False
        try:
            self.env = IDSGymEnvironment(use_simulator, simulator_path)
            logger.info("Environment initialized")
        except Exception as e:
            logger.error(f"Error initializing environment: {e}")
            return False
        try:
            self.agent = DQNAgent(self.state_size, self.action_size)
            logger.info("Agent initialized")
            if model_path:
                self.agent.load_model(model_path)
        except Exception as e:
            logger.error(f"Error initializing agent: {e}")
            return False
        self.is_initialized = True
        logger.info("Reinforcement learning integration initialized successfully")
        return True
    def register_callback(self, callback):
        if callback not in self.callbacks:
            self.callbacks.append(callback)
        return True
    def unregister_callback(self, callback):
        if callback in self.callbacks:
            self.callbacks.remove(callback)
        return True
    def _notify_callbacks(self, data):
        for callback in self.callbacks:
            try:
                callback(data)
            except Exception as e:
                logger.error(f"Error in callback: {e}")
    def _training_thread_func(self, episodes, batch_size, update_frequency, save_path=None):
        if not self.is_initialized:
            logger.error("Cannot start training: not initialized")
            self.training = False
            return
        self.training = True
        self.training_episodes = 0
        self.episode_rewards = []
        try:
            for episode in range(episodes):
                if not self.training:
                    logger.info("Training stopped")
                    break
                state = self.env.reset()
                total_reward = 0
                for step in range(500):  
                    if not self.training:
                        break
                    action = self.agent.act(state)
                    next_state, reward, done, info = self.env.step(action)
                    self.agent.remember(state, action, reward, next_state, done)
                    state = next_state
                    total_reward += reward
                    if len(self.agent.memory) > batch_size:
                        self.agent.replay(batch_size)
                    if step % update_frequency == 0:
                        self.agent.update_target_model()
                    if done:
                        break
                self.training_episodes += 1
                self.episode_rewards.append(total_reward)
                self._notify_callbacks({
                    "type": "training_update",
                    "episode": self.training_episodes,
                    "reward": total_reward,
                    "epsilon": self.agent.epsilon,
                    "memory_size": len(self.agent.memory)
                })
                if episode % 10 == 0:
                    logger.info(f"Episode: {episode}/{episodes}, Reward: {total_reward}, Epsilon: {self.agent.epsilon:.4f}")
                if save_path and episode % 100 == 0:
                    self.agent.save_model(save_path)
            if save_path:
                self.agent.save_model(save_path)
            logger.info(f"Training completed: {self.training_episodes} episodes")
            self._notify_callbacks({
                "type": "training_complete",
                "episodes": self.training_episodes,
                "final_epsilon": self.agent.epsilon,
                "avg_reward": np.mean(self.episode_rewards) if self.episode_rewards else 0
            })
        except Exception as e:
            logger.error(f"Error in training thread: {e}")
            self._notify_callbacks({
                "type": "training_error",
                "error": str(e)
            })
        self.training = False
    def start_training(self, episodes=1000, batch_size=BATCH_SIZE, update_frequency=100, save_path=None):
        if self.training:
            logger.warning("Training already in progress")
            return False
        if not self.is_initialized:
            logger.error("Cannot start training: not initialized")
            return False
        self.training_thread = threading.Thread(
            target=self._training_thread_func,
            args=(episodes, batch_size, update_frequency, save_path)
        )
        self.training_thread.daemon = True
        self.training_thread.start()
        logger.info(f"Training started: {episodes} episodes")
        return True
    def stop_training(self):
        if not self.training:
            logger.warning("Training not in progress")
            return False
        self.training = False
        if self.training_thread and self.training_thread.is_alive():
            self.training_thread.join(timeout=2.0)
        logger.info("Training stopped")
        return True
    def get_training_status(self):
        if not self.is_initialized:
            return {"status": "not_initialized"}
        return {
            "status": "training" if self.training else "idle",
            "episodes_completed": self.training_episodes,
            "avg_reward": np.mean(self.episode_rewards[-100:]) if len(self.episode_rewards) > 0 else 0,
            "epsilon": self.agent.epsilon if self.agent else EPSILON,
            "memory_size": len(self.agent.memory) if self.agent else 0
        }
    def predict_action(self, features):
        if not self.is_initialized:
            logger.error("Cannot predict: not initialized")
            return 0, "no_action", "Not initialized"
        try:
            state = np.array(features, dtype=np.float32).reshape(1, -1)
            state = np.clip(state, 0, 1)
            if HAS_TF:
                act_values = self.agent.model.predict(state, verbose=0)
                action = np.argmax(act_values[0])
            else:
                action = 0
            return action, ACTIONS[action], "Success"
        except Exception as e:
            logger.error(f"Error predicting action: {e}")
            return 0, "no_action", f"Error: {e}"
    def evaluate(self, episodes=10):
        if not self.is_initialized:
            logger.error("Cannot evaluate: not initialized")
            return {"error": "Not initialized"}
        results = []
        total_reward = 0
        true_positives = 0
        false_positives = 0
        true_negatives = 0
        false_negatives = 0
        old_epsilon = self.agent.epsilon
        self.agent.epsilon = 0
        try:
            for episode in range(episodes):
                state = self.env.reset()
                ep_reward = 0
                done = False
                while not done:
                    action = self.agent.act(state)
                    next_state, reward, done, info = self.env.step(action)
                    ep_reward += reward
                    if info.get('attack_detected', False):
                        if action != 0:  
                            true_positives += 1
                        else:
                            false_negatives += 1
                    else:
                        if action == 0:  
                            true_negatives += 1
                        else:
                            false_positives += 1
                    state = next_state
                total_reward += ep_reward
                results.append({
                    "episode": episode,
                    "reward": ep_reward,
                    "steps": info.get('step', 0)
                })
            accuracy = (true_positives + true_negatives) / max(true_positives + true_negatives + false_positives + false_negatives, 1)
            precision = true_positives / max(true_positives + false_positives, 1)
            recall = true_positives / max(true_positives + false_negatives, 1)
            f1 = 2 * precision * recall / max(precision + recall, 1e-10)
            evaluation = {
                "avg_reward": total_reward / episodes,
                "true_positives": true_positives,
                "false_positives": false_positives,
                "true_negatives": true_negatives,
                "false_negatives": false_negatives,
                "accuracy": accuracy,
                "precision": precision,
                "recall": recall,
                "f1_score": f1,
                "episodes": episodes,
                "results": results
            }
            logger.info(f"Evaluation completed: Avg reward = {evaluation['avg_reward']:.2f}, Accuracy = {accuracy:.2f}")
            return evaluation
        except Exception as e:
            logger.error(f"Error during evaluation: {e}")
            return {"error": str(e)}
        finally:
            self.agent.epsilon = old_epsilon
    def save_model(self, model_path):
        if not self.is_initialized or not self.agent:
            logger.error("Cannot save model: not initialized")
            return False
        return self.agent.save_model(model_path)
    def load_model(self, model_path):
        if not self.is_initialized or not self.agent:
            logger.error("Cannot load model: not initialized")
            return False
        return self.agent.load_model(model_path)
reinforcement_learning = ReinforcementLearningIntegration()
def initialize(model_path=None, use_simulator=False, simulator_path=None):
    return reinforcement_learning.initialize(model_path, use_simulator, simulator_path)
def start_training(episodes=1000, batch_size=BATCH_SIZE, update_frequency=100, save_path=None):
    return reinforcement_learning.start_training(episodes, batch_size, update_frequency, save_path)
def stop_training():
    return reinforcement_learning.stop_training()
def get_training_status():
    return reinforcement_learning.get_training_status()
def predict_action(features):
    return reinforcement_learning.predict_action(features)
def evaluate(episodes=10):
    return reinforcement_learning.evaluate(episodes)
def save_model(model_path):
    return reinforcement_learning.save_model(model_path)
def load_model(model_path):
    return reinforcement_learning.load_model(model_path)
def register_callback(callback):
    return reinforcement_learning.register_callback(callback)
def unregister_callback(callback):
    return reinforcement_learning.unregister_callback(callback)
__all__ = ['ReinforcementLearningIntegration', 'DQNAgent', 'IDSGymEnvironment', 
           'reinforcement_learning', 'initialize', 'start_training', 'stop_training',
           'get_training_status', 'predict_action', 'evaluate', 'save_model', 
           'load_model', 'register_callback', 'unregister_callback', 'ACTIONS'] 