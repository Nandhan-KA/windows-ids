#!/usr/bin/env python
"""
Network Attack Simulator using Gym/Gymnasium for DeepIDS
This environment simulates various network attacks for training and testing IDS systems
"""

import os
import sys

# Add parent directory to path for imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

import json
import time
import random
import logging
import numpy as np
import gymnasium as gym
from gymnasium import spaces
import tensorflow as tf
from tensorflow.keras.models import load_model

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("deepids.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("DeepIDS-Gym")

# Define attack types
ATTACK_TYPES = {
    "normal": 0,
    "dos": 1,
    "probe": 2,
    "r2l": 3,
    "u2r": 4,
}

# Feature names (simplified for simulation)
FEATURE_NAMES = [
    "duration", "protocol_type", "service", "flag", "src_bytes", 
    "dst_bytes", "land", "wrong_fragment", "urgent", "hot", 
    "num_failed_logins", "logged_in", "num_compromised", "root_shell", 
    "su_attempted", "num_root", "num_file_creations", "num_shells", 
    "num_access_files", "num_outbound_cmds", "is_host_login", 
    "is_guest_login", "count", "srv_count", "serror_rate"
]

class NetworkAttackSimulatorEnv(gym.Env):
    """
    NetworkAttackSimulator is a gym environment for simulating network attacks
    to train and evaluate intrusion detection systems.
    """
    metadata = {'render_modes': ['human', 'ansi']}
    
    def __init__(self, 
                 ids_model_path=None, 
                 norm_params_path=None,
                 render_mode=None,
                 max_steps=1000,
                 real_data_path=None):
        """
        Initialize the network attack simulator environment.
        
        Args:
            ids_model_path: Path to trained IDS model (optional)
            norm_params_path: Path to normalization parameters (optional)
            render_mode: Render mode ('human' or 'ansi')
            max_steps: Maximum steps per episode
            real_data_path: Path to real network data for generating realistic traffic
        """
        super(NetworkAttackSimulatorEnv, self).__init__()
        
        # Set render mode
        self.render_mode = render_mode
        
        # Set maximum steps
        self.max_steps = max_steps
        self.current_step = 0
        
        # Define reward range
        self.reward_range = (-float('inf'), float('inf'))
        
        # Load real data if provided (for more realistic simulation)
        self.real_data = None
        if real_data_path and os.path.exists(real_data_path):
            try:
                with open(real_data_path, 'r') as f:
                    self.real_data = json.load(f)
                logger.info(f"Loaded {len(self.real_data['features'])} real data samples")
            except Exception as e:
                logger.error(f"Failed to load real data: {e}")
        
        # Load IDS model if provided
        self.ids_model = None
        self.feature_mean = None
        self.feature_std = None
        
        if ids_model_path and os.path.exists(ids_model_path):
            try:
                self.ids_model = load_model(ids_model_path)
                logger.info(f"Loaded IDS model from {ids_model_path}")
                
                # Load normalization parameters if provided
                if norm_params_path and os.path.exists(norm_params_path):
                    with open(norm_params_path, 'r') as f:
                        norm_params = json.load(f)
                    self.feature_mean = np.array(norm_params['mean'])
                    self.feature_std = np.array(norm_params['std'])
                    logger.info(f"Loaded normalization parameters from {norm_params_path}")
            except Exception as e:
                logger.error(f"Failed to load IDS model: {e}")
        
        # Define action and observation spaces
        # Actions: 
        # - Choose attack type (normal, dos, probe, r2l, u2r)
        # - Choose attack parameters (intensity, stealth, etc.)
        self.action_space = spaces.Dict({
            'attack_type': spaces.Discrete(len(ATTACK_TYPES)),
            'intensity': spaces.Box(low=0, high=1, shape=(1,), dtype=np.float32),
            'stealth': spaces.Box(low=0, high=1, shape=(1,), dtype=np.float32),
        })
        
        # Observation space: network traffic features
        self.observation_space = spaces.Box(
            low=-np.inf, high=np.inf, shape=(len(FEATURE_NAMES),), dtype=np.float32
        )
        
        # Initialize state
        self.state = np.zeros(len(FEATURE_NAMES), dtype=np.float32)
        
        # Track metrics
        self.metrics = {
            'successful_attacks': 0,
            'detected_attacks': 0,
            'false_positives': 0,
            'false_negatives': 0,
        }
        
        # Initialize attack history
        self.attack_history = []
        
    def reset(self, seed=None, options=None):
        """Reset the environment to initial state."""
        super().reset(seed=seed)
        
        # Reset step counter
        self.current_step = 0
        
        # Generate initial state (normal traffic)
        self.state = self._generate_normal_traffic()
        
        # Reset attack history
        self.attack_history = []
        
        # Return initial observation and info
        return self.state, {}
    
    def step(self, action):
        """
        Take a step in the environment with the given action.
        
        Args:
            action: Dict with keys 'attack_type', 'intensity', 'stealth'
            
        Returns:
            observation: New state after action
            reward: Reward for the action
            terminated: Whether the episode is done
            truncated: Whether the episode was truncated
            info: Additional information
        """
        # Increment step counter
        self.current_step += 1
        
        # Parse action
        attack_type = list(ATTACK_TYPES.keys())[action['attack_type']]
        intensity = float(action['intensity'][0])
        stealth = float(action['stealth'][0])
        
        # Generate new state based on action
        if attack_type == "normal":
            new_state = self._generate_normal_traffic()
            is_attack = False
        else:
            new_state = self._generate_attack_traffic(attack_type, intensity, stealth)
            is_attack = True
        
        # Store current state
        self.state = new_state
        
        # Detect attack using IDS model if available
        detected = False
        if self.ids_model is not None:
            # Normalize state if normalization parameters are available
            if self.feature_mean is not None and self.feature_std is not None:
                normalized_state = (new_state - self.feature_mean) / self.feature_std
            else:
                normalized_state = new_state
                
            # Predict using IDS model
            prediction = self.ids_model.predict(normalized_state.reshape(1, -1), verbose=0)[0][0]
            detected = prediction > 0.7  # Using default threshold
            
            # Update metrics
            if is_attack and detected:
                self.metrics['detected_attacks'] += 1
            elif is_attack and not detected:
                self.metrics['false_negatives'] += 1
            elif not is_attack and detected:
                self.metrics['false_positives'] += 1
            
            if is_attack and not detected:
                self.metrics['successful_attacks'] += 1
        
        # Record attack in history
        self.attack_history.append({
            'step': self.current_step,
            'attack_type': attack_type,
            'intensity': intensity,
            'stealth': stealth,
            'detected': detected if self.ids_model else None
        })
        
        # Calculate reward
        # Attacker gets positive reward for successful attacks and negative for detected ones
        if is_attack:
            if self.ids_model and not detected:
                reward = 10.0 * intensity  # Higher reward for more intense attacks
            elif self.ids_model and detected:
                reward = -5.0  # Penalty for getting caught
            else:
                reward = 0.0  # No IDS model to evaluate
        else:
            reward = 0.1  # Small reward for normal traffic
        
        # Check if episode is done
        terminated = False  # Episodes don't terminate based on state
        truncated = self.current_step >= self.max_steps
        
        # Compile info
        info = {
            'attack_type': attack_type,
            'intensity': intensity,
            'stealth': stealth,
            'detected': detected if self.ids_model else None,
            'is_attack': is_attack,
            'metrics': self.metrics.copy()
        }
        
        # Render if mode is set
        if self.render_mode == 'human':
            self.render()
        
        return self.state, reward, terminated, truncated, info
    
    def render(self):
        """Render the environment."""
        if self.render_mode == 'human' or self.render_mode == 'ansi':
            # Get last attack info
            if self.attack_history:
                last_attack = self.attack_history[-1]
                attack_type = last_attack['attack_type']
                intensity = last_attack['intensity']
                detected = last_attack['detected']
                
                status = "DETECTED" if detected else "UNDETECTED"
                if attack_type == "normal":
                    print(f"Step {self.current_step}: Normal traffic")
                else:
                    print(f"Step {self.current_step}: {attack_type.upper()} attack (Intensity: {intensity:.2f}) - {status}")
            else:
                print(f"Step {self.current_step}: Initial state")
    
    def _generate_normal_traffic(self):
        """Generate normal network traffic."""
        if self.real_data is not None and random.random() < 0.8:
            # Use real normal data 80% of the time
            normal_indices = [i for i, label in enumerate(self.real_data['labels']) if label == 0]
            if normal_indices:
                idx = random.choice(normal_indices)
                return np.array(self.real_data['features'][idx], dtype=np.float32)
        
        # Generate synthetic normal traffic
        state = np.zeros(len(FEATURE_NAMES), dtype=np.float32)
        
        # Set typical values for normal traffic
        state[0] = random.uniform(0, 10)  # duration
        state[1] = random.choice([1, 2, 3])  # protocol_type (numeric)
        state[2] = random.choice(range(1, 20))  # service (numeric)
        state[3] = random.choice(range(1, 12))  # flag (numeric)
        state[4] = random.uniform(100, 1000)  # src_bytes
        state[5] = random.uniform(100, 1000)  # dst_bytes
        state[11] = 1  # logged_in (usually 1 for normal)
        state[22] = random.uniform(1, 10)  # count
        state[23] = random.uniform(1, 10)  # srv_count
        
        return state
    
    def _generate_attack_traffic(self, attack_type, intensity, stealth):
        """
        Generate attack network traffic.
        
        Args:
            attack_type: Type of attack
            intensity: Intensity of attack (0-1)
            stealth: Stealth level of attack (0-1)
            
        Returns:
            state: Generated attack traffic state
        """
        if self.real_data is not None and random.random() < 0.6:
            # Use real attack data 60% of the time
            attack_type_id = ATTACK_TYPES[attack_type]
            attack_indices = [i for i, label in enumerate(self.real_data['labels']) if label == attack_type_id]
            if attack_indices:
                idx = random.choice(attack_indices)
                base_state = np.array(self.real_data['features'][idx], dtype=np.float32)
                
                # Apply intensity and stealth modifiers
                return self._modify_attack_features(base_state, attack_type, intensity, stealth)
        
        # Start with normal traffic as base
        state = self._generate_normal_traffic()
        
        # Modify features based on attack type
        if attack_type == "dos":
            # DoS attack features
            state[0] = random.uniform(0, 3)  # Short duration
            state[4] = random.uniform(1000, 10000) * intensity  # High src_bytes
            state[22] = random.uniform(100, 500) * intensity  # High count
            state[23] = random.uniform(100, 500) * intensity  # High srv_count
            state[24] = random.uniform(0.7, 1.0) * intensity  # High error rate
            
        elif attack_type == "probe":
            # Probe attack features
            state[0] = random.uniform(0, 2)  # Very short duration
            state[4] = random.uniform(10, 100)  # Low src_bytes
            state[5] = random.uniform(10, 100)  # Low dst_bytes
            state[22] = random.uniform(50, 200) * intensity  # High count
            
        elif attack_type == "r2l":
            # R2L attack features
            state[0] = random.uniform(5, 20)  # Longer duration
            state[4] = random.uniform(500, 3000)  # Medium src_bytes
            state[5] = random.uniform(2000, 8000) * intensity  # High dst_bytes
            state[10] = random.randint(0, 5) * intensity  # failed_logins
            state[11] = 1 if random.random() > stealth else 0  # logged_in
            
        elif attack_type == "u2r":
            # U2R attack features
            state[0] = random.uniform(10, 30)  # Long duration
            state[9] = random.uniform(3, 10) * intensity  # hot indicators
            state[12] = random.randint(1, 5) * intensity  # num_compromised
            state[13] = 1 if random.random() > stealth else 0  # root_shell
            state[15] = random.randint(0, 3) * intensity  # num_root
            
        # Apply stealth modifier (make attack look more like normal traffic)
        if stealth > 0.5:
            normal_state = self._generate_normal_traffic()
            blend_factor = stealth - 0.5  # 0.0 to 0.5
            state = (1 - blend_factor) * state + blend_factor * normal_state
            
        return state
    
    def _modify_attack_features(self, base_state, attack_type, intensity, stealth):
        """Modify attack features based on intensity and stealth."""
        modified_state = base_state.copy()
        
        # Apply intensity modifier (amplify attack features)
        if attack_type == "dos":
            # Amplify DoS-specific features
            modified_state[4] *= (1 + intensity)  # src_bytes
            modified_state[22] *= (1 + intensity)  # count
            modified_state[23] *= (1 + intensity)  # srv_count
            
        elif attack_type == "probe":
            # Amplify probe-specific features
            modified_state[22] *= (1 + intensity)  # count
            modified_state[24] *= (1 + intensity)  # serror_rate
            
        elif attack_type == "r2l":
            # Amplify R2L-specific features
            modified_state[5] *= (1 + intensity)  # dst_bytes
            modified_state[10] *= (1 + intensity)  # failed_logins
            
        elif attack_type == "u2r":
            # Amplify U2R-specific features
            modified_state[9] *= (1 + intensity)  # hot
            modified_state[12] *= (1 + intensity)  # num_compromised
            
        # Apply stealth modifier
        if stealth > 0.3:
            normal_state = self._generate_normal_traffic()
            blend_factor = stealth * 0.7  # Scale stealth effect
            modified_state = (1 - blend_factor) * modified_state + blend_factor * normal_state
            
        return modified_state
    
    def get_attack_success_rate(self):
        """Get the success rate of attacks."""
        attack_count = sum(1 for a in self.attack_history if a['attack_type'] != 'normal')
        if attack_count == 0:
            return 0.0
        return self.metrics['successful_attacks'] / attack_count
    
    def get_detection_rate(self):
        """Get the detection rate of the IDS."""
        attack_count = sum(1 for a in self.attack_history if a['attack_type'] != 'normal')
        if attack_count == 0:
            return 0.0
        return self.metrics['detected_attacks'] / attack_count
    
    def get_metrics_summary(self):
        """Get a summary of metrics."""
        attack_count = sum(1 for a in self.attack_history if a['attack_type'] != 'normal')
        normal_count = sum(1 for a in self.attack_history if a['attack_type'] == 'normal')
        
        # Avoid division by zero
        attack_success_rate = self.metrics['successful_attacks'] / attack_count if attack_count > 0 else 0
        detection_rate = self.metrics['detected_attacks'] / attack_count if attack_count > 0 else 0
        false_positive_rate = self.metrics['false_positives'] / normal_count if normal_count > 0 else 0
        
        return {
            'attack_count': attack_count,
            'normal_count': normal_count,
            'successful_attacks': self.metrics['successful_attacks'],
            'detected_attacks': self.metrics['detected_attacks'],
            'false_positives': self.metrics['false_positives'],
            'false_negatives': self.metrics['false_negatives'],
            'attack_success_rate': attack_success_rate,
            'detection_rate': detection_rate,
            'false_positive_rate': false_positive_rate,
        }

# Utility function to create the environment
def make_ids_gym_env(ids_model_path=None, norm_params_path=None, real_data_path=None, render_mode=None):
    """Utility function to create the IDS gym environment."""
    env = NetworkAttackSimulatorEnv(
        ids_model_path=ids_model_path,
        norm_params_path=norm_params_path,
        real_data_path=real_data_path,
        render_mode=render_mode
    )
    
    # Store paths as attributes for easier access in wrappers
    env.ids_model_path = ids_model_path
    env.norm_params_path = norm_params_path
    env.real_data_path = real_data_path
    
    return env

# Example usage
if __name__ == "__main__":
    # Parse command line arguments
    import argparse
    
    parser = argparse.ArgumentParser(description="Network Attack Simulator for DeepIDS")
    parser.add_argument("--model", type=str, default="models/best_fast_model.h5",
                      help="Path to trained model")
    parser.add_argument("--norm-params", type=str, default="models/normalization_params.json",
                      help="Path to normalization parameters")
    parser.add_argument("--real-data", type=str, default="data/validation_data.json",
                      help="Path to real network data")
    parser.add_argument("--episodes", type=int, default=10,
                      help="Number of episodes to run")
    parser.add_argument("--steps", type=int, default=100,
                      help="Steps per episode")
    parser.add_argument("--render", action="store_true",
                      help="Render environment")
    
    args = parser.parse_args()
    
    # Create environment
    env = make_ids_gym_env(
        ids_model_path=args.model,
        norm_params_path=args.norm_params,
        real_data_path=args.real_data,
        render_mode="human" if args.render else None
    )
    
    # Run random agent
    logger.info(f"Running {args.episodes} episodes with {args.steps} steps each")
    
    for episode in range(args.episodes):
        obs, _ = env.reset()
        total_reward = 0
        
        for step in range(args.steps):
            # Sample random action
            action = {
                'attack_type': env.action_space['attack_type'].sample(),
                'intensity': env.action_space['intensity'].sample(),
                'stealth': env.action_space['stealth'].sample(),
            }
            
            # Take action
            obs, reward, terminated, truncated, info = env.step(action)
            total_reward += reward
            
            if terminated or truncated:
                break
        
        # Print episode summary
        metrics = env.get_metrics_summary()
        logger.info(f"Episode {episode+1} - Reward: {total_reward:.2f}")
        logger.info(f"  Attacks: {metrics['attack_count']}, Successful: {metrics['successful_attacks']}")
        logger.info(f"  Detection Rate: {metrics['detection_rate']:.2f}, False Positive Rate: {metrics['false_positive_rate']:.2f}")
        
    logger.info("Simulation complete") 