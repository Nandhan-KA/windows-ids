declare module 'antd' {
  import * as React from 'react';

  type ReactNode = React.ReactNode;

  // Button
  export interface ButtonProps {
    type?: 'primary' | 'ghost' | 'dashed' | 'link' | 'text' | 'default';
    size?: 'large' | 'middle' | 'small';
    disabled?: boolean;
    loading?: boolean | { delay?: number };
    shape?: 'default' | 'circle' | 'round';
    icon?: ReactNode;
    danger?: boolean;
    ghost?: boolean;
    block?: boolean;
    href?: string;
    target?: string;
    onClick?: React.MouseEventHandler<HTMLElement>;
    className?: string;
    style?: React.CSSProperties;
    children?: ReactNode;
  }
  export const Button: React.FC<ButtonProps> & {
    Group: React.FC<{ children?: ReactNode; size?: ButtonProps['size'] }>;
  };

  // Layout
  export interface LayoutProps {
    className?: string;
    hasSider?: boolean;
    style?: React.CSSProperties;
    children?: ReactNode;
  }
  export interface SiderProps {
    breakpoint?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
    className?: string;
    collapsed?: boolean;
    collapsedWidth?: number;
    collapsible?: boolean;
    defaultCollapsed?: boolean;
    reverseArrow?: boolean;
    style?: React.CSSProperties;
    theme?: 'light' | 'dark';
    trigger?: ReactNode;
    width?: number | string;
    onCollapse?: (collapsed: boolean, type: 'clickTrigger' | 'responsive') => void;
    onBreakpoint?: (broken: boolean) => void;
    children?: ReactNode;
  }
  export const Layout: React.FC<LayoutProps> & {
    Header: React.FC<{ className?: string; style?: React.CSSProperties; children?: ReactNode }>;
    Content: React.FC<{ className?: string; style?: React.CSSProperties; children?: ReactNode }>;
    Footer: React.FC<{ className?: string; style?: React.CSSProperties; children?: ReactNode }>;
    Sider: React.FC<SiderProps>;
  };

  // Menu
  export interface MenuProps {
    mode?: 'vertical' | 'horizontal' | 'inline';
    theme?: 'light' | 'dark';
    style?: React.CSSProperties;
    className?: string;
    items?: Array<{
      key: string;
      icon?: ReactNode;
      label: ReactNode;
      title?: string;
      disabled?: boolean;
      children?: Array<{ key: string; label: ReactNode; title?: string; disabled?: boolean }>;
    }>;
    selectedKeys?: string[];
    defaultSelectedKeys?: string[];
    openKeys?: string[];
    defaultOpenKeys?: string[];
    onSelect?: (info: { key: string; keyPath: string[]; item: any; domEvent: any }) => void;
    onClick?: (info: { key: string; keyPath: string[]; item: any; domEvent: any }) => void;
    children?: ReactNode;
  }
  export const Menu: React.FC<MenuProps>;

  // Card
  export interface CardProps {
    title?: ReactNode;
    extra?: ReactNode;
    bordered?: boolean;
    hoverable?: boolean;
    size?: 'default' | 'small';
    cover?: ReactNode;
    actions?: ReactNode[];
    className?: string;
    style?: React.CSSProperties;
    children?: ReactNode;
  }
  export const Card: React.FC<CardProps> & {
    Grid: React.FC<{ hoverable?: boolean; className?: string; style?: React.CSSProperties; children?: ReactNode }>;
    Meta: React.FC<{ title?: ReactNode; description?: ReactNode; avatar?: ReactNode; className?: string; style?: React.CSSProperties }>;
  };

  // Form
  export interface FormProps {
    layout?: 'horizontal' | 'vertical' | 'inline';
    initialValues?: Record<string, any>;
    onFinish?: (values: any) => void;
    onFinishFailed?: (errorInfo: any) => void;
    autoComplete?: string;
    disabled?: boolean;
    form?: FormInstance;
    name?: string;
    preserve?: boolean;
    scrollToFirstError?: boolean | { block?: 'start' | 'center' | 'end' | 'nearest'; inline?: 'start' | 'center' | 'end' | 'nearest' };
    size?: 'small' | 'middle' | 'large';
    validateMessages?: Record<string, any>;
    validateTrigger?: string | string[];
    className?: string;
    style?: React.CSSProperties;
    children?: ReactNode;
  }

  export interface FormInstance {
    getFieldValue: (name: string) => any;
    getFieldsValue: (nameList?: string[] | true) => any;
    setFieldsValue: (values: Record<string, any>) => void;
    resetFields: (fields?: string[]) => void;
    submit: () => void;
    validateFields: (nameList?: string[]) => Promise<any>;
  }

  export interface FormItemProps {
    label?: ReactNode;
    name?: string | string[];
    rules?: any[];
    initialValue?: any;
    valuePropName?: string;
    required?: boolean;
    dependencies?: string[];
    help?: ReactNode;
    extra?: ReactNode;
    hasFeedback?: boolean;
    colon?: boolean;
    className?: string;
    style?: React.CSSProperties;
    children?: ReactNode;
  }

  export const Form: React.FC<FormProps> & {
    Item: React.FC<FormItemProps>;
    useForm: () => [FormInstance];
  };

  // Input
  export interface InputProps {
    addonAfter?: ReactNode;
    addonBefore?: ReactNode;
    allowClear?: boolean;
    bordered?: boolean;
    defaultValue?: string;
    disabled?: boolean;
    id?: string;
    maxLength?: number;
    prefix?: ReactNode;
    size?: 'large' | 'middle' | 'small';
    suffix?: ReactNode;
    type?: string;
    value?: string;
    onChange?: React.ChangeEventHandler<HTMLInputElement>;
    onPressEnter?: React.KeyboardEventHandler<HTMLInputElement>;
    className?: string;
    style?: React.CSSProperties;
  }
  export const Input: React.FC<InputProps> & {
    TextArea: React.FC<InputProps & { showCount?: boolean; autoSize?: boolean | { minRows: number; maxRows: number } }>;
    Search: React.FC<InputProps & { enterButton?: ReactNode; loading?: boolean; onSearch?: (value: string, event?: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLInputElement>) => void }>;
    Password: React.FC<InputProps & { visibilityToggle?: boolean; iconRender?: (visible: boolean) => ReactNode }>;
    Group: React.FC<{ compact?: boolean; size?: 'large' | 'default' | 'small'; className?: string; style?: React.CSSProperties; children?: ReactNode }>;
  };

  // Select
  export interface SelectProps {
    allowClear?: boolean;
    autoClearSearchValue?: boolean;
    defaultActiveFirstOption?: boolean;
    defaultValue?: string | string[] | number | number[] | LabeledValue | LabeledValue[];
    disabled?: boolean;
    dropdownClassName?: string;
    dropdownMatchSelectWidth?: boolean | number;
    filterOption?: boolean | ((inputValue: string, option: React.ReactElement) => boolean);
    labelInValue?: boolean;
    loading?: boolean;
    maxTagCount?: number;
    maxTagTextLength?: number;
    mode?: 'multiple' | 'tags';
    notFoundContent?: ReactNode;
    options?: { label: ReactNode; value: string | number; disabled?: boolean }[];
    placeholder?: ReactNode;
    showArrow?: boolean;
    showSearch?: boolean;
    size?: 'large' | 'middle' | 'small';
    value?: string | string[] | number | number[] | LabeledValue | LabeledValue[];
    onChange?: (value: any, option: React.ReactElement | React.ReactElement[]) => void;
    onSearch?: (value: string) => void;
    className?: string;
    style?: React.CSSProperties;
    children?: ReactNode;
  }

  export interface LabeledValue {
    key?: string;
    value: string | number;
    label: ReactNode;
  }

  export interface OptionProps {
    disabled?: boolean;
    title?: string;
    value?: string | number;
    children?: ReactNode;
  }

  export const Select: React.FC<SelectProps> & {
    Option: React.FC<OptionProps>;
    OptGroup: React.FC<{ label: ReactNode; children?: ReactNode }>;
  };

  // Table
  export interface ColumnType<T> {
    title?: ReactNode;
    dataIndex?: string;
    key?: string;
    render?: (text: any, record: T, index: number) => ReactNode;
    align?: 'left' | 'right' | 'center';
    fixed?: boolean | 'left' | 'right';
    width?: string | number;
    sorter?: boolean | ((a: T, b: T) => number);
    sortOrder?: 'ascend' | 'descend' | null;
    defaultSortOrder?: 'ascend' | 'descend' | null;
    filters?: { text: ReactNode; value: string | number | boolean }[];
    filteredValue?: (string | number | boolean)[];
    filterMultiple?: boolean;
    onFilter?: (value: string | number | boolean, record: T) => boolean;
  }

  export interface TableProps<T> {
    bordered?: boolean;
    columns?: ColumnType<T>[];
    dataSource?: T[];
    loading?: boolean | { delay?: number };
    locale?: Record<string, any>;
    pagination?: false | TablePaginationConfig;
    rowKey?: string | ((record: T) => string);
    rowSelection?: Record<string, any>;
    scroll?: { x?: number | true | string; y?: number | string };
    showHeader?: boolean;
    size?: 'large' | 'middle' | 'small';
    className?: string;
    style?: React.CSSProperties;
    onChange?: (pagination: any, filters: any, sorter: any, extra: any) => void;
  }

  export interface TablePaginationConfig {
    position?: ('topLeft' | 'topCenter' | 'topRight' | 'bottomLeft' | 'bottomCenter' | 'bottomRight')[];
    total?: number;
    pageSize?: number;
    defaultPageSize?: number;
    current?: number;
    defaultCurrent?: number;
    showSizeChanger?: boolean;
    pageSizeOptions?: string[];
    showQuickJumper?: boolean;
    showTotal?: (total: number, range: [number, number]) => ReactNode;
  }

  export const Table: <T extends Record<string, any>>(props: TableProps<T>) => React.ReactElement;

  // Message
  export interface MessageType {
    success: (content: ReactNode, duration?: number, onClose?: () => void) => void;
    error: (content: ReactNode, duration?: number, onClose?: () => void) => void;
    info: (content: ReactNode, duration?: number, onClose?: () => void) => void;
    warning: (content: ReactNode, duration?: number, onClose?: () => void) => void;
    loading: (content: ReactNode, duration?: number, onClose?: () => void) => void;
  }
  export const message: MessageType;

  // Modal
  export interface ModalProps {
    visible?: boolean;
    title?: ReactNode;
    closable?: boolean;
    onOk?: (e: React.MouseEvent<HTMLElement>) => void;
    onCancel?: (e: React.MouseEvent<HTMLElement>) => void;
    afterClose?: () => void;
    centered?: boolean;
    width?: string | number;
    footer?: ReactNode;
    okText?: ReactNode;
    okType?: 'primary' | 'ghost' | 'dashed' | 'link' | 'text' | 'default';
    cancelText?: ReactNode;
    maskClosable?: boolean;
    forceRender?: boolean;
    destroyOnClose?: boolean;
    className?: string;
    style?: React.CSSProperties;
    children?: ReactNode;
  }
  export const Modal: React.FC<ModalProps> & {
    info: (config: ModalProps) => { destroy: () => void };
    success: (config: ModalProps) => { destroy: () => void };
    error: (config: ModalProps) => { destroy: () => void };
    warning: (config: ModalProps) => { destroy: () => void };
    confirm: (config: ModalProps) => { destroy: () => void };
  };

  // Notification
  export interface NotificationConfig {
    message: ReactNode;
    description?: ReactNode;
    placement?: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
    duration?: number;
    btn?: ReactNode;
    key?: string;
    className?: string;
    style?: React.CSSProperties;
    onClick?: () => void;
  }
  export const notification: {
    success: (config: NotificationConfig) => void;
    error: (config: NotificationConfig) => void;
    info: (config: NotificationConfig) => void;
    warning: (config: NotificationConfig) => void;
    open: (config: NotificationConfig) => void;
    close: (key: string) => void;
    destroy: () => void;
  };

  // Spin
  export interface SpinProps {
    delay?: number;
    indicator?: ReactNode;
    size?: 'small' | 'default' | 'large';
    spinning?: boolean;
    tip?: ReactNode;
    wrapperClassName?: string;
    style?: React.CSSProperties;
    className?: string;
    children?: ReactNode;
  }
  export const Spin: React.FC<SpinProps>;

  // Tabs
  export interface TabsProps {
    activeKey?: string;
    animated?: boolean | { inkBar?: boolean; tabPane?: boolean };
    centered?: boolean;
    defaultActiveKey?: string;
    hideAdd?: boolean;
    size?: 'large' | 'small' | 'default';
    tabBarExtraContent?: ReactNode;
    tabBarGutter?: number;
    tabBarStyle?: React.CSSProperties;
    tabPosition?: 'top' | 'right' | 'bottom' | 'left';
    type?: 'line' | 'card' | 'editable-card';
    onChange?: (activeKey: string) => void;
    onEdit?: (targetKey: string | React.MouseEvent, action: 'add' | 'remove') => void;
    onTabClick?: (key: string, event: React.MouseEvent) => void;
    className?: string;
    style?: React.CSSProperties;
    children?: ReactNode;
  }
  export interface TabPaneProps {
    tab?: ReactNode;
    className?: string;
    style?: React.CSSProperties;
    disabled?: boolean;
    key?: string;
    forceRender?: boolean;
    closable?: boolean;
    children?: ReactNode;
  }
  export const Tabs: React.FC<TabsProps> & {
    TabPane: React.FC<TabPaneProps>;
  };

  // Progress
  export interface ProgressProps {
    type?: 'line' | 'circle' | 'dashboard';
    percent?: number;
    format?: (percent?: number, successPercent?: number) => ReactNode;
    status?: 'success' | 'exception' | 'normal' | 'active';
    showInfo?: boolean;
    strokeWidth?: number;
    strokeLinecap?: 'round' | 'square';
    strokeColor?: string | { from: string; to: string } | string[];
    trailColor?: string;
    width?: number;
    success?: { percent?: number; strokeColor?: string };
    className?: string;
    style?: React.CSSProperties;
  }
  export const Progress: React.FC<ProgressProps>;

  // Alert
  export interface AlertProps {
    message: ReactNode;
    description?: ReactNode;
    type?: 'success' | 'info' | 'warning' | 'error';
    closable?: boolean;
    closeText?: ReactNode;
    showIcon?: boolean;
    icon?: ReactNode;
    onClose?: (e: React.MouseEvent<HTMLButtonElement>) => void;
    afterClose?: () => void;
    banner?: boolean;
    style?: React.CSSProperties;
    className?: string;
  }
  export const Alert: React.FC<AlertProps>;

  // Statistic
  export interface StatisticProps {
    title?: ReactNode;
    value?: string | number;
    precision?: number;
    decimalSeparator?: string;
    groupSeparator?: string;
    prefix?: ReactNode;
    suffix?: ReactNode;
    valueStyle?: React.CSSProperties;
    formatter?: (value: string | number) => ReactNode;
    loading?: boolean;
    className?: string;
    style?: React.CSSProperties;
  }
  export const Statistic: React.FC<StatisticProps>;

  // Popconfirm
  export interface PopconfirmProps {
    title: ReactNode;
    onConfirm?: (e?: React.MouseEvent<HTMLElement>) => void;
    onCancel?: (e?: React.MouseEvent<HTMLElement>) => void;
    okText?: ReactNode;
    cancelText?: ReactNode;
    okType?: ButtonProps['type'];
    okButtonProps?: ButtonProps;
    cancelButtonProps?: ButtonProps;
    icon?: ReactNode;
    disabled?: boolean;
    placement?: 'top' | 'left' | 'right' | 'bottom' | 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' | 'leftTop' | 'leftBottom' | 'rightTop' | 'rightBottom';
    children?: ReactNode;
  }
  export const Popconfirm: React.FC<PopconfirmProps>;

  // DatePicker
  export interface DatePickerProps {
    allowClear?: boolean;
    autoFocus?: boolean;
    bordered?: boolean;
    className?: string;
    disabled?: boolean;
    disabledDate?: (currentDate: Date) => boolean;
    format?: string;
    placeholder?: string;
    size?: 'large' | 'middle' | 'small';
    value?: Date;
    defaultValue?: Date;
    onChange?: (date: Date | null, dateString: string) => void;
    style?: React.CSSProperties;
  }
  export const DatePicker: React.FC<DatePickerProps> & {
    RangePicker: React.FC<DatePickerProps & { 
      separator?: ReactNode; 
      value?: [Date, Date]; 
      defaultValue?: [Date, Date]; 
      onChange?: (dates: [Date, Date] | null, dateStrings: [string, string]) => void;
    }>;
    WeekPicker: React.FC<DatePickerProps>;
    MonthPicker: React.FC<DatePickerProps>;
    YearPicker: React.FC<DatePickerProps>;
    QuarterPicker: React.FC<DatePickerProps>;
  };

  // Existing component declarations
  export interface CheckboxProps {
    checked?: boolean;
    defaultChecked?: boolean;
    disabled?: boolean;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    className?: string;
    style?: React.CSSProperties;
    children?: ReactNode;
  }
  export const Checkbox: React.FC<CheckboxProps> & {
    Group: React.FC<{
      options?: Array<{ label: ReactNode; value: string | number; disabled?: boolean }>;
      value?: any[];
      defaultValue?: any[];
      onChange?: (checkedValues: any[]) => void;
      disabled?: boolean;
      children?: ReactNode;
    }>;
  };

  export interface ColProps {
    span?: number;
    offset?: number;
    order?: number;
    pull?: number;
    push?: number;
    xs?: number | { span: number; offset?: number };
    sm?: number | { span: number; offset?: number };
    md?: number | { span: number; offset?: number };
    lg?: number | { span: number; offset?: number };
    xl?: number | { span: number; offset?: number };
    xxl?: number | { span: number; offset?: number };
    className?: string;
    style?: React.CSSProperties;
    children?: ReactNode;
  }
  export const Col: React.FC<ColProps>;

  export interface RowProps {
    align?: 'top' | 'middle' | 'bottom';
    gutter?: number | [number, number] | { xs: number; sm: number; md: number; lg: number; xl: number; xxl: number };
    justify?: 'start' | 'end' | 'center' | 'space-around' | 'space-between';
    wrap?: boolean;
    className?: string;
    style?: React.CSSProperties;
    children?: ReactNode;
  }
  export const Row: React.FC<RowProps>;

  export interface DividerProps {
    type?: 'horizontal' | 'vertical';
    orientation?: 'left' | 'right' | 'center';
    plain?: boolean;
    dashed?: boolean;
    className?: string;
    style?: React.CSSProperties;
    children?: ReactNode;
  }
  export const Divider: React.FC<DividerProps>;

  export interface InputNumberProps {
    defaultValue?: number;
    value?: number;
    min?: number;
    max?: number;
    step?: number | string;
    onChange?: (value: number | null) => void;
    disabled?: boolean;
    size?: 'large' | 'middle' | 'small';
    controls?: boolean;
    stringMode?: boolean;
    className?: string;
    style?: React.CSSProperties;
  }
  export const InputNumber: React.FC<InputNumberProps>;

  export interface SwitchProps {
    checked?: boolean;
    defaultChecked?: boolean;
    onChange?: (checked: boolean, event: React.MouseEvent<HTMLButtonElement>) => void;
    disabled?: boolean;
    size?: 'default' | 'small';
    loading?: boolean;
    checkedChildren?: ReactNode;
    unCheckedChildren?: ReactNode;
    className?: string;
    style?: React.CSSProperties;
  }
  export const Switch: React.FC<SwitchProps>;

  export interface TagProps {
    color?: string;
    closable?: boolean;
    closeIcon?: ReactNode;
    onClose?: (e: React.MouseEvent<HTMLElement>) => void;
    className?: string;
    style?: React.CSSProperties;
    icon?: ReactNode;
    children?: ReactNode;
  }
  export const Tag: React.FC<TagProps>;

  export interface SpaceProps {
    align?: 'start' | 'end' | 'center' | 'baseline';
    direction?: 'vertical' | 'horizontal';
    size?: 'small' | 'middle' | 'large' | number;
    split?: ReactNode;
    wrap?: boolean;
    className?: string;
    style?: React.CSSProperties;
    children?: ReactNode;
  }
  export const Space: React.FC<SpaceProps>;

  export interface TypographyProps {
    id?: string;
    className?: string;
    style?: React.CSSProperties;
    children?: ReactNode;
  }
  export const Typography: React.FC<TypographyProps> & {
    Title: React.FC<{
      level?: 1 | 2 | 3 | 4 | 5;
      className?: string;
      style?: React.CSSProperties;
      children?: ReactNode;
    }>;
    Text: React.FC<{
      type?: 'secondary' | 'success' | 'warning' | 'danger';
      disabled?: boolean;
      mark?: boolean;
      code?: boolean;
      keyboard?: boolean;
      underline?: boolean;
      delete?: boolean;
      strong?: boolean;
      italic?: boolean;
      className?: string;
      style?: React.CSSProperties;
      children?: ReactNode;
    }>;
    Paragraph: React.FC<{
      className?: string;
      style?: React.CSSProperties;
      children?: ReactNode;
    }>;
  };

  export const List: React.FC<{
    bordered?: boolean;
    dataSource?: any[];
    header?: ReactNode;
    footer?: ReactNode;
    itemLayout?: 'horizontal' | 'vertical';
    loading?: boolean | { spinning: boolean; delay: number };
    loadMore?: ReactNode;
    pagination?: { position?: 'top' | 'bottom' | 'both'; pageSize?: number; current?: number; total?: number; onChange?: (page: number, pageSize: number) => void } | false;
    split?: boolean;
    className?: string;
    style?: React.CSSProperties;
    children?: ReactNode;
  }> & {
    Item: React.FC<{
      actions?: ReactNode[];
      extra?: ReactNode;
      className?: string;
      style?: React.CSSProperties;
      children?: ReactNode;
    }>;
  };

  export const Radio: React.FC<{
    autoFocus?: boolean;
    checked?: boolean;
    defaultChecked?: boolean;
    disabled?: boolean;
    value?: any;
    className?: string;
    style?: React.CSSProperties;
    children?: ReactNode;
  }> & {
    Group: React.FC<{
      defaultValue?: any;
      disabled?: boolean;
      name?: string;
      options?: Array<{ label: ReactNode; value: any; disabled?: boolean; }> | string[];
      optionType?: 'default' | 'button';
      size?: 'large' | 'middle' | 'small';
      value?: any;
      onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
      buttonStyle?: 'outline' | 'solid';
      className?: string;
      style?: React.CSSProperties;
      children?: ReactNode;
    }>;
  };

  export const Tooltip: React.FC<{
    title?: ReactNode;
    placement?: 'top' | 'left' | 'right' | 'bottom' | 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' | 'leftTop' | 'leftBottom' | 'rightTop' | 'rightBottom';
    trigger?: 'hover' | 'focus' | 'click' | 'contextMenu' | Array<'hover' | 'focus' | 'click' | 'contextMenu'>;
    visible?: boolean;
    defaultVisible?: boolean;
    onVisibleChange?: (visible: boolean) => void;
    className?: string;
    style?: React.CSSProperties;
    overlayClassName?: string;
    overlayStyle?: React.CSSProperties;
    children?: ReactNode;
  }>;

  export const Slider: React.FC<{
    defaultValue?: number | [number, number];
    disabled?: boolean;
    dots?: boolean;
    marks?: Record<number, ReactNode>;
    max?: number;
    min?: number;
    range?: boolean;
    step?: number | null;
    value?: number | [number, number];
    vertical?: boolean;
    onChange?: (value: number | [number, number]) => void;
    onAfterChange?: (value: number | [number, number]) => void;
    className?: string;
    style?: React.CSSProperties;
  }>;

  // Additional type definitions
  type SizeType = 'small' | 'middle' | 'large' | undefined;

  // Empty state
  export interface EmptyProps {
    description?: ReactNode;
    image?: string | ReactNode;
    imageStyle?: React.CSSProperties;
    className?: string;
    style?: React.CSSProperties;
    children?: ReactNode;
  }
  export const Empty: React.FC<EmptyProps>;

  // Result
  export interface ResultProps {
    icon?: ReactNode;
    status?: '404' | '403' | '500' | 'success' | 'error' | 'info' | 'warning';
    title?: ReactNode;
    subTitle?: ReactNode;
    extra?: ReactNode;
    className?: string;
    style?: React.CSSProperties;
    children?: ReactNode;
  }
  export const Result: React.FC<ResultProps>;
} 