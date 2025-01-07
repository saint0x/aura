import { BaseTool } from '../../baseTool';
import { ToolMetadata, ToolParameterDefinition } from '../../types';
import { memoryManager } from '@/app/utils/memoryUtils';
import { MemoryType } from '@/app/utils/agent/types';

export class ReasoningChainTool extends BaseTool {
  constructor() {
    const parameters: Record<string, ToolParameterDefinition> = {
      action: {
        type: 'string',
        description: 'Action to perform (start, add_step, conclude)',
        required: true,
        enum: ['start', 'add_step', 'conclude']
      },
      chain_id: {
        type: 'string',
        description: 'ID of the reasoning chain (required for add_step and conclude)',
        required: false
      },
      step_type: {
        type: 'string',
        description: 'Type of reasoning step (observation, thought, action, result)',
        required: false,
        enum: ['observation', 'thought', 'action', 'result']
      },
      content: {
        type: 'string',
        description: 'Content of the step or conclusion',
        required: false
      },
      metadata: {
        type: 'object',
        description: 'Additional metadata for the step or chain',
        required: false
      }
    };

    const examples = [
      {
        name: 'Start chain',
        description: 'Start a new reasoning chain',
        parameters: {
          action: 'start',
          metadata: {
            task: 'Debug performance issue'
          }
        },
        expected_result: 'New chain ID'
      },
      {
        name: 'Add step',
        description: 'Add a reasoning step to an existing chain',
        parameters: {
          action: 'add_step',
          chain_id: '123e4567-e89b-12d3-a456-426614174000',
          step_type: 'observation',
          content: 'High CPU usage detected in monitoring',
          metadata: {
            confidence: 0.9
          }
        },
        expected_result: 'Updated chain with new step'
      },
      {
        name: 'Conclude chain',
        description: 'Add a conclusion to a reasoning chain',
        parameters: {
          action: 'conclude',
          chain_id: '123e4567-e89b-12d3-a456-426614174000',
          content: 'Memory leak in background worker identified as root cause',
          metadata: {
            confidence: 0.85,
            recommended_action: 'Fix memory management in worker.js'
          }
        },
        expected_result: 'Chain marked as concluded with final conclusion'
      }
    ];

    super(
      'reasoning_chain',
      'Manage reasoning chains for tracking thought process and conclusions',
      'memory',
      '1.0.0',
      parameters,
      ['action'],
      examples
    );
  }

  public async handler(args: Record<string, unknown>): Promise<unknown> {
    const { action, chain_id, step_type, content, metadata } = args;

    switch (action) {
      case 'start': {
        const chainId = crypto.randomUUID();
        await memoryManager.store(
          'system',
          'Started new reasoning chain',
          'reasoning_step' as MemoryType,
          {
            reasoning_chain_id: chainId,
            ...(metadata as Record<string, unknown> || {})
          }
        );
        return { chain_id: chainId };
      }

      case 'add_step': {
        if (!chain_id) {
          throw new Error('chain_id is required for add_step action');
        }
        if (!step_type) {
          throw new Error('step_type is required for add_step action');
        }
        if (!content) {
          throw new Error('content is required for add_step action');
        }

        await memoryManager.store(
          'system',
          content as string,
          'reasoning_step' as MemoryType,
          {
            reasoning_chain_id: chain_id,
            step_type,
            ...(metadata as Record<string, unknown> || {})
          }
        );

        return { success: true, message: 'Step added to chain' };
      }

      case 'conclude': {
        if (!chain_id) {
          throw new Error('chain_id is required for conclude action');
        }
        if (!content) {
          throw new Error('content is required for conclude action');
        }

        await memoryManager.store(
          'system',
          content as string,
          'conclusion' as MemoryType,
          {
            reasoning_chain_id: chain_id,
            ...(metadata as Record<string, unknown> || {})
          }
        );

        return { success: true, message: 'Chain concluded' };
      }

      default:
        throw new Error(`Invalid action: ${action}`);
    }
  }
} 