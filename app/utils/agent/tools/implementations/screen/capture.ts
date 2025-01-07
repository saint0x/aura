import { BaseTool } from '../../base';
import { ValidationError } from '@/app/common/errors';
import screenshot from 'screenshot-desktop';
import { ToolMetadata } from '../../types';

interface CaptureRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class ScreenCaptureTool extends BaseTool {
  public readonly name = 'capture_screen';
  public readonly description = 'Capture a screenshot of the screen or a specific region';
  public readonly version = '1.0.0';
  public readonly category = 'screen';
  public readonly parameters = [
    {
      name: 'region',
      type: 'object' as const,
      description: 'The region to capture (optional). If not provided, captures entire screen.',
      required: false,
      schema: [
        {
          name: 'x',
          type: 'number' as const,
          description: 'X coordinate of the region',
          required: true,
          validation: [
            {
              type: 'range' as const,
              min: 0,
              max: 10000
            }
          ]
        },
        {
          name: 'y',
          type: 'number' as const,
          description: 'Y coordinate of the region',
          required: true,
          validation: [
            {
              type: 'range' as const,
              min: 0,
              max: 10000
            }
          ]
        },
        {
          name: 'width',
          type: 'number' as const,
          description: 'Width of the region',
          required: true,
          validation: [
            {
              type: 'range' as const,
              min: 1,
              max: 10000
            }
          ]
        },
        {
          name: 'height',
          type: 'number' as const,
          description: 'Height of the region',
          required: true,
          validation: [
            {
              type: 'range' as const,
              min: 1,
              max: 10000
            }
          ]
        }
      ]
    }
  ];

  public override get metadata(): ToolMetadata {
    return {
      name: this.name,
      description: this.description,
      category: this.category,
      version: this.version,
      parameters: {
        region: {
          type: 'object',
          description: 'The region to capture (optional). If not provided, captures entire screen.',
          required: false,
          schema: [
            {
              name: 'x',
              type: 'number',
              description: 'X coordinate of the region',
              required: true,
              validation: [
                {
                  type: 'range',
                  min: 0,
                  max: 10000
                }
              ]
            },
            {
              name: 'y',
              type: 'number',
              description: 'Y coordinate of the region',
              required: true,
              validation: [
                {
                  type: 'range',
                  min: 0,
                  max: 10000
                }
              ]
            },
            {
              name: 'width',
              type: 'number',
              description: 'Width of the region',
              required: true,
              validation: [
                {
                  type: 'range',
                  min: 1,
                  max: 10000
                }
              ]
            },
            {
              name: 'height',
              type: 'number',
              description: 'Height of the region',
              required: true,
              validation: [
                {
                  type: 'range',
                  min: 1,
                  max: 10000
                }
              ]
            }
          ]
        }
      },
      required: []
    };
  }

  public readonly examples = [
    {
      name: 'Capture entire screen',
      description: 'Take a screenshot of the entire screen',
      parameters: {},
      expected_result: 'Buffer containing the screenshot image'
    },
    {
      name: 'Capture specific region',
      description: 'Take a screenshot of a 500x500 region at coordinates (100,100)',
      parameters: {
        region: {
          x: 100,
          y: 100,
          width: 500,
          height: 500
        }
      },
      expected_result: 'Buffer containing the screenshot image of the specified region'
    }
  ];

  public async handler(params: Record<string, unknown>): Promise<unknown> {
    try {
      if ('region' in params) {
        const region = params.region as CaptureRegion;
        return await screenshot({
          screen: 0,
          x: region.x,
          y: region.y,
          width: region.width,
          height: region.height
        });
      }
      return await screenshot();
    } catch (error) {
      throw new ValidationError({
        message: `Failed to capture screenshot: ${(error as Error).message}`,
        param: 'region'
      });
    }
  }
} 