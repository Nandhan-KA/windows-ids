# Reinforcement Learning Formulas for Windows IDS

## Markov Decision Process (MDP) Formulation

The intrusion detection problem is formulated as an MDP with the following components:

- **State space (S)**: Set of all possible system states captured from Windows event logs, network traffic, and system metrics
- **Action space (A)**: Set of possible response actions:
  - No action
  - Block IP
  - Apply rate limiting
  - Redirect to honeypot
  - Generate alert
  - Increase monitoring
  - Block port
  - Block protocol
- **Transition function (P)**: $P(s' | s, a)$ - Probability of transitioning to state $s'$ given current state $s$ and action $a$
- **Reward function (R)**: $R(s, a, s')$ - Reward received after taking action $a$ in state $s$ and transitioning to state $s'$
- **Discount factor (γ)**: Parameter between 0 and 1 that determines the importance of future rewards

## Q-Learning Update Rule

The Q-value update equation:

$$Q(s,a) \leftarrow Q(s,a) + \alpha [r + \gamma \max_{a'} Q(s',a') - Q(s,a)]$$

Where:
- $Q(s,a)$ is the Q-value for state $s$ and action $a$
- $\alpha$ is the learning rate
- $r$ is the immediate reward
- $\gamma$ is the discount factor
- $\max_{a'} Q(s',a')$ is the maximum Q-value for the next state $s'$

## Deep Q-Network (DQN) Loss Function

The DQN is trained by minimizing the following loss function:

$$L(\theta) = \mathbb{E}_{(s,a,r,s') \sim \mathcal{D}} \left[ \left( r + \gamma \max_{a'} Q(s', a'; \theta^-) - Q(s, a; \theta) \right)^2 \right]$$

Where:
- $\theta$ represents the parameters of the online network
- $\theta^-$ represents the parameters of the target network
- $\mathcal{D}$ is the replay buffer containing past experiences

## Experience Replay

The probability of selecting transition $(s_t, a_t, r_t, s_{t+1})$ from the replay buffer:

$$P(t) = \frac{p_t^{\alpha}}{\sum_i p_i^{\alpha}}$$

Where:
- $p_t$ is the priority of transition $t$
- $\alpha$ is a parameter that determines how much prioritization is used

## Epsilon-Greedy Exploration

The probability of selecting action $a$ in state $s$:

$$\pi(a|s) = \begin{cases}
1 - \epsilon + \frac{\epsilon}{|A|}, & \text{if } a = \arg\max_{a'} Q(s,a') \\
\frac{\epsilon}{|A|}, & \text{otherwise}
\end{cases}$$

Where:
- $\epsilon$ is the exploration rate
- $|A|$ is the size of the action space

## Epsilon Decay Schedule

The exploration rate decreases over time according to:

$$\epsilon_t = \epsilon_{min} + (\epsilon_{max} - \epsilon_{min}) \cdot e^{-\lambda \cdot t}$$

Where:
- $\epsilon_{min}$ is the minimum exploration rate
- $\epsilon_{max}$ is the starting exploration rate
- $\lambda$ is the decay rate
- $t$ is the current training step

## Feature Extraction and Normalization

Feature normalization using min-max scaling:

$$x_{norm} = \frac{x - x_{min}}{x_{max} - x_{min}}$$

## Intrusion Detection Metrics

**True Positive Rate (TPR)** / Recall:

$$TPR = \frac{TP}{TP + FN}$$

**False Positive Rate (FPR)**:

$$FPR = \frac{FP}{FP + TN}$$

**Precision**:

$$Precision = \frac{TP}{TP + FP}$$

**F1 Score**:

$$F1 = 2 \cdot \frac{Precision \cdot Recall}{Precision + Recall}$$

**Area Under the ROC Curve (AUC)**:

$$AUC = \int_{0}^{1} TPR(FPR^{-1}(f)) df$$

## DQN Target Network Update

The target network parameters are updated as:

$$\theta^- \leftarrow \tau \theta + (1 - \tau) \theta^-$$

Where:
- $\tau$ is the update rate (often set to 1 for hard updates in basic DQN)
- $\theta$ are the parameters of the online network
- $\theta^-$ are the parameters of the target network 