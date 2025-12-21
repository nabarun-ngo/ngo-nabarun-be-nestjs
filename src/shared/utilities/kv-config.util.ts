import { KeyValueDto } from "../dto/KeyValue.dto";
import { KeyValueConfig } from "../models/key-value-config.model";

export function parseKeyValueConfigs(
  jsonString: string,
  auditLogger?: (msg: string, data?: any) => void
): KeyValueConfig[] {
  try {
    const raw = JSON.parse(jsonString);
    if (!Array.isArray(raw)) throw new Error('Expected an array of objects');

    const parsed = raw
      .filter(KeyValueConfig.isValid)
      .map((item) => new KeyValueConfig(item));

    if (auditLogger) {
      auditLogger('Parsed KeyValueConfig entries', {
        count: parsed.length,
        keys: parsed.map((c) => c.KEY),
      });
    }

    return parsed;
  } catch (err) {
    if (auditLogger) {
      auditLogger('Failed to parse KeyValueConfig JSON', { error: err.message });
    }
    throw new Error(`Invalid KeyValueConfig JSON: ${err.message}`);
  }
}


export function parsefromString<T>(
  jsonString: string,
): T {
  const raw = JSON.parse(jsonString);
  return raw as T;
}

export function toKeyValueDto(keyValue: KeyValueConfig): KeyValueDto {
  return {
    key: keyValue.KEY,
    displayValue: keyValue.VALUE,
    description: keyValue.DESCRIPTION,
    active: keyValue.ACTIVE,
  }
}

