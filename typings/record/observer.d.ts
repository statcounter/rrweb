import { observerParam, listenerHandler, hooksParam } from '../types';
import MutationBuffer from './mutation';
export declare const mutationBuffer: MutationBuffer;
export declare function initObservers(o: observerParam, hooks?: hooksParam): listenerHandler;
