export type NormalizedError = {
  code: string;              
  httpStatus?: number;
  userMessage: string;       
  devMessage?: string;       
  field?: string;             
  correlationId?: string;
  raw?: unknown;            
  retriable?: boolean;
  category?: 'validation' | 'auth' | 'permission' | 'conflict' | 'server' | 'network' | 'unknown';
};

export type ErrorResolver = (err: NormalizedError) => string;

export type ErrorMap = Record<string, { 
  defaultMessage: string | ErrorResolver;
  category?: NormalizedError['category'];
  retriable?: boolean;
  overrides?: Partial<Record<'default', string | ErrorResolver>>;
}>;