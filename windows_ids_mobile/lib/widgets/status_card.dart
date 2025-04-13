import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

class StatusCard extends StatelessWidget {
  final String status;
  final DateTime lastUpdated;

  const StatusCard({
    super.key,
    required this.status,
    required this.lastUpdated,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: IntrinsicHeight(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              _buildStatusIndicator(),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _getStatusText(),
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      _getStatusDescription(),
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey[600],
                      ),
                    ),
                  ],
                ),
              ),
              VerticalDivider(
                color: Colors.grey[300],
                thickness: 1,
                width: 32,
              ),
              Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Last Updated',
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    _formatLastUpdated(),
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatusIndicator() {
    return Container(
      width: 60,
      height: 60,
      decoration: BoxDecoration(
        color: _getStatusColor().withOpacity(0.15),
        shape: BoxShape.circle,
      ),
      child: Center(
        child: Icon(
          _getStatusIcon(),
          color: _getStatusColor(),
          size: 32,
        ),
      ),
    );
  }

  Color _getStatusColor() {
    switch (status.toLowerCase()) {
      case 'online':
      case 'connected':
      case 'active':
      case 'secure':
        return Colors.green;
      case 'inactive':
      case 'standby':
      case 'monitoring':
        return Colors.blue;
      case 'warning':
      case 'alert':
        return Colors.orange;
      case 'offline':
      case 'disconnected':
      case 'error':
      case 'under attack':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  IconData _getStatusIcon() {
    switch (status.toLowerCase()) {
      case 'online':
      case 'connected':
      case 'active':
      case 'secure':
        return Icons.check_circle;
      case 'inactive':
      case 'standby':
      case 'monitoring':
        return Icons.shield;
      case 'warning':
      case 'alert':
        return Icons.warning_amber;
      case 'offline':
      case 'disconnected':
      case 'error':
        return Icons.error;
      case 'under attack':
        return Icons.security;
      default:
        return Icons.help;
    }
  }

  String _getStatusText() {
    switch (status.toLowerCase()) {
      case 'online':
      case 'connected':
      case 'active':
        return 'Active & Monitoring';
      case 'secure':
        return 'System Secure';
      case 'inactive':
      case 'standby':
        return 'Standby Mode';
      case 'warning':
      case 'alert':
        return 'Alerts Detected';
      case 'offline':
      case 'disconnected':
        return 'Disconnected';
      case 'error':
        return 'System Error';
      case 'under attack':
        return 'Under Attack';
      default:
        return status.isNotEmpty ? status : 'Unknown';
    }
  }

  String _getStatusDescription() {
    switch (status.toLowerCase()) {
      case 'online':
      case 'connected':
      case 'active':
        return 'IDS is actively monitoring your system';
      case 'secure':
        return 'No threats detected in your system';
      case 'inactive':
      case 'standby':
        return 'IDS is in standby mode and not actively protecting';
      case 'warning':
      case 'alert':
        return 'Potential security issues have been detected';
      case 'offline':
      case 'disconnected':
        return 'Not connected to IDS system';
      case 'error':
        return 'IDS system has encountered an error';
      case 'under attack':
        return 'Active attack in progress, mitigations running';
      default:
        return 'Status information not available';
    }
  }

  String _formatLastUpdated() {
    final now = DateTime.now();
    final difference = now.difference(lastUpdated);
    
    if (difference.inMinutes < 1) {
      return 'Just now';
    } else if (difference.inHours < 1) {
      return '${difference.inMinutes}m ago';
    } else if (difference.inDays < 1) {
      return '${difference.inHours}h ago';
    } else {
      return DateFormat('MM/dd HH:mm').format(lastUpdated);
    }
  }
} 