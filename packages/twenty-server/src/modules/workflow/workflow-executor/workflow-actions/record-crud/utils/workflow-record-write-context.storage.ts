import { AsyncLocalStorage } from 'async_hooks';

// Workflows can run as the member who started them, so their writes are only told apart by this scope
const workflowRecordWriteStorage = new AsyncLocalStorage<{
  isWorkflowWrite: true;
}>();

export const runAsWorkflowRecordWrite = <T>(fn: () => Promise<T>): Promise<T> =>
  workflowRecordWriteStorage.run({ isWorkflowWrite: true }, fn);

export const isWorkflowRecordWrite = (): boolean =>
  workflowRecordWriteStorage.getStore()?.isWorkflowWrite === true;
