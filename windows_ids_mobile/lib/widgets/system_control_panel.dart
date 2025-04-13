import 'package:flutter/material.dart';
import '../services/system_control_service.dart';
import '../models/system_action.dart';

class SystemControlPanel extends StatefulWidget {
  const SystemControlPanel({super.key});

  @override
  State<SystemControlPanel> createState() => _SystemControlPanelState();
}

class _SystemControlPanelState extends State<SystemControlPanel> {
  final SystemControlService _systemControlService = SystemControlService();
  bool _isPerformingAction = false;
  String? _errorMessage;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Card(
          elevation: 2,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (_errorMessage != null) _buildErrorBanner(),
                GridView.count(
                  crossAxisCount: 2,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  mainAxisSpacing: 12,
                  crossAxisSpacing: 12,
                  childAspectRatio: 2.5,
                  children: [
                    _buildActionButton(
                      'Block Traffic',
                      Icons.block,
                      Colors.red,
                      _blockTraffic,
                    ),
                    _buildActionButton(
                      'Resume Traffic',
                      Icons.play_arrow,
                      Colors.green,
                      _resumeTraffic,
                    ),
                    _buildActionButton(
                      'Lock Screen',
                      Icons.lock,
                      Colors.blue,
                      _lockScreen,
                    ),
                    _buildActionButton(
                      'Emergency Response',
                      Icons.warning,
                      Colors.orange,
                      () => _showEmergencyResponseDialog(),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
        
        const SizedBox(height: 16),
        
        Text(
          'System Power',
          style: Theme.of(context).textTheme.titleMedium,
        ),
        const SizedBox(height: 8),
        
        Card(
          elevation: 2,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildPowerButton(
                  'Sleep',
                  Icons.nights_stay,
                  Colors.indigo,
                  () => _confirmSystemAction(
                    'Sleep',
                    'Put the computer to sleep?',
                    _systemControlService.sleepSystem,
                  ),
                ),
                _buildPowerButton(
                  'Restart',
                  Icons.refresh,
                  Colors.blue,
                  () => _confirmSystemAction(
                    'Restart',
                    'Restart the computer?',
                    _systemControlService.restartSystem,
                  ),
                ),
                _buildPowerButton(
                  'Shutdown',
                  Icons.power_settings_new,
                  Colors.red,
                  () => _confirmSystemAction(
                    'Shutdown',
                    'Shut down the computer?',
                    _systemControlService.shutdownSystem,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildErrorBanner() {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.red.shade50,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.red.shade200),
      ),
      child: Row(
        children: [
          Icon(Icons.error, color: Colors.red.shade700, size: 20),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              _errorMessage!,
              style: TextStyle(
                color: Colors.red.shade700,
                fontSize: 14,
              ),
            ),
          ),
          IconButton(
            icon: const Icon(Icons.close, size: 16),
            color: Colors.red.shade700,
            onPressed: () {
              setState(() {
                _errorMessage = null;
              });
            },
          ),
        ],
      ),
    );
  }

  Widget _buildActionButton(
    String label,
    IconData icon,
    Color color,
    VoidCallback onPressed,
  ) {
    return ElevatedButton(
      onPressed: _isPerformingAction ? null : onPressed,
      style: ElevatedButton.styleFrom(
        backgroundColor: color.withOpacity(0.1),
        foregroundColor: color,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
          side: BorderSide(color: color),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 16),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, size: 18),
          const SizedBox(width: 8),
          Flexible(
            child: Text(
              label,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPowerButton(
    String label,
    IconData icon,
    Color color,
    VoidCallback onPressed,
  ) {
    return InkWell(
      onTap: _isPerformingAction ? null : onPressed,
      borderRadius: BorderRadius.circular(8),
      child: Padding(
        padding: const EdgeInsets.all(8.0),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(
                icon,
                color: color,
                size: 24,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              label,
              style: TextStyle(
                color: color,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _confirmSystemAction(
    String action,
    String message,
    Future<bool> Function({int delaySeconds, bool force}) actionFunction,
  ) async {
    final result = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(action),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Confirm'),
            style: ElevatedButton.styleFrom(
              backgroundColor: Theme.of(context).colorScheme.primary,
              foregroundColor: Theme.of(context).colorScheme.onPrimary,
            ),
          ),
        ],
      ),
    );

    if (result == true) {
      setState(() {
        _isPerformingAction = true;
        _errorMessage = null;
      });

      try {
        await actionFunction(delaySeconds: 0, force: false);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('$action request sent successfully')),
          );
        }
      } catch (e) {
        if (mounted) {
          setState(() {
            _errorMessage = 'Failed to $action: ${e.toString()}';
          });
        }
      } finally {
        if (mounted) {
          setState(() {
            _isPerformingAction = false;
          });
        }
      }
    }
  }

  Future<void> _blockTraffic() async {
    setState(() {
      _isPerformingAction = true;
      _errorMessage = null;
    });

    try {
      await _systemControlService.blockNetworkTraffic();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Network traffic blocked successfully')),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = 'Failed to block traffic: ${e.toString()}';
        });
      }
    } finally {
      if (mounted) {
        setState(() {
          _isPerformingAction = false;
        });
      }
    }
  }

  Future<void> _resumeTraffic() async {
    setState(() {
      _isPerformingAction = true;
      _errorMessage = null;
    });

    try {
      await _systemControlService.resumeNetworkTraffic();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Network traffic resumed successfully')),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = 'Failed to resume traffic: ${e.toString()}';
        });
      }
    } finally {
      if (mounted) {
        setState(() {
          _isPerformingAction = false;
        });
      }
    }
  }

  Future<void> _lockScreen() async {
    setState(() {
      _isPerformingAction = true;
      _errorMessage = null;
    });

    try {
      await _systemControlService.lockScreen();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Lock screen command sent successfully')),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = 'Failed to lock screen: ${e.toString()}';
        });
      }
    } finally {
      if (mounted) {
        setState(() {
          _isPerformingAction = false;
        });
      }
    }
  }

  Future<void> _showEmergencyResponseDialog() async {
    final result = await showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Emergency Response'),
        content: const Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Select an emergency response action:',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 8),
            Text('• Disconnect: Disable all network interfaces'),
            Text('• Lockdown: Block all traffic and lock screen'),
            Text('• Shutdown: Force immediate system shutdown'),
            SizedBox(height: 16),
            Text(
              'Warning: These actions may interrupt current operations.',
              style: TextStyle(
                color: Colors.red,
                fontStyle: FontStyle.italic,
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, 'disconnect'),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.blue),
            child: const Text('Disconnect'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, 'lockdown'),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.orange),
            child: const Text('Lockdown'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, 'shutdown'),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Shutdown'),
          ),
        ],
      ),
    );

    if (result != null) {
      setState(() {
        _isPerformingAction = true;
        _errorMessage = null;
      });

      try {
        // In a real app, you would pass a real threat ID
        await _systemControlService.emergencyResponse('emergency-threat-id', result);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Emergency response ($result) initiated successfully'),
              backgroundColor: Colors.red,
            ),
          );
        }
      } catch (e) {
        if (mounted) {
          setState(() {
            _errorMessage =
                'Failed to perform emergency response: ${e.toString()}';
          });
        }
      } finally {
        if (mounted) {
          setState(() {
            _isPerformingAction = false;
          });
        }
      }
    }
  }
} 