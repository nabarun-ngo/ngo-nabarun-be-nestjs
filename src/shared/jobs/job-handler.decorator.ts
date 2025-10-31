import { defineMetadata } from '../util/metadata.util';

export const JOB_HANDLER_METADATA = 'JOB_HANDLER_METADATA';

export function JobHandler(name: string): ClassDecorator {
  return (target: object) => {
    defineMetadata(JOB_HANDLER_METADATA, name, target);
  };
}