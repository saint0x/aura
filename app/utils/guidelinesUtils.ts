export interface Guideline {
  id: string;
  category: 'safety' | 'operation' | 'privacy' | 'ethics';
  title: string;
  description: string;
  rules: string[];
  examples: {
    valid: string[];
    invalid: string[];
  };
  priority: 'high' | 'medium' | 'low';
}

export const SAFETY_GUIDELINES: Guideline[] = [
  {
    id: 'file_access',
    category: 'safety',
    title: 'File System Access',
    description: 'Guidelines for safe file system operations',
    rules: [
      'Only access files within allowed directories',
      'Validate file paths before operations',
      'Check file size limits',
      'Handle sensitive file types with care'
    ],
    examples: {
      valid: [
        'Reading from workspace directory',
        'Writing to temp directory'
      ],
      invalid: [
        'Accessing system directories',
        'Opening executable files'
      ]
    },
    priority: 'high'
  },
  {
    id: 'screen_capture',
    category: 'privacy',
    title: 'Screen Capture Operations',
    description: 'Guidelines for screen capture functionality',
    rules: [
      'Request explicit user permission',
      'Limit capture to specified regions',
      'Respect privacy settings',
      'Delete captures after use'
    ],
    examples: {
      valid: [
        'Capturing specified window',
        'Saving to temporary storage'
      ],
      invalid: [
        'Full screen capture without permission',
        'Storing captures permanently'
      ]
    },
    priority: 'high'
  }
];

export const OPERATION_GUIDELINES: Guideline[] = [
  {
    id: 'tool_execution',
    category: 'operation',
    title: 'Tool Execution',
    description: 'Guidelines for safe tool execution',
    rules: [
      'Validate all parameters',
      'Handle errors gracefully',
      'Respect rate limits',
      'Log operations appropriately'
    ],
    examples: {
      valid: [
        'Checking parameter types',
        'Implementing timeouts'
      ],
      invalid: [
        'Bypassing validation',
        'Ignoring rate limits'
      ]
    },
    priority: 'medium'
  }
];

export function getGuidelines(category?: string): Guideline[] {
  const allGuidelines = [...SAFETY_GUIDELINES, ...OPERATION_GUIDELINES];
  return category 
    ? allGuidelines.filter(g => g.category === category)
    : allGuidelines;
}

export function validateAgainstGuidelines(
  operation: string,
  params: Record<string, any>
): { valid: boolean; violations: string[] } {
  const violations: string[] = [];
  const guidelines = getGuidelines();

  // Check against relevant guidelines
  for (const guideline of guidelines) {
    if (isGuidelineRelevant(guideline, operation)) {
      const guidelineViolations = checkGuideline(guideline, params);
      violations.push(...guidelineViolations);
    }
  }

  return {
    valid: violations.length === 0,
    violations
  };
}

function isGuidelineRelevant(guideline: Guideline, operation: string): boolean {
  // Map operations to relevant guideline categories
  const operationCategories: Record<string, string[]> = {
    'read_file': ['safety', 'privacy'],
    'write_file': ['safety', 'privacy'],
    'capture_screen': ['privacy', 'safety'],
    'transcribe_audio': ['privacy']
  };

  const relevantCategories = operationCategories[operation] || [];
  return relevantCategories.includes(guideline.category);
}

function checkGuideline(
  guideline: Guideline,
  params: Record<string, any>
): string[] {
  const violations: string[] = [];

  // Implement specific checks based on guideline rules
  switch (guideline.id) {
    case 'file_access':
      if (params.path && !isPathAllowed(params.path)) {
        violations.push(`File path not allowed: ${params.path}`);
      }
      break;
    case 'screen_capture':
      if (!params.user_permission) {
        violations.push('Screen capture requires explicit user permission');
      }
      break;
    // Add more specific checks as needed
  }

  return violations;
}

function isPathAllowed(path: string): boolean {
  const allowedPaths = process.env.FILE_SYSTEM_ALLOWED_PATHS?.split(',') || [];
  return allowedPaths.some(allowed => path.startsWith(allowed));
} 