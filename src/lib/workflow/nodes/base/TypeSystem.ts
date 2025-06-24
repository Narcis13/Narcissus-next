import { DataType } from '../../types/base';

export interface TypeSchema {
  type: DataType;
  nullable?: boolean;
  optional?: boolean;
  description?: string;
  properties?: Record<string, TypeSchema>; // For object types
  items?: TypeSchema; // For array types
  enum?: any[]; // For enum constraints
  format?: string; // For specific formats (e.g., 'email', 'url', 'uuid')
}

export interface TypeConstraint {
  min?: number | string;
  max?: number | string;
  pattern?: string;
  length?: number;
  minLength?: number;
  maxLength?: number;
  unique?: boolean;
}

export interface ExtendedTypeSchema extends TypeSchema {
  constraints?: TypeConstraint;
  transform?: (value: any) => any;
  serialize?: (value: any) => string;
  deserialize?: (value: string) => any;
}

export class TypeSystem {
  private static typeConverters = new Map<string, (value: any) => any>([
    ['string->number', (v) => Number(v)],
    ['string->boolean', (v) => v === 'true' || v === '1'],
    ['string->array', (v) => v.split(',').map(s => s.trim())],
    ['string->object', (v) => JSON.parse(v)],
    ['string->date', (v) => new Date(v)],
    ['number->string', (v) => String(v)],
    ['number->boolean', (v) => v !== 0],
    ['boolean->string', (v) => String(v)],
    ['boolean->number', (v) => v ? 1 : 0],
    ['array->string', (v) => v.join(',')],
    ['object->string', (v) => JSON.stringify(v)],
    ['date->string', (v) => v.toISOString()],
    ['any->json', (v) => JSON.stringify(v)],
    ['json->any', (v) => JSON.parse(v)]
  ]);
  
  static canConvert(from: DataType, to: DataType): boolean {
    if (from === to || from === 'any' || to === 'any') return true;
    return this.typeConverters.has(`${from}->${to}`);
  }
  
  static convert(value: any, from: DataType, to: DataType): any {
    if (from === to) return value;
    if (from === 'any' || to === 'any') return value;
    
    const converter = this.typeConverters.get(`${from}->${to}`);
    if (!converter) {
      throw new Error(`Cannot convert from ${from} to ${to}`);
    }
    
    try {
      return converter(value);
    } catch (error) {
      throw new Error(`Failed to convert value from ${from} to ${to}: ${error}`);
    }
  }
  
  static validateType(value: any, schema: TypeSchema): boolean {
    if (value === null) {
      return schema.nullable === true;
    }
    
    if (value === undefined) {
      return schema.optional === true;
    }
    
    switch (schema.type) {
      case 'string':
        return typeof value === 'string';
      
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      
      case 'boolean':
        return typeof value === 'boolean';
      
      case 'object':
        if (typeof value !== 'object' || Array.isArray(value)) return false;
        if (schema.properties) {
          return this.validateObjectProperties(value, schema.properties);
        }
        return true;
      
      case 'array':
        if (!Array.isArray(value)) return false;
        if (schema.items) {
          return value.every(item => this.validateType(item, schema.items!));
        }
        return true;
      
      case 'date':
        return value instanceof Date || !isNaN(Date.parse(value));
      
      case 'file':
        return value instanceof File || 
               (typeof value === 'object' && value?.type === 'file');
      
      case 'json':
        try {
          if (typeof value === 'string') JSON.parse(value);
          return true;
        } catch {
          return false;
        }
      
      case 'any':
        return true;
      
      default:
        return false;
    }
  }
  
  private static validateObjectProperties(obj: any, properties: Record<string, TypeSchema>): boolean {
    for (const [key, schema] of Object.entries(properties)) {
      if (!this.validateType(obj[key], schema)) {
        return false;
      }
    }
    return true;
  }
  
  static validateConstraints(value: any, schema: ExtendedTypeSchema): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!schema.constraints) {
      return { valid: true, errors };
    }
    
    const { constraints } = schema;
    
    if (constraints.min !== undefined && value < constraints.min) {
      errors.push(`Value must be >= ${constraints.min}`);
    }
    
    if (constraints.max !== undefined && value > constraints.max) {
      errors.push(`Value must be <= ${constraints.max}`);
    }
    
    if (constraints.pattern && typeof value === 'string') {
      const regex = new RegExp(constraints.pattern);
      if (!regex.test(value)) {
        errors.push(`Value does not match pattern: ${constraints.pattern}`);
      }
    }
    
    if (constraints.length !== undefined) {
      const length = Array.isArray(value) ? value.length : String(value).length;
      if (length !== constraints.length) {
        errors.push(`Length must be exactly ${constraints.length}`);
      }
    }
    
    if (constraints.minLength !== undefined) {
      const length = Array.isArray(value) ? value.length : String(value).length;
      if (length < constraints.minLength) {
        errors.push(`Length must be >= ${constraints.minLength}`);
      }
    }
    
    if (constraints.maxLength !== undefined) {
      const length = Array.isArray(value) ? value.length : String(value).length;
      if (length > constraints.maxLength) {
        errors.push(`Length must be <= ${constraints.maxLength}`);
      }
    }
    
    if (schema.enum && !schema.enum.includes(value)) {
      errors.push(`Value must be one of: ${schema.enum.join(', ')}`);
    }
    
    return { valid: errors.length === 0, errors };
  }
  
  static coerceType(value: any, targetType: DataType): any {
    if (value === null || value === undefined) return value;
    
    const currentType = this.inferType(value);
    if (currentType === targetType) return value;
    
    try {
      return this.convert(value, currentType, targetType);
    } catch {
      return value;
    }
  }
  
  static inferType(value: any): DataType {
    if (value === null || value === undefined) return 'any';
    if (typeof value === 'string') return 'string';
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'boolean';
    if (value instanceof Date) return 'date';
    if (value instanceof File) return 'file';
    if (Array.isArray(value)) return 'array';
    if (typeof value === 'object') return 'object';
    return 'any';
  }
  
  static createSchema(type: DataType, options?: Partial<ExtendedTypeSchema>): ExtendedTypeSchema {
    return {
      type,
      ...options
    };
  }
  
  static mergeSchemas(base: TypeSchema, override: Partial<TypeSchema>): TypeSchema {
    return {
      ...base,
      ...override,
      properties: base.properties || override.properties ? {
        ...base.properties,
        ...override.properties
      } : undefined
    };
  }
  
  static isCompatible(sourceSchema: TypeSchema, targetSchema: TypeSchema): boolean {
    if (targetSchema.type === 'any' || sourceSchema.type === 'any') return true;
    
    if (sourceSchema.type !== targetSchema.type) {
      return this.canConvert(sourceSchema.type, targetSchema.type);
    }
    
    if (sourceSchema.type === 'object' && targetSchema.type === 'object') {
      if (!targetSchema.properties) return true;
      if (!sourceSchema.properties) return false;
      
      for (const [key, targetProp] of Object.entries(targetSchema.properties)) {
        const sourceProp = sourceSchema.properties[key];
        if (!sourceProp && !targetProp.optional) return false;
        if (sourceProp && !this.isCompatible(sourceProp, targetProp)) return false;
      }
    }
    
    if (sourceSchema.type === 'array' && targetSchema.type === 'array') {
      if (!targetSchema.items) return true;
      if (!sourceSchema.items) return false;
      return this.isCompatible(sourceSchema.items, targetSchema.items);
    }
    
    return true;
  }
}