import { BaseTool } from '../../base';
import { ToolParameterDefinition, ToolMetadata, ToolParameter, ToolExample } from '@/app/utils/agent/types';
import { captureScreen } from '../../../../../utils/screenUtils';

export class ScreenCaptureTool extends BaseTool {
  public readonly name = 'screen_capture';
  public readonly description = 'Capture screen content';
  public readonly version = '1.0.0';
  public readonly category = 'screen';
  public readonly parameters: ToolParameter[] = [
    {
      name: 'area',
      type: 'string',
      description: 'Area to capture (full, window, selection)',
      required: true,
      validation: [{
        type: 'enum',
        values: ['full', 'window', 'selection']
      }]
    },
    {
      name: 'format',
      type: 'string',
      description: 'Output format (png, jpg)',
      required: false,
      validation: [{
        type: 'enum',
        values: ['png', 'jpg']
      }]
    },
    {
      name: 'explanation',
      type: 'string',
      description: 'One sentence explanation as to why this tool is being used, and how it contributes to the goal.',
      required: true
    }
  ];

  public readonly metadata: ToolMetadata = {
    name: this.name,
    description: this.description,
    category: this.category,
    version: this.version,
    parameters: {
      area: {
        type: 'string',
        description: 'Area to capture (full, window, selection)',
        enum: ['full', 'window', 'selection']
      },
      format: {
        type: 'string',
        description: 'Output format (png, jpg)',
        enum: ['png', 'jpg']
      },
      explanation: {
        type: 'string',
        description: 'One sentence explanation as to why this tool is being used, and how it contributes to the goal.'
      }
    },
    required: ['area', 'explanation'],
    examples: this.examples
  };

  public readonly examples: ToolExample[] = [
    {
      name: 'Capture full screen',
      description: 'Take a screenshot of the entire screen',
      parameters: {
        area: 'full',
        format: 'png',
        explanation: 'Capturing full screen to analyze layout'
      },
      expected_result: 'Screenshot saved as PNG'
    },
    {
      name: 'Capture window',
      description: 'Take a screenshot of the active window',
      parameters: {
        area: 'window',
        format: 'jpg',
        explanation: 'Capturing active window for documentation'
      },
      expected_result: 'Screenshot saved as JPG'
    }
  ];

  async handler(args: Record<string, unknown>): Promise<unknown> {
    const { area, format = 'png' } = args;

    if (typeof area !== 'string') {
      throw new Error('area must be a string');
    }

    if (format !== undefined && typeof format !== 'string') {
      throw new Error('format must be a string');
    }

    try {
      const result = await captureScreen({
        area,
        format: format as 'png' | 'jpg'
      });

      return {
        success: true,
        result: {
          area,
          format,
          path: result.path,
          dimensions: result.dimensions
        }
      };
    } catch (error) {
      throw new Error(`Failed to capture screen: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
} 