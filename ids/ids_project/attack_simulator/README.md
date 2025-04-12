# DeepIDS Attack Simulator

This module provides tools to test and evaluate your DeepIDS system by simulating network attacks.

## Components

### 1. Network Attack Simulator Environment (`ids_gym.py`)

A Gymnasium (formerly OpenAI Gym) environment that simulates various network attacks:

- DoS (Denial of Service)
- Probe (Port scanning, vulnerability scanning)
- R2L (Remote to Local)
- U2R (User to Root)

Features:
- Customizable attack parameters (intensity, stealth)
- Can use real network data for more realistic simulations
- Provides metrics on attack success rates and detection rates

### 2. Reinforcement Learning Attack Agent (`train_attack_agent.py`)

Trains an RL agent to find weaknesses in the IDS:

- Uses PPO or A2C algorithms from stable-baselines3
- Learns to generate attacks that evade detection
- Provides evaluation metrics and visualizations

### 3. Visual Attack Simulator (`run_attack_simulation.py`)

Interactive visualization of attacks against the IDS:

- Shows real-time detection confidence
- Displays attack types and success rates
- Visualizes attack pattern distributions
- Can save simulations as video files

## Usage

### Basic Simulation

Run a simulation with random attacks to test your IDS:

```
python ids_gym.py --model ../models/best_fast_model.h5 --episodes 10 --steps 100 --render
```

### Training an Attack Agent

Train a reinforcement learning agent to generate effective attacks:

```
python train_attack_agent.py --model ../models/best_fast_model.h5 --algorithm PPO --timesteps 50000
```

### Visual Simulation

Run a visual simulation with or without a trained attack agent:

```
python run_attack_simulation.py --model ../models/best_fast_model.h5 --steps 200
```

With trained agent:
```
python run_attack_simulation.py --model ../models/best_fast_model.h5 --attack-agent ../models/attack_agent_ppo.zip --steps 200
```

## Improving Your IDS

The attack simulator can help improve your IDS in several ways:

1. **Identify vulnerabilities**: Find attack patterns that evade detection
2. **Test detection threshold**: Optimize threshold for better balance of sensitivity vs. false positives
3. **Generate adversarial examples**: Use successful attacks to augment training data
4. **Benchmark different models**: Compare multiple IDS models against the same attack patterns

## Requirements

- gymnasium>=0.28.1
- stable-baselines3[extra]>=2.0.0
- tensorflow>=2.5.0
- numpy>=1.19.0
- matplotlib>=3.3.0
- pandas>=1.3.0 