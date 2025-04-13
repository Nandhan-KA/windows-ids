import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import '../models/threat.dart';
import '../utils/app_theme.dart';

class ThreatActivityChart extends StatelessWidget {
  final List<Threat> threats;
  final int daysToShow;

  const ThreatActivityChart({
    super.key, 
    required this.threats,
    this.daysToShow = 7,
  });

  @override
  Widget build(BuildContext context) {
    final isDarkMode = Theme.of(context).brightness == Brightness.dark;
    
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Threat Activity',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            Text(
              'Last $daysToShow days',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: Colors.grey,
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              height: 200,
              child: _buildChart(context, isDarkMode),
            ),
            const SizedBox(height: 16),
            _buildLegend(context),
          ],
        ),
      ),
    );
  }

  Widget _buildChart(BuildContext context, bool isDarkMode) {
    final data = _prepareChartData();
    
    return LineChart(
      LineChartData(
        gridData: FlGridData(
          show: true,
          drawVerticalLine: true,
          horizontalInterval: 1,
          verticalInterval: 1,
          getDrawingHorizontalLine: (value) {
            return FlLine(
              color: Colors.grey.withOpacity(0.2),
              strokeWidth: 1,
            );
          },
          getDrawingVerticalLine: (value) {
            return FlLine(
              color: Colors.grey.withOpacity(0.2),
              strokeWidth: 1,
            );
          },
        ),
        titlesData: FlTitlesData(
          show: true,
          bottomTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              reservedSize: 30,
              getTitlesWidget: (value, meta) {
                final date = DateTime.now().subtract(Duration(days: daysToShow - 1 - value.toInt()));
                return SideTitleWidget(
                  axisSide: meta.axisSide,
                  child: Text(
                    '${date.day}/${date.month}',
                    style: const TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      color: Colors.grey,
                    ),
                  ),
                );
              },
            ),
          ),
          leftTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              getTitlesWidget: (value, meta) {
                return SideTitleWidget(
                  axisSide: meta.axisSide,
                  child: Text(
                    value.toInt().toString(),
                    style: const TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      color: Colors.grey,
                    ),
                  ),
                );
              },
              reservedSize: 42,
            ),
          ),
          topTitles: const AxisTitles(
            sideTitles: SideTitles(showTitles: false),
          ),
          rightTitles: const AxisTitles(
            sideTitles: SideTitles(showTitles: false),
          ),
        ),
        borderData: FlBorderData(
          show: true,
          border: Border.all(
            color: Colors.grey.withOpacity(0.2),
          ),
        ),
        minX: 0,
        maxX: daysToShow.toDouble() - 1,
        minY: 0,
        maxY: _getMaxY(data),
        lineTouchData: LineTouchData(
          touchTooltipData: LineTouchTooltipData(
            tooltipBgColor: isDarkMode ? Colors.grey[800]! : Colors.white,
            tooltipRoundedRadius: 8,
            getTooltipItems: (List<LineBarSpot> touchedSpots) {
              return touchedSpots.map((spot) {
                final severity = _getSeverityFromIndex(spot.barIndex);
                return LineTooltipItem(
                  '${severity}: ${spot.y.toInt()}',
                  TextStyle(
                    color: _getColorForSeverity(severity, isDarkMode),
                    fontWeight: FontWeight.bold,
                  ),
                );
              }).toList();
            },
          ),
        ),
        lineBarsData: [
          _createLineBarsData('Critical', data['Critical'] ?? [], isDarkMode),
          _createLineBarsData('High', data['High'] ?? [], isDarkMode),
          _createLineBarsData('Medium', data['Medium'] ?? [], isDarkMode),
          _createLineBarsData('Low', data['Low'] ?? [], isDarkMode),
        ],
      ),
    );
  }

  LineChartBarData _createLineBarsData(String severity, List<FlSpot> spots, bool isDarkMode) {
    return LineChartBarData(
      spots: spots,
      isCurved: true,
      color: _getColorForSeverity(severity, isDarkMode),
      barWidth: 3,
      isStrokeCapRound: true,
      dotData: FlDotData(
        show: true,
        getDotPainter: (spot, percent, barData, index) {
          return FlDotCirclePainter(
            radius: 4,
            color: _getColorForSeverity(severity, isDarkMode),
            strokeWidth: 1,
            strokeColor: Colors.white,
          );
        },
      ),
      belowBarData: BarAreaData(
        show: true,
        color: _getColorForSeverity(severity, isDarkMode).withOpacity(0.15),
      ),
    );
  }

  Widget _buildLegend(BuildContext context) {
    final isDarkMode = Theme.of(context).brightness == Brightness.dark;
    
    return Wrap(
      spacing: 16,
      runSpacing: 8,
      children: [
        _buildLegendItem('Critical', AppTheme.criticalSeverityColor, isDarkMode),
        _buildLegendItem('High', AppTheme.highSeverityColor, isDarkMode),
        _buildLegendItem('Medium', AppTheme.mediumSeverityColor, isDarkMode),
        _buildLegendItem('Low', AppTheme.lowSeverityColor, isDarkMode),
      ],
    );
  }

  Widget _buildLegendItem(String label, Color color, bool isDarkMode) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 12,
          height: 12,
          decoration: BoxDecoration(
            color: color,
            shape: BoxShape.circle,
          ),
        ),
        const SizedBox(width: 4),
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: isDarkMode ? Colors.grey[300] : Colors.grey[700],
          ),
        ),
      ],
    );
  }

  Map<String, List<FlSpot>> _prepareChartData() {
    // Initialize empty arrays for each severity
    final Map<String, List<FlSpot>> data = {
      'Critical': List.generate(daysToShow, (index) => FlSpot(index.toDouble(), 0)),
      'High': List.generate(daysToShow, (index) => FlSpot(index.toDouble(), 0)),
      'Medium': List.generate(daysToShow, (index) => FlSpot(index.toDouble(), 0)),
      'Low': List.generate(daysToShow, (index) => FlSpot(index.toDouble(), 0)),
    };
    
    // Get the date range
    final now = DateTime.now();
    final startDate = DateTime(now.year, now.month, now.day).subtract(Duration(days: daysToShow - 1));
    
    // Count threats by day and severity
    for (final threat in threats) {
      final threatDate = DateTime(
        threat.timestamp.year,
        threat.timestamp.month,
        threat.timestamp.day,
      );
      
      // Calculate the day index (0 is the oldest day)
      final difference = threatDate.difference(startDate).inDays;
      
      // Only include threats within our date range
      if (difference >= 0 && difference < daysToShow) {
        final severity = threat.severity;
        final spots = data[severity] ?? [];
        
        if (spots.isNotEmpty && difference < spots.length) {
          // Increment the count for this day
          spots[difference] = FlSpot(difference.toDouble(), spots[difference].y + 1);
        }
      }
    }
    
    return data;
  }

  String _getSeverityFromIndex(int index) {
    switch (index) {
      case 0:
        return 'Critical';
      case 1:
        return 'High';
      case 2:
        return 'Medium';
      case 3:
        return 'Low';
      default:
        return 'Unknown';
    }
  }

  Color _getColorForSeverity(String severity, bool isDarkMode) {
    switch (severity) {
      case 'Critical':
        return AppTheme.criticalSeverityColor;
      case 'High':
        return AppTheme.highSeverityColor;
      case 'Medium':
        return AppTheme.mediumSeverityColor;
      case 'Low':
        return AppTheme.lowSeverityColor;
      default:
        return Colors.grey;
    }
  }

  double _getMaxY(Map<String, List<FlSpot>> data) {
    double max = 1.0; // Minimum value to show on Y axis
    
    for (final severityData in data.values) {
      for (final spot in severityData) {
        if (spot.y > max) {
          max = spot.y;
        }
      }
    }
    
    // Round up to next whole number
    return (max.ceilToDouble() + 1);
  }
} 