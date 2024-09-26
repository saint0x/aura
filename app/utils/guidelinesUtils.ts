export const toolGuidelines = {
  createFile: {
    input: {
      path: "string (e.g., 'path/to/file.txt')",
      content: "string (file content)"
    },
    output: {
      success: "boolean",
      result: "string (success message or error description)"
    }
  },
  readFile: {
    input: {
      path: "string (e.g., 'path/to/file.txt')"
    },
    output: {
      success: "boolean",
      result: "string (file content or error description)"
    }
  },
  deleteFile: {
    input: {
      path: "string (e.g., 'path/to/file.txt')"
    },
    output: {
      success: "boolean",
      result: "string (success message or error description)"
    }
  },
  listFiles: {
    input: {
      directory: "string (e.g., '/' for root directory)"
    },
    output: {
      success: "boolean",
      result: "array of strings (file/directory names)"
    }
  },
  captureScreenshot: {
    input: {},
    output: {
      success: "boolean",
      result: "string (base64 encoded image data or error description)"
    }
  }
};

export function getToolGuidelinesString(): string {
  return JSON.stringify(toolGuidelines, null, 2);
}