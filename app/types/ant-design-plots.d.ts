declare module '@ant-design/plots' {
  import * as React from 'react';

  // Common properties shared across different chart types
  interface CommonConfig {
    data: any[] | Record<string, any>;
    width?: number;
    height?: number;
    autoFit?: boolean;
    padding?: number | number[] | 'auto';
    appendPadding?: number | number[];
    renderer?: 'canvas' | 'svg';
    locale?: string;
    xField?: string;
    yField?: string;
    seriesField?: string;
    colorField?: string;
    color?: string | string[] | ((...args: any[]) => string);
    tooltip?: Record<string, any> | false;
    legend?: Record<string, any> | false;
    xAxis?: Record<string, any> | false;
    yAxis?: Record<string, any> | false;
    label?: Record<string, any> | false;
    meta?: Record<string, any>;
    theme?: Record<string, any> | string;
    interactions?: Record<string, any>[];
    animation?: boolean | Record<string, any>;
    state?: Record<string, any>;
    annotations?: Record<string, any>[];
    onReady?: (plot: any) => void;
    onEvent?: (chart: any, event: any) => void;
  }

  // Line Chart
  export interface LineConfig extends CommonConfig {
    smooth?: boolean;
    stepType?: 'hv' | 'vh' | 'hvh' | 'vhv';
    connectNulls?: boolean;
    isStack?: boolean;
    point?: Record<string, any> | false;
    region?: Record<string, any>;
  }
  export const Line: React.FC<LineConfig>;

  // Area Chart
  export interface AreaConfig extends LineConfig {
    areaStyle?: Record<string, any> | ((...args: any[]) => Record<string, any>);
    areaField?: string;
    isPercent?: boolean;
  }
  export const Area: React.FC<AreaConfig>;

  // Bar Chart
  export interface BarConfig extends CommonConfig {
    isGroup?: boolean;
    isStack?: boolean;
    isRange?: boolean;
    isPercent?: boolean;
    barStyle?: Record<string, any> | ((...args: any[]) => Record<string, any>);
    barWidthRatio?: number;
    barBackground?: Record<string, any>;
    grouped?: boolean;
    stack?: boolean;
  }
  export const Bar: React.FC<BarConfig>;

  // Column Chart
  export type ColumnConfig = BarConfig;
  export const Column: React.FC<ColumnConfig>;

  // Pie Chart
  export interface PieConfig extends CommonConfig {
    angleField: string;
    colorField: string;
    radius?: number;
    innerRadius?: number;
    startAngle?: number;
    endAngle?: number;
    pieStyle?: Record<string, any> | ((...args: any[]) => Record<string, any>);
    statistic?: Record<string, any> | false;
  }
  export const Pie: React.FC<PieConfig>;

  // Scatter Chart
  export interface ScatterConfig extends CommonConfig {
    pointSize?: number | [number, number] | string;
    pointStyle?: Record<string, any> | ((...args: any[]) => Record<string, any>);
    colorField?: string;
    shapeField?: string;
    sizeField?: string;
    shape?: string | string[] | ((...args: any[]) => string);
    size?: number | [number, number] | ((...args: any[]) => number);
    quadrant?: Record<string, any>;
    trendline?: Record<string, any>;
  }
  export const Scatter: React.FC<ScatterConfig>;

  // Heatmap
  export interface HeatmapConfig extends CommonConfig {
    sizeField?: string;
    size?: number | [number, number] | ((...args: any[]) => number);
    shape?: string;
    heatmapStyle?: Record<string, any> | ((...args: any[]) => Record<string, any>);
    color?: string | string[] | ((...args: any[]) => string);
  }
  export const Heatmap: React.FC<HeatmapConfig>;

  // Radar
  export interface RadarConfig extends CommonConfig {
    angleField: string;
    radiusField: string;
    radiusAxis?: Record<string, any> | false;
    area?: Record<string, any> | false;
    point?: Record<string, any> | false;
    smooth?: boolean;
  }
  export const Radar: React.FC<RadarConfig>;

  // DualAxes
  export interface DualAxesConfig extends CommonConfig {
    data: [any[], any[]] | any[];
    yField: [string, string] | string[];
    geometryOptions: any[];
  }
  export const DualAxes: React.FC<DualAxesConfig>;

  // Gauge
  export interface GaugeConfig extends CommonConfig {
    percent: number;
    range?: Record<string, any>;
    indicator?: Record<string, any> | false;
    statistic?: Record<string, any> | false;
    startAngle?: number;
    endAngle?: number;
    gaugeStyle?: Record<string, any> | ((...args: any[]) => Record<string, any>);
  }
  export const Gauge: React.FC<GaugeConfig>;

  // Waterfall
  export interface WaterfallConfig extends CommonConfig {
    risingFill?: string;
    fallingFill?: string;
    total?: Record<string, any>;
    complete?: boolean;
    waterfallStyle?: Record<string, any> | ((...args: any[]) => Record<string, any>);
  }
  export const Waterfall: React.FC<WaterfallConfig>;

  // Funnel
  export interface FunnelConfig extends CommonConfig {
    dynamicHeight?: boolean;
    funnelStyle?: Record<string, any> | ((...args: any[]) => Record<string, any>);
    conversionTag?: Record<string, any> | false;
    isTransposed?: boolean;
  }
  export const Funnel: React.FC<FunnelConfig>;

  // Map charts
  export interface ChoroplethConfig extends CommonConfig {
    geoDataView?: any;
    viewLevel?: any;
    region?: string;
    choroplethStyle?: Record<string, any> | ((...args: any[]) => Record<string, any>);
  }
  export const Choropleth: React.FC<ChoroplethConfig>;
} 