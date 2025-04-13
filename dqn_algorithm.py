"""
Deep Q-Network (DQN) Algorithm for Windows Intrusion Detection System
This is a pseudocode implementation that outlines the reinforcement learning approach
"""

import numpy as np
import tensorflow as tf
from collections import deque
import random

class IDSEnvironment:
    """Environment that models the Windows system state and security events"""
    
    def __init__(self, feature_dimension=41):
        self.feature_dimension = feature_dimension
        self.current_state = None
        self.reset()
        
    def reset(self):
        """Reset the environment to initial state"""
        # Initialize with random or default state
        self.current_state = np.zeros(self.feature_dimension)
        return self.current_state
        
    def step(self, action):
        """
        Process the action and return new state, reward, and done flag
        
        Actions:
        0 - No action
        1 - Block IP
        2 - Apply rate limiting
        3 - Redirect to honeypot
        4 - Generate alert
        5 - Increase monitoring
        6 - Block port
        7 - Block protocol
        """
        # In real system, this would interact with Windows security controls
        # Here simplified as a simple state transition model
        
        next_state = self._get_next_state(action)
        reward = self._calculate_reward(action)
        done = False  # Episodes don't terminate in continuous monitoring
        
        self.current_state = next_state
        return next_state, reward, done, {}
    
    def _get_next_state(self, action):
        """Simulate next state based on current state and action"""
        # In production: would read real system metrics and network behavior
        return np.random.rand(self.feature_dimension)
    
    def _calculate_reward(self, action):
        """Calculate reward based on action effectiveness"""
        # In production: would be based on true/false positives/negatives
        # Simple simulation for pseudocode
        if action == 0 and np.mean(self.current_state) < 0.3:  # No threat, no action
            return 1.0
        elif action > 0 and np.mean(self.current_state) > 0.7:  # Threat detected, action taken
            return 2.0
        elif action > 0 and np.mean(self.current_state) < 0.3:  # False positive
            return -1.0
        elif action == 0 and np.mean(self.current_state) > 0.7:  # Missed detection
            return -2.0
        return 0.0


class ReplayBuffer:
    """Experience replay buffer for storing and sampling transitions"""
    
    def __init__(self, capacity=10000):
        self.buffer = deque(maxlen=capacity)
    
    def add(self, state, action, reward, next_state, done):
        """Add experience to buffer"""
        self.buffer.append((state, action, reward, next_state, done))
    
    def sample(self, batch_size):
        """Sample random batch of experiences"""
        batch = random.sample(self.buffer, min(batch_size, len(self.buffer)))
        states, actions, rewards, next_states, dones = zip(*batch)
        return np.array(states), np.array(actions), np.array(rewards), np.array(next_states), np.array(dones)
    
    def __len__(self):
        return len(self.buffer)


class DQNAgent:
    """DQN Agent for intrusion detection and response"""
    
    def __init__(self, state_size, action_size, learning_rate=0.001, gamma=0.95, 
                 epsilon_max=1.0, epsilon_min=0.01, epsilon_decay=0.995):
        self.state_size = state_size
        self.action_size = action_size
        
        # Hyperparameters
        self.learning_rate = learning_rate  # Learning rate
        self.gamma = gamma                  # Discount factor
        self.epsilon = epsilon_max          # Exploration rate
        self.epsilon_min = epsilon_min      # Minimum exploration rate
        self.epsilon_max = epsilon_max      # Maximum exploration rate
        self.epsilon_decay = epsilon_decay  # Decay rate for exploration
        
        # Create main and target networks
        self.main_network = self._build_network()
        self.target_network = self._build_network()
        self._update_target_network()
        
        # Experience replay buffer
        self.replay_buffer = ReplayBuffer()
        
        # Training parameters
        self.batch_size = 64
        self.train_start = 1000
        self.update_target_frequency = 1000
        self.train_step = 0
    
    def _build_network(self):
        """Build the DQN neural network model"""
        model = tf.keras.Sequential([
            tf.keras.layers.Dense(64, activation='relu', input_shape=(self.state_size,)),
            tf.keras.layers.Dense(64, activation='relu'),
            tf.keras.layers.Dense(self.action_size, activation='linear')
        ])
        model.compile(loss='mse', optimizer=tf.keras.optimizers.Adam(lr=self.learning_rate))
        return model
    
    def _update_target_network(self):
        """Copy weights from main network to target network"""
        self.target_network.set_weights(self.main_network.get_weights())
    
    def select_action(self, state):
        """Select action using epsilon-greedy policy"""
        if np.random.rand() <= self.epsilon:
            return random.randrange(self.action_size)
        
        q_values = self.main_network.predict(state.reshape(1, -1))[0]
        return np.argmax(q_values)
    
    def store_experience(self, state, action, reward, next_state, done):
        """Store experience in replay buffer"""
        self.replay_buffer.add(state, action, reward, next_state, done)
    
    def train(self):
        """Train the DQN using experience replay"""
        if len(self.replay_buffer) < self.train_start:
            return
        
        # Sample random batch from replay buffer
        states, actions, rewards, next_states, dones = self.replay_buffer.sample(self.batch_size)
        
        # Calculate target Q values
        target_q_values = self.main_network.predict(states)
        next_q_values = self.target_network.predict(next_states)
        max_next_q_values = np.max(next_q_values, axis=1)
        
        # Update Q-values with Bellman equation
        for i in range(self.batch_size):
            if dones[i]:
                target_q_values[i, actions[i]] = rewards[i]
            else:
                target_q_values[i, actions[i]] = rewards[i] + self.gamma * max_next_q_values[i]
        
        # Train the model
        self.main_network.fit(states, target_q_values, epochs=1, verbose=0)
        
        # Update target network periodically
        self.train_step += 1
        if self.train_step % self.update_target_frequency == 0:
            self._update_target_network()
        
        # Decay exploration rate
        if self.epsilon > self.epsilon_min:
            self.epsilon *= self.epsilon_decay


def feature_extraction(raw_data):
    """
    Extract and normalize features from raw Windows system and network data
    
    Parameters:
    - raw_data: Dictionary containing Windows system metrics, connections, processes
    
    Returns:
    - Normalized feature vector suitable for the DQN input
    """
    # Extract relevant features (in production would use real data)
    features = np.zeros(41)
    
    # Example features from network connections
    # connection_duration, protocol_type, src_bytes, dst_bytes, etc.
    
    # Example features from process behavior
    # CPU usage, memory usage, disk IO, network IO, etc.
    
    # Normalize features using min-max scaling
    features_normalized = (features - features.min()) / (features.max() - features.min() + 1e-10)
    
    return features_normalized


def main():
    """Main function to demonstrate the DQN training process"""
    # Initialize environment and agent
    env = IDSEnvironment(feature_dimension=41)
    agent = DQNAgent(state_size=41, action_size=8)
    
    # Training parameters
    num_episodes = 1000
    max_steps = 500
    
    # Track rewards for evaluation
    episode_rewards = []
    
    # Training loop
    for episode in range(num_episodes):
        state = env.reset()
        total_reward = 0
        
        for step in range(max_steps):
            # Select action
            action = agent.select_action(state)
            
            # Take action and observe next state and reward
            next_state, reward, done, _ = env.step(action)
            
            # Store experience in replay buffer
            agent.store_experience(state, action, reward, next_state, done)
            
            # Train agent
            agent.train()
            
            # Update state and reward
            state = next_state
            total_reward += reward
            
            if done:
                break
        
        # Track episode reward
        episode_rewards.append(total_reward)
        
        # Print progress
        if episode % 10 == 0:
            print(f"Episode: {episode}, Reward: {total_reward}, Epsilon: {agent.epsilon:.4f}")
    
    # Save the trained model for deployment
    agent.main_network.save("ids_dqn_model.h5")
    
    # Evaluate model performance
    print("Training completed.")
    print(f"Average reward over last 100 episodes: {np.mean(episode_rewards[-100:])}")


if __name__ == "__main__":
    main() 