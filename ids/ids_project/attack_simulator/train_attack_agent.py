#!/usr/bin/env python
"""
Train an RL attack agent to generate effective attacks against DeepIDS.
Uses stable-baselines3 to implement PPO for attack optimization.
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

# Import the attack simulator environment
from ids_project.attack_simulator.ids_gym import make_ids_gym_env, ATTACK_TYPES, FEATURE_NAMES

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
    from stable_baselines3 import PPO, A2C, DQN
    from stable_baselines3.common.env_util import make_vec_env
    from stable_baselines3.common.evaluation import evaluate_policy
    from stable_baselines3.common.monitor import Monitor
    from stable_baselines3.common.callbacks import EvalCallback, StopTrainingOnRewardThreshold
    import gym
    from gym import spaces
except ImportError:
    logger.error("stable-baselines3 is not installed. Please install it with:")
    logger.error("pip install stable-baselines3[extra] gymnasium")
    sys.exit(1)

# Add Gym-Gymnasium compatibility
class GymCompatibilityWrapper(gym.Wrapper):
    """
    A wrapper to make Gymnasium environments compatible with gym interfaces
    expected by stable-baselines3.
    """
    def __init__(self, env):
        # Don't call super constructor (gym.Wrapper.__init__) to avoid assertion errors
        self.env = env
        self.action_space = env.action_space
        self.observation_space = env.observation_space
        
        # Set reward range if it exists, otherwise use default
        self.reward_range = getattr(env, 'reward_range', (-float('inf'), float('inf')))
        
        # Set metadata if it exists, otherwise use default
        self.metadata = getattr(env, 'metadata', {'render.modes': []})
        
    def reset(self, **kwargs):
        obs, info = self.env.reset(**kwargs)
        return obs
        
    def step(self, action):
        obs, reward, terminated, truncated, info = self.env.step(action)
        # Convert to gym style: obs, reward, done, info
        done = terminated or truncated
        return obs, reward, done, info

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
        obs, reward, terminated, truncated, info = self.env.step(env_action)
        
        return obs, reward, terminated, truncated, info

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
    
    # Apply Gym-Gymnasium compatibility wrapper
    env = GymCompatibilityWrapper(env)
    
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
    elif algorithm == "DQN":
        # Note: DQN works with discrete action spaces, so we'd need to further modify
        # the environment to use DQN. Here, we'll just raise an error.
        raise ValueError("DQN is not supported for this environment due to continuous action space.")
    else:
        raise ValueError(f"Unknown algorithm: {algorithm}")
    
    # Setup evaluation callback
    eval_dir = os.path.join(save_dir, "attack_agent_eval")
    os.makedirs(eval_dir, exist_ok=True)
    
    # Create evaluation environment
    # Try to extract the original parameters if env is wrapped
    ids_model_path = None
    norm_params_path = None
    real_data_path = None
    
    # Try to get paths from original environment if it's wrapped
    if hasattr(env, 'env') and hasattr(env.env, 'ids_model_path'):
        ids_model_path = env.env.ids_model_path
        norm_params_path = env.env.norm_params_path if hasattr(env.env, 'norm_params_path') else None
    elif hasattr(env, 'ids_model_path'):
        ids_model_path = env.ids_model_path
        norm_params_path = env.norm_params_path if hasattr(env, 'norm_params_path') else None
    
    eval_env = create_attack_agent_env(
        ids_model_path=ids_model_path,
        norm_params_path=norm_params_path,
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
        # Handle both gym and gymnasium style reset
        if hasattr(env, 'env') and hasattr(env.env, 'reset'):
            # If using gymnasium wrapper
            obs = env.reset()
        else:
            # Standard gym reset
            obs, _ = env.reset()
            
        done = False
        episode_reward = 0
        episode_attacks = 0
        episode_successes = 0
        
        while not done:
            # Get action from model
            action, _ = model.predict(obs, deterministic=True)
            
            # Execute action
            if hasattr(env, 'env') and hasattr(env.env, 'step'):
                # If using gymnasium wrapper
                obs, reward, done, info = env.step(action)
            else:
                # Standard gym step
                obs, reward, terminated, truncated, info = env.step(action)
                done = terminated or truncated
            
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