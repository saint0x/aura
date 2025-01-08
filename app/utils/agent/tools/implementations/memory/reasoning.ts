import { BaseTool } from '../../base';
import { ToolParameterDefinition, ToolMetadata, ToolParameter, ToolExample, MemoryType } from '@/app/utils/agent/types';
import { memoryManager } from '@/app/utils/memoryUtils';

export class ReasoningChainTool extends BaseTool {
  public readonly name = 'reasoning_chain';
  public readonly description = 'Manage reasoning chains and steps';
  public readonly version = '1.0.0';
  public readonly category = 'memory';
  public readonly parameters: ToolParameter[] = [
    {
      name: 'action',
      type: 'string',
      description: 'Action to perform (start, add_step, conclude)',
      required: true,
      validation: [{
        type: 'enum',
        values: ['start', 'add_step', 'conclude']
      }]
    },
    {
      name: 'chain_id',
      type: 'string',
      description: 'ID of the reasoning chain (required for add_step and conclude)',
      required: false
    },
    {
      name: 'step_type',
      type: 'string',
      description: 'Type of reasoning step (observation, thought, action, result)',
      required: false,
      validation: [{
        type: 'enum',
        values: ['observation', 'thought', 'action', 'result']
      }]
    },
    {
      name: 'content',
      type: 'string',
      description: 'Content of the step or conclusion',
      required: false
    },
    {
      name: 'metadata',
      type: 'object',
      description: 'Additional metadata for the step or chain',
      required: false
    }
  ];

  public readonly metadata: ToolMetadata = {
    name: this.name,
    description: this.description,
    category: this.category,
    version: this.version,
    parameters: {
      action: {
        type: 'string',
        description: 'Action to perform (start, add_step, conclude)',
        enum: ['start', 'add_step', 'conclude']
      },
      chain_id: {
        type: 'string',
        description: 'ID of the reasoning chain (required for add_step and conclude)'
      },
      step_type: {
        type: 'string',
        description: 'Type of reasoning step (observation, thought, action, result)',
        enum: ['observation', 'thought', 'action', 'result']
      },
      content: {
        type: 'string',
        description: 'Content of the step or conclusion'
      },
      metadata: {
        type: 'object',
        description: 'Additional metadata for the step or chain'
      }
    },
    required: ['action'],
    examples: this.examples
  };

  public readonly examples: ToolExample[] = [
    {
      name: 'Start reasoning chain',
      description: 'Start a new reasoning chain',
      parameters: {
        action: 'start',
        metadata: { task: 'Analyze code structure' }
      },
      expected_result: 'New chain ID'
    },
    {
      name: 'Add reasoning step',
      description: 'Add a step to an existing reasoning chain',
      parameters: {
        action: 'add_step',
        chain_id: '123',
        step_type: 'observation',
        content: 'Found potential issue in code',
        metadata: { confidence: 0.8 }
      },
      expected_result: 'Step added successfully'
    }
  ];

  private stepNumber = 0;

  async handler(args: Record<string, unknown>): Promise<unknown> {
    const { action, chain_id, step_type, content } = args;
    const metadataArg = args.metadata as Record<string, unknown> || {};

    if (typeof action !== 'string') {
      throw new Error('Action must be a string');
    }

    try {
      switch (action) {
        case 'start': {
          await memoryManager.store(
            'reasoning_chain',
            'Starting new reasoning chain',
            'reasoning_step' as MemoryType,
            {
              type: 'start',
              ...metadataArg
            }
          );
          return {
            success: true,
            chain_id: Date.now().toString()
          };
        }

        case 'add_step': {
          if (!chain_id || typeof chain_id !== 'string') {
            throw new Error('Chain ID is required for adding steps');
          }

          if (!step_type || typeof step_type !== 'string') {
            throw new Error('Step type is required');
          }

          if (!content || typeof content !== 'string') {
            throw new Error('Content is required');
          }

          await memoryManager.store(
            `${chain_id}_step_${Date.now()}`,
            content,
            'reasoning_step' as MemoryType,
            {
              chain_id,
              type: step_type,
              ...metadataArg
            }
          );

          return {
            success: true,
            chain_id,
            step_type,
            content
          };
        }

        case 'conclude': {
          if (!chain_id || typeof chain_id !== 'string') {
            throw new Error('Chain ID is required for concluding');
          }

          if (!content || typeof content !== 'string') {
            throw new Error('Content is required for conclusion');
          }

          await memoryManager.store(
            `${chain_id}_conclusion`,
            content,
            'conclusion' as MemoryType,
            {
              chain_id,
              ...metadataArg
            }
          );

          return {
            success: true,
            chain_id,
            conclusion: content
          };
        }

        default:
          throw new Error(`Unknown action: ${action}`);
      }
    } catch (error) {
      throw new Error(`Reasoning operation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
} 