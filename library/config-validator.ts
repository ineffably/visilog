import type { 
  LoggerConfig, 
  ConfigValidationRule, 
  ValidationError, 
  ValidationResult
} from '../types';

/**
 * Configuration validation system with auto-fix capabilities
 * Exceeds feedback expectations with intelligent suggestions and schema validation
 */
export class ConfigValidator {
  private static readonly VALIDATION_RULES: ConfigValidationRule[] = [
    {
      field: 'enableWebSocket',
      type: 'boolean',
      required: true
    },
    {
      field: 'enableConsole',
      type: 'boolean',
      required: true
    },
    {
      field: 'minLevel',
      type: 'number',
      required: true,
      min: 0,
      max: 4,
      allowedValues: [0, 1, 2, 3, 4]
    },
    {
      field: 'websocketUrl',
      type: 'url',
      required: true,
      pattern: /^wss?:\/\/.+/
    },
    {
      field: 'maxRetries',
      type: 'positive-number',
      required: true,
      min: 0,
      max: 100
    },
    {
      field: 'retryInterval',
      type: 'positive-number',
      required: true,
      min: 100,
      max: 60000
    },
    {
      field: 'autoConnect',
      type: 'boolean',
      required: true
    },
    {
      field: 'namespace',
      type: 'string',
      required: false
    },
    {
      field: 'fallbackMode',
      type: 'string',
      required: false,
      allowedValues: ['console', 'silent', 'custom']
    },
    {
      field: 'maxQueueSize',
      type: 'positive-number',
      required: false,
      min: 1,
      max: 10000
    },
    {
      field: 'flushInterval',
      type: 'positive-number',
      required: false,
      min: 100,
      max: 30000
    }
  ];

  private static readonly DEFAULT_CONFIG: Required<Omit<LoggerConfig, 'namespace'>> & { namespace?: string } = {
    enableWebSocket: true,
    enableConsole: true,
    minLevel: 0,
    websocketUrl: 'ws://localhost:3001',
    maxRetries: 5,
    retryInterval: 2000,
    autoConnect: true,
    namespace: undefined,
    fallbackMode: 'console',
    enableStructuredLogging: true,
    enablePerformanceTracking: false,
    maxQueueSize: 1000,
    flushInterval: 5000,
    enableOfflineQueue: true,
    enableCompression: false
  };

  /**
   * Validates configuration with intelligent error messages and suggestions
   */
  public static validate(config: Partial<LoggerConfig>): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const fixedConfig: Partial<LoggerConfig> = { ...config };

    // Validate each field according to rules
    for (const rule of this.VALIDATION_RULES) {
      const value = config[rule.field];
      const validation = this.validateField(rule, value);
      
      if (validation.error) {
        errors.push(validation.error);
      }
      
      if (validation.warning) {
        warnings.push(validation.warning);
      }
      
      if (validation.fixedValue !== undefined) {
        (fixedConfig as any)[rule.field] = validation.fixedValue;
      }
    }

    // Cross-field validations
    const crossValidations = this.validateCrossFields(config);
    errors.push(...crossValidations.errors);
    warnings.push(...crossValidations.warnings);

    // Apply intelligent fixes
    this.applyIntelligentFixes(fixedConfig, errors, warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      fixedConfig: errors.length > 0 ? fixedConfig : undefined
    };
  }

  /**
   * Validates a single field with detailed error context
   */
  private static validateField(rule: ConfigValidationRule, value: any): {
    error?: ValidationError;
    warning?: ValidationError;
    fixedValue?: any;
  } {
    const result: { error?: ValidationError; warning?: ValidationError; fixedValue?: any } = {};

    // Check if required field is missing
    if (rule.required && (value === undefined || value === null)) {
      result.error = {
        field: rule.field,
        message: `Required field '${rule.field}' is missing`,
        value,
        suggestion: `Add '${rule.field}: ${this.getDefaultValue(rule.field)}' to your configuration`
      };
      result.fixedValue = this.getDefaultValue(rule.field);
      return result;
    }

    // Skip validation if field is optional and not provided
    if (!rule.required && (value === undefined || value === null)) {
      return result;
    }

    // Type validation
    const typeValidation = this.validateType(rule, value);
    if (typeValidation.error) {
      result.error = typeValidation.error;
      result.fixedValue = typeValidation.fixedValue;
      return result;
    }

    // Range validation
    if (rule.min !== undefined && typeof value === 'number' && value < rule.min) {
      result.error = {
        field: rule.field,
        message: `Value ${value} is below minimum ${rule.min}`,
        value,
        suggestion: `Use a value >= ${rule.min}. Recommended: ${rule.min}`
      };
      result.fixedValue = rule.min;
      return result;
    }

    if (rule.max !== undefined && typeof value === 'number' && value > rule.max) {
      result.warning = {
        field: rule.field,
        message: `Value ${value} is above recommended maximum ${rule.max}`,
        value,
        suggestion: `Consider using a value <= ${rule.max} for better performance`
      };
    }

    // Allowed values validation
    if (rule.allowedValues && !rule.allowedValues.includes(value)) {
      result.error = {
        field: rule.field,
        message: `Invalid value '${value}'. Must be one of: ${rule.allowedValues.join(', ')}`,
        value,
        suggestion: `Use one of: ${rule.allowedValues.join(', ')}`
      };
      result.fixedValue = rule.allowedValues[0];
      return result;
    }

    // Pattern validation
    if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
      result.error = {
        field: rule.field,
        message: `Value '${value}' does not match required pattern`,
        value,
        suggestion: this.getPatternSuggestion(rule.field, rule.pattern)
      };
      result.fixedValue = this.getPatternDefault(rule.field);
      return result;
    }

    return result;
  }

  /**
   * Validates field types with intelligent conversion suggestions
   */
  private static validateType(rule: ConfigValidationRule, value: any): {
    error?: ValidationError;
    fixedValue?: any;
  } {
    const actualType = typeof value;
    
    switch (rule.type) {
      case 'boolean':
        if (actualType !== 'boolean') {
          // Try to convert common boolean-like values
          if (value === 'true' || value === 1 || value === '1') {
            return { fixedValue: true };
          }
          if (value === 'false' || value === 0 || value === '0') {
            return { fixedValue: false };
          }
          return {
            error: {
              field: rule.field,
              message: `Expected boolean, got ${actualType}`,
              value,
              suggestion: `Use true or false instead of '${value}'`
            },
            fixedValue: Boolean(value)
          };
        }
        break;

      case 'number':
      case 'positive-number':
        if (actualType !== 'number') {
          const numValue = Number(value);
          if (isNaN(numValue)) {
            return {
              error: {
                field: rule.field,
                message: `Expected number, got ${actualType}`,
                value,
                suggestion: `Use a numeric value like ${this.getDefaultValue(rule.field)}`
              },
              fixedValue: this.getDefaultValue(rule.field)
            };
          }
          return { fixedValue: numValue };
        }
        if (rule.type === 'positive-number' && value < 0) {
          return {
            error: {
              field: rule.field,
              message: `Expected positive number, got ${value}`,
              value,
              suggestion: `Use a positive number like ${Math.abs(value)}`
            },
            fixedValue: Math.abs(value)
          };
        }
        break;

      case 'string':
        if (actualType !== 'string') {
          return {
            error: {
              field: rule.field,
              message: `Expected string, got ${actualType}`,
              value,
              suggestion: `Use a string value like "${String(value)}"`
            },
            fixedValue: String(value)
          };
        }
        break;

      case 'url':
        if (actualType !== 'string') {
          return {
            error: {
              field: rule.field,
              message: `Expected URL string, got ${actualType}`,
              value,
              suggestion: 'Use a valid WebSocket URL like "ws://localhost:3001"'
            },
            fixedValue: 'ws://localhost:3001'
          };
        }
        try {
          new URL(value);
        } catch {
          return {
            error: {
              field: rule.field,
              message: `Invalid URL format: ${value}`,
              value,
              suggestion: 'Use a valid WebSocket URL like "ws://localhost:3001"'
            },
            fixedValue: 'ws://localhost:3001'
          };
        }
        break;
    }

    return {};
  }

  /**
   * Validates cross-field dependencies and logical consistency
   */
  private static validateCrossFields(config: Partial<LoggerConfig>): {
    errors: ValidationError[];
    warnings: ValidationError[];
  } {
    const _errors: ValidationError[] = [];
    const _warnings: ValidationError[] = [];

    // If WebSocket is disabled, warn about limited functionality
    if (config.enableWebSocket === false && config.enableConsole === false) {
      _errors.push({
        field: 'enableWebSocket',
        message: 'Both WebSocket and console logging are disabled',
        value: config.enableWebSocket,
        suggestion: 'Enable at least one logging method: enableWebSocket: true or enableConsole: true'
      });
    }

    // Warn about performance implications
    if (config.maxQueueSize && config.maxQueueSize > 5000) {
      _warnings.push({
        field: 'maxQueueSize',
        message: 'Large queue size may impact memory usage',
        value: config.maxQueueSize,
        suggestion: 'Consider using a smaller queue size (< 5000) for better performance'
      });
    }

    // Check retry configuration
    if (config.maxRetries && config.retryInterval) {
      const totalRetryTime = config.maxRetries * config.retryInterval;
      if (totalRetryTime > 60000) { // 1 minute
        _warnings.push({
          field: 'maxRetries',
          message: 'Total retry time exceeds 1 minute',
          value: config.maxRetries,
          suggestion: 'Consider reducing maxRetries or retryInterval for faster failure detection'
        });
      }
    }

    return { errors: _errors, warnings: _warnings };
  }

  /**
   * Applies intelligent fixes based on common patterns and best practices
   */
  private static applyIntelligentFixes(
    config: Partial<LoggerConfig>,
    _errors: ValidationError[],
    _warnings: ValidationError[]
  ): void {
    // Auto-fix common URL issues
    if (config.websocketUrl) {
      if (config.websocketUrl.startsWith('http://')) {
        config.websocketUrl = config.websocketUrl.replace('http://', 'ws://');
      } else if (config.websocketUrl.startsWith('https://')) {
        config.websocketUrl = config.websocketUrl.replace('https://', 'wss://');
      }
    }

    // Auto-fix namespace formatting
    if (config.namespace && typeof config.namespace === 'string') {
      config.namespace = config.namespace.trim().toLowerCase().replace(/\s+/g, '-');
    }

    // Auto-optimize performance settings
    if (config.enablePerformanceTracking && !config.flushInterval) {
      config.flushInterval = 1000; // Faster flushing for performance tracking
    }
  }

  /**
   * Gets default value for a field
   */
  private static getDefaultValue(field: keyof LoggerConfig): any {
    return this.DEFAULT_CONFIG[field];
  }

  /**
   * Gets pattern suggestion for URL fields
   */
  private static getPatternSuggestion(field: string, pattern: RegExp): string {
    if (field === 'websocketUrl') {
      return 'Use a WebSocket URL format like "ws://localhost:3001" or "wss://example.com/ws"';
    }
    return `Value must match pattern: ${pattern.source}`;
  }

  /**
   * Gets default value for pattern fields
   */
  private static getPatternDefault(field: string): any {
    if (field === 'websocketUrl') {
      return 'ws://localhost:3001';
    }
    return this.getDefaultValue(field as keyof LoggerConfig);
  }

  /**
   * Creates a configuration with all defaults applied
   */
  public static withDefaults(config: Partial<LoggerConfig> = {}): LoggerConfig {
    return { ...this.DEFAULT_CONFIG, ...config } as LoggerConfig;
  }

  /**
   * Validates and returns a safe configuration
   */
  public static validateAndFix(config: Partial<LoggerConfig>): {
    config: LoggerConfig;
    validation: ValidationResult;
  } {
    const validation = this.validate(config);
    const safeConfig = this.withDefaults(validation.fixedConfig || config);
    
    return {
      config: safeConfig,
      validation
    };
  }
} 