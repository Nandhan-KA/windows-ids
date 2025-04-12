#!/usr/bin/env python
"""
Train an RL attack agent to generate effective attacks against DeepIDS.
Uses stable-baselines3 to implement PPO for attack optimization.
This version uses Gym directly for full compatibility with stable-baselines3.
"""

import os
import sys

# Add parent directory to path for imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

import time
import json
import logging
import argparse
import numpy as np
import tensorflow as tf
import matplotlib.pyplot as plt
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("deepids.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("DeepIDS-AttackAgent")

# Import stable-baselines3
try:
    from stable_baselines3 import PPO, A2C
    from stable_baselines3.common.env_util import make_vec_env
    from stable_baselines3.common.evaluation import evaluate_policy
    from stable_baselines3.common.monitor import Monitor
    from stable_baselines3.common.callbacks import EvalCallback
    import gym
    from gym import spaces
except ImportError:
    logger.error("stable-baselines3 is not installed. Please install it with:")
    logger.error("pip install stable-baselines3[extra] gym")
    sys.exit(1)
    
# Import tensorflow and other dependencies
try:
    import tensorflow as tf
    from tensorflow.keras.models import load_model
except ImportError:
    logger.error("TensorFlow is not installed. Please install it with:")
    logger.error("pip install tensorflow")
    sys.exit(1)

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
    metadata = {'render.modes': ['human', 'ansi']}
    
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
        
        # Store paths
        self.ids_model_path = ids_model_path
        self.norm_params_path = norm_params_path
        self.real_data_path = real_data_path
        
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
        
    def reset(self):
        """Reset the environment to initial state."""
        # Reset step counter
        self.current_step = 0
        
        # Generate initial state (normal traffic)
        self.state = self._generate_normal_traffic()
        
        # Reset attack history
        self.attack_history = []
        
        # Return initial observation
        return self.state
    
    def step(self, action):
        """
        Take a step in the environment with the given action.
        
        Args:
            action: Dict with keys 'attack_type', 'intensity', 'stealth'
            
        Returns:
            observation: New state after action
            reward: Reward for the action
            done: Whether the episode is done
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
        prediction = 0.0
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
        done = self.current_step >= self.max_steps
        
        # Compile info
        info = {
            'attack_type': attack_type,
            'intensity': intensity,
            'stealth': stealth,
            'detected': detected if self.ids_model else None,
            'is_attack': is_attack,
            'metrics': self.metrics.copy(),
            'prediction': prediction
        }
        
        # Render if mode is set
        if self.render_mode == 'human':
            self.render()
        
        return self.state, reward, done, info
    
    def render(self, mode='human'):
        """Render the environment."""
        if mode in ['human', 'ansi']:
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

class AttackEnvWrapper(gym.Wrapper):
    """
    Wrapper for the NetworkAttackSimulatorEnv to make it compatible with stable-baselines3.
    Simplifies the Dict action space to a simpler Box action space.
    """
    def __init__(self, env):
        super(AttackEnvWrapper, self).__init__(env)
        
        # Define a simpler action space (3 values):
        # - attack_type: 0 to 4 (normalized to 0-1)
        # - intensity: 0 to 1
        # - stealth: 0 to 1
        self.action_space = spaces.Box(
            low=0, high=1, shape=(3,), dtype=np.float32
        )
        
    def step(self, action):
        """
        Map the simplified action to the complex action space expected by the environment.
        action[0]: attack type (0-1 normalized to 0-4)
        action[1]: intensity (0-1)
        action[2]: stealth (0-1)
        """
        # Map continuous action[0] to discrete attack type
        attack_type = min(int(action[0] * len(ATTACK_TYPES)), len(ATTACK_TYPES) - 1)
        
        # Create the action dictionary expected by the environment
        env_action = {
            'attack_type': attack_type,
            'intensity': np.array([action[1]], dtype=np.float32),
            'stealth': np.array([action[2]], dtype=np.float32)
        }
        
        # Call the environment's step function
        obs, reward, done, info = self.env.step(env_action)
        
        return obs, reward, done, info

def make_ids_gym_env(ids_model_path=None, norm_params_path=None, real_data_path=None, render_mode=None):
    """Utility function to create the IDS gym environment."""
    env = NetworkAttackSimulatorEnv(
        ids_model_path=ids_model_path,
        norm_params_path=norm_params_path,
        real_data_path=real_data_path,
        render_mode=render_mode
    )
    return env

def create_attack_agent_env(ids_model_path, norm_params_path, real_data_path=None, monitor_dir=None):
    """
    Create and configure the environment for the attack agent.
    
    Args:
        ids_model_path: Path to trained IDS model
        norm_params_path: Path to normalization parameters
        real_data_path: Path to real data
        monitor_dir: Directory to save monitoring logs
        
    Returns:
        env: Configured gym environment
    """
    # Create the environment
    env = make_ids_gym_env(
        ids_model_path=ids_model_path,
        norm_params_path=norm_params_path,
        real_data_path=real_data_path
    )
    
    # Apply wrapper to simplify action space
    env = AttackEnvWrapper(env)
    
    # Apply monitoring wrapper if needed
    if monitor_dir:
        os.makedirs(monitor_dir, exist_ok=True)
        env = Monitor(env, monitor_dir)
    
    return env

def train_attack_agent(env, total_timesteps=50000, algorithm="PPO", save_dir="models"):
    """
    Train a reinforcement learning agent to generate effective attacks.
    
    Args:
        env: Training environment
        total_timesteps: Total number of training timesteps
        algorithm: RL algorithm to use ('PPO', 'A2C', or 'DQN')
        save_dir: Directory to save trained models
        
    Returns:
        model: Trained RL model
    """
    # Create save directory if it doesn't exist
    os.makedirs(save_dir, exist_ok=True)
    
    # Create logs directory for tensorboard
    log_dir = os.path.join(save_dir, "attack_agent_logs")
    os.makedirs(log_dir, exist_ok=True)
    
    # Select algorithm
    if algorithm == "PPO":
        model = PPO(
            "MlpPolicy",
            env,
            verbose=1,
            tensorboard_log=log_dir,
            learning_rate=3e-4,
            n_steps=2048,
            batch_size=64,
            n_epochs=10,
            gamma=0.99,
            gae_lambda=0.95,
            clip_range=0.2
        )
    elif algorithm == "A2C":
        model = A2C(
            "MlpPolicy",
            env,
            verbose=1,
            tensorboard_log=log_dir,
            learning_rate=7e-4,
            n_steps=5,
            gamma=0.99
        )
    else:
        raise ValueError(f"Unknown algorithm: {algorithm}")
    
    # Setup evaluation callback
    eval_dir = os.path.join(save_dir, "attack_agent_eval")
    os.makedirs(eval_dir, exist_ok=True)
    
    # Create evaluation environment
    eval_env = create_attack_agent_env(
        ids_model_path=env.env.ids_model_path,
        norm_params_path=env.env.norm_params_path,
        real_data_path=None  # Don't use real data for evaluation
    )
    
    # Create callback for evaluation during training
    eval_callback = EvalCallback(
        eval_env,
        best_model_save_path=eval_dir,
        log_path=eval_dir,
        eval_freq=5000,
        deterministic=True,
        render=False
    )
    
    # Train the model
    logger.info(f"Starting training using {algorithm} for {total_timesteps} timesteps")
    start_time = time.time()
    
    model.learn(
        total_timesteps=total_timesteps,
        callback=eval_callback,
        progress_bar=True
    )
    
    training_time = time.time() - start_time
    logger.info(f"Training completed in {training_time:.2f} seconds")
    
    # Save the final model
    model_save_path = os.path.join(save_dir, f"attack_agent_{algorithm.lower()}.zip")
    model.save(model_save_path)
    logger.info(f"Model saved to {model_save_path}")
    
    return model

def evaluate_attack_agent(model, env, n_episodes=10):
    """
    Evaluate a trained attack agent against the IDS.
    
    Args:
        model: Trained RL model
        env: Evaluation environment
        n_episodes: Number of evaluation episodes
        
    Returns:
        metrics: Evaluation metrics dictionary
    """
    logger.info(f"Evaluating attack agent for {n_episodes} episodes")
    
    # Reset metrics tracking
    all_rewards = []
    all_successes = []
    attack_types_used = {k: 0 for k in ATTACK_TYPES.keys()}
    
    # Run episodes
    for episode in range(n_episodes):
        obs = env.reset()
        done = False
        episode_reward = 0
        episode_attacks = 0
        episode_successes = 0
        
        while not done:
            # Get action from model
            action, _ = model.predict(obs, deterministic=True)
            
            # Execute action
            obs, reward, done, info = env.step(action)
            
            # Track metrics
            episode_reward += reward
            
            # Track attack types and success
            if info['is_attack']:
                episode_attacks += 1
                attack_types_used[info['attack_type']] += 1
                
                if info['detected'] is False:  # Explicitly check False to handle None
                    episode_successes += 1
        
        # Calculate success rate for this episode
        success_rate = episode_successes / max(1, episode_attacks) * 100
        
        # Log episode results
        logger.info(f"Episode {episode+1}: Reward={episode_reward:.2f}, " +
                   f"Success Rate={success_rate:.1f}% ({episode_successes}/{episode_attacks})")
        
        all_rewards.append(episode_reward)
        all_successes.append(success_rate)
    
    # Calculate aggregate metrics
    metrics = {
        'mean_reward': np.mean(all_rewards),
        'std_reward': np.std(all_rewards),
        'mean_success_rate': np.mean(all_successes),
        'attack_type_distribution': {k: v / max(1, sum(attack_types_used.values())) 
                                    for k, v in attack_types_used.items()}
    }
    
    # Log overall metrics
    logger.info(f"Evaluation complete:")
    logger.info(f"Mean reward: {metrics['mean_reward']:.2f} ± {metrics['std_reward']:.2f}")
    logger.info(f"Mean success rate: {metrics['mean_success_rate']:.1f}%")
    logger.info(f"Attack type distribution: {metrics['attack_type_distribution']}")
    
    return metrics

def plot_evaluation_results(metrics, save_path=None):
    """Plot evaluation results."""
    plt.figure(figsize=(15, 10))
    
    # Plot attack type distribution
    plt.subplot(1, 2, 1)
    attack_types = list(metrics['attack_type_distribution'].keys())
    attack_freqs = [metrics['attack_type_distribution'][k] for k in attack_types]
    
    plt.bar(attack_types, attack_freqs)
    plt.title('Attack Type Distribution')
    plt.ylabel('Frequency')
    plt.ylim(0, 1)
    
    # Plot success rate
    plt.subplot(1, 2, 2)
    plt.bar(['Success Rate'], [metrics['mean_success_rate']/100])
    plt.title('Attack Success Rate')
    plt.ylabel('Success Rate')
    plt.ylim(0, 1)
    
    plt.tight_layout()
    
    if save_path:
        plt.savefig(save_path)
        logger.info(f"Evaluation plot saved to {save_path}")
    
    plt.close()

def main():
    """Main entry point for attack agent training and evaluation."""
    parser = argparse.ArgumentParser(description="Train an RL agent to attack DeepIDS")
    
    parser.add_argument("--model", type=str, default="models/best_fast_model.h5",
                      help="Path to trained IDS model (default: models/best_fast_model.h5)")
    parser.add_argument("--norm-params", type=str, default="models/normalization_params.json",
                      help="Path to normalization parameters (default: models/normalization_params.json)")
    parser.add_argument("--real-data", type=str, default="data/validation_data.json",
                      help="Path to real data for simulation (default: data/validation_data.json)")
    parser.add_argument("--algorithm", type=str, default="PPO", choices=["PPO", "A2C"],
                      help="RL algorithm to use (default: PPO)")
    parser.add_argument("--timesteps", type=int, default=50000,
                      help="Total training timesteps (default: 50000)")
    parser.add_argument("--eval-episodes", type=int, default=10,
                      help="Number of evaluation episodes (default: 10)")
    parser.add_argument("--save-dir", type=str, default="models",
                      help="Directory to save models (default: models)")
    parser.add_argument("--skip-training", action="store_true",
                      help="Skip training and only run evaluation")
    parser.add_argument("--load-model", type=str, default=None,
                      help="Path to load a pre-trained model for evaluation")
    
    args = parser.parse_args()
    
    # Validate paths
    if not os.path.exists(args.model):
        logger.error(f"IDS model file not found: {args.model}")
        return 1
        
    if not os.path.exists(args.norm_params):
        logger.error(f"Normalization parameters file not found: {args.norm_params}")
        return 1
    
    # Create environment
    env = create_attack_agent_env(
        ids_model_path=args.model,
        norm_params_path=args.norm_params,
        real_data_path=args.real_data,
        monitor_dir=os.path.join(args.save_dir, "attack_agent_monitor")
    )
    
    # Train or load model
    if not args.skip_training and args.load_model is None:
        # Train the attack agent
        model = train_attack_agent(
            env=env,
            total_timesteps=args.timesteps,
            algorithm=args.algorithm,
            save_dir=args.save_dir
        )
    else:
        # Load pre-trained model
        model_path = args.load_model or os.path.join(args.save_dir, f"attack_agent_{args.algorithm.lower()}.zip")
        
        if not os.path.exists(model_path):
            logger.error(f"Pre-trained model not found: {model_path}")
            return 1
            
        logger.info(f"Loading pre-trained model from {model_path}")
        if args.algorithm == "PPO":
            model = PPO.load(model_path, env=env)
        elif args.algorithm == "A2C":
            model = A2C.load(model_path, env=env)
        else:
            logger.error(f"Unsupported algorithm for loading: {args.algorithm}")
            return 1
    
    # Evaluate the agent
    eval_env = create_attack_agent_env(
        ids_model_path=args.model,
        norm_params_path=args.norm_params,
        real_data_path=args.real_data
    )
    
    metrics = evaluate_attack_agent(
        model=model,
        env=eval_env,
        n_episodes=args.eval_episodes
    )
    
    # Plot evaluation results
    plot_path = os.path.join(args.save_dir, "attack_agent_evaluation.png")
    plot_evaluation_results(metrics, save_path=plot_path)
    
    # Save metrics to JSON
    metrics_path = os.path.join(args.save_dir, "attack_agent_metrics.json")
    with open(metrics_path, 'w') as f:
        # Convert NumPy types to Python native types for JSON serialization
        metrics_json = {
            'mean_reward': float(metrics['mean_reward']),
            'std_reward': float(metrics['std_reward']),
            'mean_success_rate': float(metrics['mean_success_rate']),
            'attack_type_distribution': {k: float(v) for k, v in metrics['attack_type_distribution'].items()}
        }
        json.dump(metrics_json, f, indent=4)
    
    logger.info(f"Metrics saved to {metrics_path}")
    logger.info("Attack agent training and evaluation complete")
    return 0

if __name__ == "__main__":
    sys.exit(main()) 