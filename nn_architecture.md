# Neural Network Architecture for Windows IDS

## Overview

Our Windows Intrusion Detection System (IDS) uses a Deep Q-Network (DQN) architecture to learn optimal defense strategies against various cyber threats. The neural network takes system state information as input and outputs Q-values for each possible action.

## Input Layer

The input layer processes a feature vector of dimension `n`, where `n` represents the number of features extracted from Windows event logs, network traffic patterns, and system metrics. Key features include:

- Windows Event Log features (security events, authentication attempts, etc.)
- Network traffic features (packet counts, connection statistics, etc.)
- System resource metrics (CPU usage, memory consumption, etc.)
- Process-related features (unusual process creations, process relationships)
- Registry and file system access patterns

## Hidden Layers

The neural network consists of multiple fully connected (dense) layers:

1. **First Hidden Layer**:
   - 256 neurons
   - ReLU activation function
   - Batch normalization
   - Dropout rate: 0.3

2. **Second Hidden Layer**:
   - 128 neurons
   - ReLU activation function
   - Batch normalization
   - Dropout rate: 0.3

3. **Third Hidden Layer**:
   - 64 neurons
   - ReLU activation function
   - Dropout rate: 0.2

## Output Layer

The output layer consists of `m` neurons, where `m` is the number of possible actions the IDS can take. Each neuron represents the Q-value for a specific action:

- No action
- Block IP
- Apply rate limiting
- Redirect to honeypot
- Generate alert
- Increase monitoring
- Block port
- Block protocol

The output layer uses a linear activation function to estimate Q-values without bounds.

## Network Diagram

```
Input Layer [n] → FC Layer (256) → ReLU → BatchNorm → Dropout(0.3) →
                   FC Layer (128) → ReLU → BatchNorm → Dropout(0.3) →
                   FC Layer (64)  → ReLU → Dropout(0.2) →
                   Output Layer [m]
```

## Hyperparameters

- **Learning Rate**: 0.0005
- **Batch Size**: 64
- **Target Network Update Frequency**: Every 1000 steps
- **Discount Factor (γ)**: 0.99
- **Epsilon (exploration rate) Initial**: 1.0
- **Epsilon Minimum**: 0.01
- **Epsilon Decay Rate**: 0.995
- **Replay Buffer Size**: 100,000 experiences
- **Loss Function**: Mean Squared Error (MSE)
- **Optimizer**: Adam

## Training Process

1. **Experience Collection**: The agent interacts with the Windows environment, collecting experiences in the form of (state, action, reward, next_state) tuples.

2. **Experience Replay**: Experiences are stored in a replay buffer and randomly sampled during training to break correlations between consecutive samples.

3. **Loss Calculation**: The loss is calculated as the MSE between the predicted Q-values and the target Q-values:
   
   Target Q-value = reward + γ * max(Q(next_state))

4. **Gradient Descent**: The Adam optimizer updates the network weights to minimize the loss function.

5. **Target Network Updates**: A separate target network is maintained and periodically updated to stabilize training.

## Feature Preprocessing

Before feeding data into the neural network:

1. **Normalization**: All numerical features are normalized to [0,1] range using min-max scaling.
2. **Categorical Encoding**: Categorical features are one-hot encoded.
3. **Temporal Features**: Time-based features are extracted to capture temporal patterns in events.
4. **Feature Selection**: A feature importance analysis is performed to select the most relevant features for intrusion detection.

## Performance Considerations

- The architecture is designed to balance detection accuracy with computational efficiency.
- Batch normalization layers help stabilize training and allow for higher learning rates.
- Dropout layers are included to prevent overfitting, especially important when training data may have imbalanced attack scenarios.
- The model is periodically evaluated on a held-out validation set to monitor performance. 