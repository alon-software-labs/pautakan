import { registerGameFlowHandlers } from './registerGameFlowHandlers';
import { registerScoreHandlers } from './registerScoreHandlers';

export function initializeIPC(): void {
  registerGameFlowHandlers();
  registerScoreHandlers();
}

