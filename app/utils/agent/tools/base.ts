import { ToolMetadata, ToolVerifier } from './types';
import { ToolVerification, VerificationResult } from './verification';

export abstract class BaseTool {
  public abstract readonly name: string;
  public abstract readonly description: string;
  public abstract readonly version: string;
  public abstract readonly category: string;
  public abstract readonly parameters: Array<{
    name: string;
    type: string;
    description: string;
    required: boolean;
  }>;

  public abstract get metadata(): ToolMetadata;
  public readonly verifier?: ToolVerifier;

  protected abstract handler(params: Record<string, unknown>): Promise<unknown>;

  private async runVerification(
    type: 'pre' | 'post' | 'custom',
    params: Record<string, unknown>,
    result?: unknown
  ): Promise<VerificationResult[]> {
    const results: VerificationResult[] = [];

    // Run tool-specific verifications if they exist
    if (this.verifier) {
      try {
        if (type === 'pre' && this.verifier.preExecute) {
          results.push(await this.verifier.preExecute(params));
        }
        if (type === 'post' && this.verifier.postExecute && result !== undefined) {
          results.push(await this.verifier.postExecute(params, result));
        }
        if (type === 'custom' && this.verifier.customChecks) {
          for (const check of this.verifier.customChecks) {
            results.push(await check(params, result));
          }
        }
      } catch (error) {
        results.push({
          success: false,
          message: `Verification failed: ${(error as Error).message}`,
          details: { error: (error as Error).message }
        });
      }
    }

    // Run generic tool verification
    if (type === 'post') {
      results.push(
        await ToolVerification.verifyToolExecution({
          toolName: this.name,
          operation: `${this.name} execution`,
          params,
          result
        })
      );
    }

    return results;
  }

  private async validateVerificationResults(results: VerificationResult[]): Promise<void> {
    const failures = results.filter(r => !r.success);
    if (failures.length > 0) {
      const messages = failures.map(f => f.message).join('; ');
      throw new Error(`Verification failed: ${messages}`);
    }
  }

  public async execute(params: Record<string, unknown>): Promise<unknown> {
    try {
      // Pre-execution verification
      const preResults = await this.runVerification('pre', params);
      await this.validateVerificationResults(preResults);

      // Execute the tool operation
      const result = await this.handler(params);

      // Post-execution verification
      const postResults = await this.runVerification('post', params, result);
      await this.validateVerificationResults(postResults);

      // Custom checks
      const customResults = await this.runVerification('custom', params, result);
      await this.validateVerificationResults(customResults);

      // Return both the result and verification details
      return {
        result,
        verification: {
          pre: preResults,
          post: postResults,
          custom: customResults
        }
      };
    } catch (error) {
      throw new Error(`Tool execution failed: ${(error as Error).message}`);
    }
  }

  public async verify(params: Record<string, unknown>): Promise<VerificationResult[]> {
    const results = [];
    results.push(...await this.runVerification('pre', params));
    results.push(...await this.runVerification('custom', params));
    return results;
  }
} 