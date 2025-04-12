import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, Progress, Space, Table, Tag, Tabs, Form, Input, InputNumber, Select, Switch, Alert, Statistic, Row, Col, Divider, Typography } from 'antd';
import { 
  LineChartOutlined, 
  RocketOutlined, 
  PauseCircleOutlined, 
  PlayCircleOutlined, 
  SaveOutlined, 
  LoadingOutlined,
  CheckCircleOutlined,
  ExperimentOutlined,
  SendOutlined,
  BrainOutlined
} from '@ant-design/icons';
import { Line } from '@ant-design/plots';
import axios from 'axios';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

const API_URL = 'http://localhost:5000/api';

// Action types defined to match backend
const ACTIONS: Record<number, string> = {
  0: "No Action",
  1: "Block IP",
  2: "Rate Limit",
  3: "Redirect to Honeypot",
  4: "Alert Only",
  5: "Increase Monitoring",
  6: "Block Port",
  7: "Block Protocol"
};

interface AttackType {
  value: string;
  label: string;
}

const attackTypes: AttackType[] = [
  { value: 'dos', label: 'Denial of Service' },
  { value: 'probe', label: 'Probe/Scan' },
  { value: 'r2l', label: 'Remote to Local' },
  { value: 'u2r', label: 'User to Root' },
];

interface TrainingStatus {
  status: string;
  episodes_completed: number;
  avg_reward: number;
  epsilon: number;
  memory_size: number;
}

interface TrainingHistory {
  episode: number;
  reward: number;
  epsilon: number;
}

interface EvaluationResults {
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  true_positives: number;
  false_positives: number;
  true_negatives: number;
  false_negatives: number;
  results?: Array<{
    episode: number;
    reward: number;
    steps: number;
  }>;
}

interface PredictionResult {
  action: number;
  action_name: string;
  result: string;
}

interface TrainingFormValues {
  episodes: number;
  batchSize: number;
  updateFrequency: number;
  savePath: string;
}

interface EvaluationFormValues {
  episodes: number;
}

const ReinforcementLearning: React.FC = () => {
  // State
  const [isInitialized, setIsInitialized] = useState(false);
  const [trainingStatus, setTrainingStatus] = useState<TrainingStatus>({
    status: 'not_initialized',
    episodes_completed: 0,
    avg_reward: 0,
    epsilon: 1.0,
    memory_size: 0
  });
  const [trainingHistory, setTrainingHistory] = useState<TrainingHistory[]>([]);
  const [evaluationResults, setEvaluationResults] = useState<EvaluationResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modelPath, setModelPath] = useState('models/ids_model.h5');
  const [simulatorPath, setSimulatorPath] = useState('');
  const [predictionFeatures, setPredictionFeatures] = useState<number[]>(Array(41).fill(0));
  const [predictionResult, setPredictionResult] = useState<PredictionResult | null>(null);
  const [activeKey, setActiveKey] = useState('1');

  // Initialize RL system
  const initializeRL = async (loadModel: boolean = false) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(`${API_URL}/rl/initialize`, {
        model_path: loadModel ? modelPath : null,
        use_simulator: !!simulatorPath,
        simulator_path: simulatorPath || null
      });
      
      if (response.data.success) {
        setIsInitialized(true);
        fetchStatus();
      } else {
        setError(response.data.message || 'Failed to initialize RL system');
      }
    } catch (err: any) {
      setError(`Error initializing RL system: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch training status
  const fetchStatus = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/rl/status`);
      setTrainingStatus(response.data);
    } catch (err: any) {
      console.error('Error fetching RL status:', err);
    }
  }, []);

  // Start training
  const startTraining = async (values: TrainingFormValues) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(`${API_URL}/rl/train`, {
        episodes: values.episodes,
        batch_size: values.batchSize,
        update_frequency: values.updateFrequency,
        save_path: values.savePath
      });
      
      if (response.data.success) {
        setActiveKey('2'); // Switch to status tab
        fetchStatus();
      } else {
        setError(response.data.message || 'Failed to start training');
      }
    } catch (err: any) {
      setError(`Error starting training: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Stop training
  const stopTraining = async () => {
    setIsLoading(true);
    
    try {
      await axios.post(`${API_URL}/rl/stop`);
      fetchStatus();
    } catch (err: any) {
      setError(`Error stopping training: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Evaluate the model
  const evaluateModel = async (values: EvaluationFormValues) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(`${API_URL}/rl/evaluate`, {
        episodes: values.episodes
      });
      
      setEvaluationResults(response.data);
    } catch (err: any) {
      setError(`Error evaluating model: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Save the model
  const saveModel = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(`${API_URL}/rl/save`, {
        model_path: modelPath
      });
      
      if (!response.data.success) {
        setError(response.data.message || 'Failed to save model');
      }
    } catch (err: any) {
      setError(`Error saving model: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Load a model
  const loadModel = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(`${API_URL}/rl/load`, {
        model_path: modelPath
      });
      
      if (!response.data.success) {
        setError(response.data.message || 'Failed to load model');
      }
    } catch (err: any) {
      setError(`Error loading model: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Predict action for given state
  const predictAction = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(`${API_URL}/rl/predict`, {
        features: predictionFeatures
      });
      
      setPredictionResult(response.data);
    } catch (err: any) {
      setError(`Error predicting action: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Set a feature value
  const setFeatureValue = (index: number, value: number) => {
    const newFeatures = [...predictionFeatures];
    newFeatures[index] = value;
    setPredictionFeatures(newFeatures);
  };

  // Generate a synthetic attack pattern
  const generateAttackPattern = (attackType: string) => {
    // Generate pattern matching backend's synthetic data
    const newFeatures = Array(41).fill(0);
    
    // Set base values (for all traffic)
    newFeatures[0] = 0.1; // connection_duration
    newFeatures[1] = 0.2; // protocol_type
    newFeatures[2] = 0.3; // service
    
    if (attackType === 'dos') {
      // DoS attack pattern
      newFeatures[0] = 0.05; // Shorter duration
      newFeatures[3] = 0.9;  // High src_bytes
      newFeatures[22] = 0.9; // High count
      newFeatures[23] = 0.9; // High srv_count
      newFeatures[24] = 0.8; // High serror_rate
    } else if (attackType === 'probe') {
      // Probe attack pattern
      newFeatures[0] = 0.02; // Very short duration
      newFeatures[3] = 0.05; // Low src_bytes
      newFeatures[22] = 0.7; // Medium-high count
      newFeatures[29] = 0.8; // High diff_srv_rate
    } else if (attackType === 'r2l') {
      // Remote to Local attack pattern
      newFeatures[0] = 0.4;  // Medium duration
      newFeatures[10] = 0.8; // High num_failed_logins
      newFeatures[11] = 1.0; // logged_in
    } else if (attackType === 'u2r') {
      // User to Root attack pattern
      newFeatures[0] = 0.6;  // Longer duration
      newFeatures[12] = 0.9; // High num_compromised
      newFeatures[13] = 1.0; // root_shell
      newFeatures[15] = 0.8; // High num_root
    } else {
      // Normal traffic
      newFeatures[0] = Math.random() * 0.2;    // Short duration
      newFeatures[3] = Math.random() * 0.3;    // Low-medium src_bytes
      newFeatures[4] = Math.random() * 0.3;    // Low-medium dst_bytes
      newFeatures[28] = 0.7 + Math.random() * 0.3; // High same_srv_rate
    }
    
    setPredictionFeatures(newFeatures);
  };

  // Status polling effect
  useEffect(() => {
    if (isInitialized && trainingStatus.status === 'training') {
      const interval = setInterval(fetchStatus, 2000);
      return () => clearInterval(interval);
    }
  }, [isInitialized, trainingStatus.status, fetchStatus]);

  // Update training history when status changes
  useEffect(() => {
    if (trainingStatus.status === 'training' || trainingStatus.status === 'idle') {
      setTrainingHistory(prev => {
        // Avoid duplicate entries
        if (prev.length > 0 && prev[prev.length - 1].episode === trainingStatus.episodes_completed) {
          return prev;
        }
        
        return [...prev, {
          episode: trainingStatus.episodes_completed,
          reward: trainingStatus.avg_reward,
          epsilon: trainingStatus.epsilon,
        }];
      });
    }
  }, [trainingStatus]);

  // Render status chart
  const renderStatusChart = () => {
    if (trainingHistory.length < 2) {
      return <Alert message="Not enough data for chart" type="info" />;
    }
    
    const config = {
      data: trainingHistory,
      xField: 'episode',
      yField: 'reward',
      point: {
        size: 5,
        shape: 'diamond',
      },
      tooltip: {
        showMarkers: false,
      },
    };
    
    return <Line {...config} />;
  };

  // Render evaluation metrics
  const renderEvaluationMetrics = () => {
    if (!evaluationResults) return null;
    
    const { accuracy, precision, recall, f1_score, true_positives, false_positives, true_negatives, false_negatives } = evaluationResults;
    
    return (
      <Card title="Evaluation Metrics" bordered={false}>
        <Row gutter={16}>
          <Col span={6}>
            <Statistic title="Accuracy" value={accuracy} precision={2} suffix="%" formatter={(value: number) => (value * 100).toFixed(2)} />
          </Col>
          <Col span={6}>
            <Statistic title="Precision" value={precision} precision={2} suffix="%" formatter={(value: number) => (value * 100).toFixed(2)} />
          </Col>
          <Col span={6}>
            <Statistic title="Recall" value={recall} precision={2} suffix="%" formatter={(value: number) => (value * 100).toFixed(2)} />
          </Col>
          <Col span={6}>
            <Statistic title="F1 Score" value={f1_score} precision={2} suffix="%" formatter={(value: number) => (value * 100).toFixed(2)} />
          </Col>
        </Row>
        <Divider />
        <Row gutter={16}>
          <Col span={6}>
            <Statistic title="True Positives" value={true_positives} />
          </Col>
          <Col span={6}>
            <Statistic title="False Positives" value={false_positives} />
          </Col>
          <Col span={6}>
            <Statistic title="True Negatives" value={true_negatives} />
          </Col>
          <Col span={6}>
            <Statistic title="False Negatives" value={false_negatives} />
          </Col>
        </Row>
      </Card>
    );
  };

  return (
    <div className="reinforcement-learning-container">
      <Card 
        title={
          <div>
            <BrainOutlined /> Reinforcement Learning Engine
            <Tag color={isInitialized ? "success" : "error"} style={{ marginLeft: 12 }}>
              {isInitialized ? "Initialized" : "Not Initialized"}
            </Tag>
          </div>
        }
        extra={
          <Space>
            {!isInitialized ? (
              <Button type="primary" onClick={() => initializeRL(false)} loading={isLoading}>
                Initialize
              </Button>
            ) : (
              <Button type="primary" onClick={() => initializeRL(true)} loading={isLoading}>
                Reinitialize
              </Button>
            )}
            <Button onClick={saveModel} disabled={!isInitialized} loading={isLoading}>
              <SaveOutlined /> Save Model
            </Button>
          </Space>
        }
      >
        {error && <Alert message={error} type="error" style={{ marginBottom: 16 }} />}
        
        <Tabs activeKey={activeKey} onChange={setActiveKey}>
          <TabPane tab={<span><RocketOutlined /> Setup & Training</span>} key="1">
            <Row gutter={16}>
              <Col span={12}>
                <Card title="Configuration" bordered={false}>
                  <Form layout="vertical">
                    <Form.Item label="Model Path">
                      <Input 
                        value={modelPath} 
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setModelPath(e.target.value)} 
                        placeholder="models/ids_model.h5"
                      />
                    </Form.Item>
                    <Form.Item label="External Simulator Path (Optional)">
                      <Input 
                        value={simulatorPath} 
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSimulatorPath(e.target.value)} 
                        placeholder="/path/to/simulator.py"
                      />
                    </Form.Item>
                    <Form.Item>
                      <Space>
                        <Button 
                          type="primary" 
                          onClick={() => initializeRL(false)}
                          disabled={isLoading}
                        >
                          Initialize New Agent
                        </Button>
                        <Button 
                          onClick={() => initializeRL(true)}
                          disabled={isLoading || !modelPath}
                        >
                          Load From Model
                        </Button>
                      </Space>
                    </Form.Item>
                  </Form>
                </Card>
              </Col>
              
              <Col span={12}>
                <Card title="Training" bordered={false}>
                  <Form 
                    layout="vertical" 
                    onFinish={startTraining}
                    initialValues={{
                      episodes: 1000,
                      batchSize: 64,
                      updateFrequency: 100,
                      savePath: modelPath
                    }}
                  >
                    <Form.Item label="Number of Episodes" name="episodes">
                      <InputNumber min={10} max={10000} style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item label="Batch Size" name="batchSize">
                      <InputNumber min={16} max={256} style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item label="Update Frequency" name="updateFrequency">
                      <InputNumber min={10} max={500} style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item label="Save Path" name="savePath">
                      <Input placeholder="models/ids_model.h5" />
                    </Form.Item>
                    <Form.Item>
                      <Button 
                        type="primary" 
                        htmlType="submit"
                        icon={<PlayCircleOutlined />}
                        disabled={!isInitialized || trainingStatus.status === 'training' || isLoading}
                      >
                        Start Training
                      </Button>
                    </Form.Item>
                  </Form>
                </Card>
              </Col>
            </Row>
          </TabPane>
          
          <TabPane tab={<span><LineChartOutlined /> Status & Progress</span>} key="2">
            <Row gutter={16}>
              <Col span={8}>
                <Card title="Training Status" bordered={false}>
                  <Statistic
                    title="Status"
                    value={trainingStatus.status === 'training' ? 'Training in Progress' : 'Idle'}
                    valueStyle={{ color: trainingStatus.status === 'training' ? '#1890ff' : '#52c41a' }}
                    prefix={trainingStatus.status === 'training' ? <LoadingOutlined /> : <CheckCircleOutlined />}
                  />
                  <Divider />
                  <Statistic title="Episodes Completed" value={trainingStatus.episodes_completed} />
                  <Statistic title="Average Reward" value={trainingStatus.avg_reward?.toFixed(2) || 0} />
                  <Progress 
                    percent={100 - trainingStatus.epsilon * 100} 
                    status="active" 
                    title="Exploration/Exploitation"
                    format={() => `${(trainingStatus.epsilon * 100).toFixed(1)}% exploration`}
                  />
                  <Divider />
                  <Button 
                    type="primary"
                    danger
                    icon={<PauseCircleOutlined />}
                    disabled={trainingStatus.status !== 'training' || isLoading}
                    onClick={stopTraining}
                    loading={isLoading}
                  >
                    Stop Training
                  </Button>
                </Card>
              </Col>
              
              <Col span={16}>
                <Card title="Training Progress" bordered={false}>
                  {renderStatusChart()}
                </Card>
              </Col>
            </Row>
          </TabPane>
          
          <TabPane tab={<span><ExperimentOutlined /> Evaluation</span>} key="3">
            <Row gutter={16}>
              <Col span={8}>
                <Card title="Run Evaluation" bordered={false}>
                  <Form 
                    layout="vertical" 
                    onFinish={evaluateModel}
                    initialValues={{
                      episodes: 10
                    }}
                  >
                    <Form.Item label="Evaluation Episodes" name="episodes">
                      <InputNumber min={5} max={100} style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item>
                      <Button 
                        type="primary" 
                        htmlType="submit"
                        disabled={!isInitialized || isLoading}
                        loading={isLoading}
                      >
                        Run Evaluation
                      </Button>
                    </Form.Item>
                  </Form>
                </Card>
              </Col>
              
              <Col span={16}>
                {renderEvaluationMetrics()}
              </Col>
            </Row>
            
            {evaluationResults?.results && (
              <Card title="Evaluation Results" bordered={false} style={{ marginTop: 16 }}>
                <Table 
                  dataSource={evaluationResults.results.map((r: any, i: number) => ({ ...r, key: i }))} 
                  columns={[
                    { title: 'Episode', dataIndex: 'episode', key: 'episode' },
                    { title: 'Reward', dataIndex: 'reward', key: 'reward', render: (val: number) => val.toFixed(2) },
                    { title: 'Steps', dataIndex: 'steps', key: 'steps' },
                  ]} 
                  pagination={{ pageSize: 5 }}
                />
              </Card>
            )}
          </TabPane>
          
          <TabPane tab={<span><SendOutlined /> Prediction Testing</span>} key="4">
            <Row gutter={16}>
              <Col span={10}>
                <Card title="Generate Test Data" bordered={false}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Button 
                      onClick={() => generateAttackPattern('normal')}
                      style={{ width: '100%' }}
                    >
                      Generate Normal Traffic
                    </Button>
                    
                    {attackTypes.map(type => (
                      <Button 
                        key={type.value}
                        onClick={() => generateAttackPattern(type.value)}
                        style={{ width: '100%' }}
                      >
                        Generate {type.label} Attack
                      </Button>
                    ))}
                  </Space>
                  
                  <Divider>Or</Divider>
                  
                  <Text>Manually adjust important features:</Text>
                  <Form layout="vertical">
                    <Form.Item label="Connection Duration (feature 0)">
                      <InputNumber 
                        min={0} 
                        max={1} 
                        step={0.1}
                        value={predictionFeatures[0]}
                        onChange={(val: number | null) => setFeatureValue(0, val || 0)}
                        style={{ width: '100%' }}
                      />
                    </Form.Item>
                    <Form.Item label="Source Bytes (feature 3)">
                      <InputNumber 
                        min={0} 
                        max={1} 
                        step={0.1}
                        value={predictionFeatures[3]}
                        onChange={(val: number | null) => setFeatureValue(3, val || 0)}
                        style={{ width: '100%' }}
                      />
                    </Form.Item>
                    <Form.Item label="Destination Bytes (feature 4)">
                      <InputNumber 
                        min={0} 
                        max={1} 
                        step={0.1}
                        value={predictionFeatures[4]}
                        onChange={(val: number | null) => setFeatureValue(4, val || 0)}
                        style={{ width: '100%' }}
                      />
                    </Form.Item>
                    <Form.Item label="Connection Count (feature 22)">
                      <InputNumber 
                        min={0} 
                        max={1} 
                        step={0.1}
                        value={predictionFeatures[22]}
                        onChange={(val: number | null) => setFeatureValue(22, val || 0)}
                        style={{ width: '100%' }}
                      />
                    </Form.Item>
                    <Form.Item label="Error Rate (feature 24)">
                      <InputNumber 
                        min={0} 
                        max={1} 
                        step={0.1}
                        value={predictionFeatures[24]}
                        onChange={(val: number | null) => setFeatureValue(24, val || 0)}
                        style={{ width: '100%' }}
                      />
                    </Form.Item>
                  </Form>
                </Card>
              </Col>
              
              <Col span={14}>
                <Card 
                  title="Prediction Test" 
                  bordered={false}
                  extra={
                    <Button 
                      type="primary"
                      onClick={predictAction}
                      disabled={!isInitialized || isLoading}
                      loading={isLoading}
                    >
                      Predict Action
                    </Button>
                  }
                >
                  {predictionResult ? (
                    <div>
                      <Alert
                        message="Prediction Result"
                        description={
                          <div>
                            <Paragraph><strong>Action:</strong> {predictionResult.action_name}</Paragraph>
                            <Paragraph><strong>Action ID:</strong> {predictionResult.action}</Paragraph>
                            <Paragraph><strong>Result:</strong> {predictionResult.result}</Paragraph>
                          </div>
                        }
                        type="success"
                        showIcon
                      />
                      
                      <Divider orientation="left">What does this mean?</Divider>
                      <Paragraph>
                        The model has analyzed the provided network traffic features and determined that 
                        the most appropriate response is to <strong>{predictionResult.action_name}</strong>.
                      </Paragraph>
                      
                      {predictionResult.action === 0 && (
                        <Alert message="This traffic appears to be normal and requires no action." type="info" />
                      )}
                      
                      {predictionResult.action > 0 && (
                        <Alert message="This traffic has been identified as potentially suspicious." type="warning" />
                      )}
                    </div>
                  ) : (
                    <Alert
                      message="No prediction yet"
                      description="Generate or customize traffic features and click 'Predict Action' to see what the RL agent would do."
                      type="info"
                      showIcon
                    />
                  )}
                  
                  <Divider orientation="left">Feature Visualization</Divider>
                  
                  <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <tbody>
                        {predictionFeatures.map((value, index) => (
                          <tr key={index} style={{ borderBottom: '1px solid #f0f0f0' }}>
                            <td style={{ padding: '4px' }}><strong>Feature {index}</strong></td>
                            <td style={{ padding: '4px' }}>{value.toFixed(2)}</td>
                            <td style={{ padding: '4px' }}>
                              <Progress 
                                percent={value * 100} 
                                size="small" 
                                showInfo={false}
                                strokeColor={value > 0.7 ? 'red' : value > 0.3 ? 'orange' : 'green'}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </Col>
            </Row>
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default ReinforcementLearning; 