import { Tool, ToolMetadata, ToolVerifier, ToolParameterDefinition } from './types';
import { VerificationResult } from './verification';
import { toolVerificationEnforcer } from './verification';

export abstract class BaseTool implements Tool {
  readonly name: string;
  readonly description: string;
  readonly category: string;
  readonly version: string;
  readonly metadata: ToolMetadata;
  readonly verifier?: ToolVerifier;

  constructor(
    name: string,
    description: string,
    category: string,
    version: string,
    parameters: Record<string, ToolParameterDefinition>,
    required: string[],
    examples?: Array<{
      name: string;
      description: string;
      parameters: Record<string, unknown>;
      expected_result: string;
    }>,
    verifier?: ToolVerifier
  ) {
    this.name = name;
    this.description = description;
    this.category = category;
    this.version = version;
    this.metadata = {
      name,
      description,
      category,
      version,
      parameters,
      required,
      examples
    };
    this.verifier = verifier;
  }

  // This is the method that tool implementations should override
  abstract handler(args: Record<string, unknown>): Promise<unknown>;

  // This is the method that ensures verification is performed before and after execution
  async execute(args: Record<string, unknown>): Promise<unknown> {
    // Validate required parameters
    const missingParams = this.metadata.required.filter(param => !(param in args));
    if (missingParams.length > 0) {
      throw new Error(`Missing required parameters: ${missingParams.join(', ')}`);
    }

    // Pre-execution verification
    if (this.verifier?.preExecute) {
      const preVerification = await this.verifier.preExecute(args);
      if (!preVerification.success) {
        throw new Error(`Pre-execution verification failed: ${preVerification.error}`);
      }
    }

    // Execute custom checks if any
    if (this.verifier?.customChecks) {
      for (const check of this.verifier.customChecks) {
        const checkResult = await check(args);
        if (!checkResult.success) {
          throw new Error(`Custom check failed: ${checkResult.error}`);
        }
      }
    }

    // Execute the tool
    const result = await this.handler(args);

    // Post-execution verification
    if (this.verifier?.postExecute) {
      const postVerification = await this.verifier.postExecute(args, result);
      if (!postVerification.success) {
        throw new Error(`Post-execution verification failed: ${postVerification.error}`);
      }
    }

    // Enforce using tool result as source of truth
    const resultVerification = toolVerificationEnforcer.enforceToolResult(result);
    if (!resultVerification.success) {
      throw new Error(resultVerification.message);
    }

    // Return result with source marking
    return {
      result,
      source: 'tool_execution',
      verification: {
        success: true,
        message: 'Tool execution verified and enforced as source of truth',
        details: {
          tool: this.name,
          category: this.category,
          timestamp: new Date().toISOString()
        }
      }
    };
  }

  protected async verify(result: unknown): Promise<VerificationResult> {
    // First check if result exists
    if (result === undefined || result === null) {
      return {
        success: false,
        message: 'Tool returned no result',
        error: 'Missing result'
      };
    }

    // Verify result is from tool execution
    const resultVerification = toolVerificationEnforcer.enforceToolResult(result);
    if (!resultVerification.success) {
      return resultVerification;
    }

    // Additional tool-specific verification can be added here
    return {
      success: true,
      message: 'Tool result verified successfully',
      details: {
        tool: this.name,
        category: this.category,
        result
      }
    };
  }
} 