export interface JsonStore {
  read(path: string): Promise<{ value: unknown; etag: string } | null>;
  write(path: string, value: unknown, etag?: string): Promise<void>;
  paths(prefix: string): Promise<string[]>;
}
