import jsPDF from 'jspdf';
import 'jspdf-autotable';
import autoTable from 'jspdf-autotable';

interface SecurityEvent {
  id: string;
  type: string;
  title: string;
  severity: string;
  source_ip?: string;
  source?: string;
  timestamp: string;
  description?: string;
  threat_type?: string;
  status?: string;
}

interface SystemMetrics {
  cpu_percent: number;
  memory_percent: number;
  disk_io_percent: number;
  network_io_mbps: number;
}

interface NetworkConnection {
  id?: string;
  local_address: string;
  local_port: number;
  remote_address: string;
  remote_port: number;
  protocol: string;
  status: string;
  process_name?: string;
  pid?: number;
}

interface ReportOptions {
  title: string;
  timeRange: string;
  reportType: string;
  userEmail: string;
  events: SecurityEvent[];
  metrics?: SystemMetrics;
  connections?: NetworkConnection[];
}

export class PDFGenerator {
  private pdf: jsPDF;
  private pageWidth: number;
  private margins = { top: 20, bottom: 20, left: 20, right: 20 };
  private currentY = this.margins.top;
  private pageHeight: number;
  private textColor = '#333333';
  private accentColor = '#0070f3';
  private lineHeight = 10;

  constructor() {
    this.pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
    });
    
    this.pageWidth = this.pdf.internal.pageSize.width;
    this.pageHeight = this.pdf.internal.pageSize.height;
  }

  generateReport(options: ReportOptions): Blob {
    this.addHeader(options.title);
    this.addReportInfo(options);
    
    // Add summary section
    this.addSectionTitle('Summary');
    this.addText(`This report covers security events from the last ${options.timeRange}.`);
    
    if (options.events.length === 0) {
      this.addText('No security events were detected during this period.');
    } else {
      const criticalCount = options.events.filter(e => e.severity === 'critical').length;
      const highCount = options.events.filter(e => e.severity === 'high').length;
      const mediumCount = options.events.filter(e => e.severity === 'medium').length;
      const lowCount = options.events.filter(e => e.severity === 'low').length;
      
      this.addText(`Total security events: ${options.events.length}`);
      this.addText(`Critical: ${criticalCount} | High: ${highCount} | Medium: ${mediumCount} | Low: ${lowCount}`);
    }
    
    this.addSpace(10);
    
    // Add system metrics if available
    if (options.metrics && (options.reportType === 'full' || options.reportType === 'system')) {
      this.addSectionTitle('System Metrics');
      
      const metrics = options.metrics;
      const data = [
        ['Metric', 'Value'],
        ['CPU Usage', `${metrics.cpu_percent.toFixed(1)}%`],
        ['Memory Usage', `${metrics.memory_percent.toFixed(1)}%`],
        ['Disk I/O', `${metrics.disk_io_percent.toFixed(1)}%`],
        ['Network I/O', `${metrics.network_io_mbps.toFixed(2)} Mbps`]
      ];
      
      autoTable(this.pdf, {
        head: [data[0]],
        body: data.slice(1),
        startY: this.currentY
      });
      
      this.currentY = (this.pdf as any).lastAutoTable.finalY + 10;
    }
    
    // Add security events
    if (options.events.length > 0 && (options.reportType === 'full' || options.reportType === 'alerts')) {
      this.addSectionTitle('Security Events');
      
      // Check if we need a page break
      if (this.currentY > this.pageHeight - 100) {
        this.pdf.addPage();
        this.currentY = this.margins.top;
      }
      
      // Sort events by severity and timestamp
      const sortedEvents = [...options.events].sort((a, b) => {
        const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        const aSeverity = severityOrder[a.severity as keyof typeof severityOrder] || 4;
        const bSeverity = severityOrder[b.severity as keyof typeof severityOrder] || 4;
        
        if (aSeverity !== bSeverity) return aSeverity - bSeverity;
        
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });
      
      // Format data for table
      const tableData = sortedEvents.map(event => [
        event.severity.toUpperCase(),
        event.title || event.threat_type || 'Unknown',
        event.source_ip || event.source || 'Unknown',
        new Date(event.timestamp).toLocaleString(),
        event.status || 'unknown',
      ]);
      
      autoTable(this.pdf, {
        head: [['Severity', 'Threat', 'Source', 'Time', 'Status']],
        body: tableData,
        startY: this.currentY,
        styles: {
          overflow: 'linebreak',
          cellWidth: 'wrap'
        },
        columnStyles: {
          0: { cellWidth: 20 },
          1: { cellWidth: 'auto' },
          2: { cellWidth: 30 },
          3: { cellWidth: 40 },
          4: { cellWidth: 20 }
        }
      });
      
      this.currentY = (this.pdf as any).lastAutoTable.finalY + 10;
    }
    
    // Add network connections if available
    if (options.connections && options.connections.length > 0 && 
        (options.reportType === 'full' || options.reportType === 'network')) {
      
      // Add a new page if needed
      if (this.currentY > this.pageHeight - 100) {
        this.pdf.addPage();
        this.currentY = this.margins.top;
      }
      
      this.addSectionTitle('Network Connections');
      
      // Get the top 10 connections for the report
      const topConnections = options.connections.slice(0, 10);
      
      const tableData = topConnections.map(conn => [
        `${conn.local_address}:${conn.local_port}`,
        `${conn.remote_address}:${conn.remote_port}`,
        conn.protocol,
        conn.status,
        conn.process_name || 'Unknown'
      ]);
      
      autoTable(this.pdf, {
        head: [['Local Endpoint', 'Remote Endpoint', 'Protocol', 'Status', 'Process']],
        body: tableData,
        startY: this.currentY
      });
      
      this.currentY = (this.pdf as any).lastAutoTable.finalY + 10;
    }
    
    // Add footer
    this.addFooter(options.userEmail);
    
    // Return the PDF as a Blob
    return this.pdf.output('blob');
  }

  private addHeader(title: string): void {
    // Add logo/image if you have one
    // this.pdf.addImage('logo.png', 'PNG', 20, 10, 40, 20);
    
    // Add title
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(18);
    this.pdf.setTextColor(this.accentColor);
    this.pdf.text(title, this.pageWidth / 2, this.currentY, { align: 'center' });
    
    this.currentY += this.lineHeight * 2;
    
    // Add horizontal line
    this.pdf.setDrawColor(this.accentColor);
    this.pdf.setLineWidth(0.5);
    this.pdf.line(this.margins.left, this.currentY, this.pageWidth - this.margins.right, this.currentY);
    
    this.currentY += this.lineHeight;
  }

  private addReportInfo(options: ReportOptions): void {
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setFontSize(10);
    this.pdf.setTextColor(this.textColor);
    
    const now = new Date();
    const dateText = `Report Generated: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
    const timeRangeText = `Covering: Last ${options.timeRange}`;
    
    this.pdf.text(dateText, this.margins.left, this.currentY);
    this.currentY += this.lineHeight;
    this.pdf.text(timeRangeText, this.margins.left, this.currentY);
    this.currentY += this.lineHeight * 2;
  }

  private addSectionTitle(title: string): void {
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(14);
    this.pdf.setTextColor(this.accentColor);
    this.pdf.text(title, this.margins.left, this.currentY);
    
    this.currentY += this.lineHeight;
    
    // Add a light horizontal line
    this.pdf.setDrawColor(this.accentColor);
    this.pdf.setLineWidth(0.2);
    this.pdf.line(this.margins.left, this.currentY, this.pageWidth / 2, this.currentY);
    
    this.currentY += this.lineHeight;
  }

  private addText(text: string): void {
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setFontSize(10);
    this.pdf.setTextColor(this.textColor);
    this.pdf.text(text, this.margins.left, this.currentY);
    this.currentY += this.lineHeight;
  }

  private addSpace(space: number): void {
    this.currentY += space;
  }

  private addFooter(email: string): void {
    const footerY = this.pageHeight - this.margins.bottom;
    
    this.pdf.setFont('helvetica', 'italic');
    this.pdf.setFontSize(8);
    this.pdf.setTextColor('#666666');
    
    // Add horizontal line
    this.pdf.setDrawColor('#cccccc');
    this.pdf.setLineWidth(0.2);
    this.pdf.line(this.margins.left, footerY - 8, this.pageWidth - this.margins.right, footerY - 8);
    
    // Add footer text
    this.pdf.text(`Report sent to: ${email} | Windows Intrusion Detection System | Generated ${new Date().toLocaleString()}`, 
                 this.pageWidth / 2, footerY, { align: 'center' });
    
    // Add page numbers
    const totalPages = this.pdf.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      this.pdf.setPage(i);
      this.pdf.text(`Page ${i} of ${totalPages}`, this.pageWidth - this.margins.right, footerY, { align: 'right' });
    }
  }
} 