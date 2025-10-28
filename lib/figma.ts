// Figma API client functions

export interface FigmaNode {
  id: string;
  name: string;
  type: string;
  children?: FigmaNode[];
  characters?: string; // For text nodes
  fills?: any[];
  backgroundColor?: any;
  absoluteBoundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface FigmaFileData {
  name: string;
  lastModified: string;
  thumbnailUrl?: string;
  version?: string;
  document: FigmaNode;
  components?: Record<string, any>;
  styles?: Record<string, any>;
}

export interface FigmaDesignInfo {
  fileName: string;
  screens: Array<{
    name: string;
    type: string;
    elements: Array<{
      name: string;
      type: string;
      text?: string;
    }>;
  }>;
  components: string[];
  textContent: string[];
}

/**
 * Extract file key from Figma URL
 * Supports formats:
 * - https://www.figma.com/file/{key}/{title}
 * - https://www.figma.com/design/{key}/{title}
 */
export function extractFigmaFileKey(url: string): string | null {
  try {
    const patterns = [
      /figma\.com\/file\/([a-zA-Z0-9]+)/,
      /figma\.com\/design\/([a-zA-Z0-9]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  } catch (error) {
    console.error("Error extracting Figma file key:", error);
    return null;
  }
}

/**
 * Fetch Figma file data using the Figma REST API
 */
export async function fetchFigmaFile(fileKey: string, accessToken: string): Promise<FigmaFileData> {
  const response = await fetch(`https://api.figma.com/v1/files/${fileKey}`, {
    headers: {
      'X-Figma-Token': accessToken,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Figma API error: ${response.status} - ${errorText}`);
  }

  return await response.json();
}

/**
 * Recursively extract design information from Figma nodes
 */
function extractDesignInfo(node: FigmaNode, depth: number = 0): {
  screens: Array<{ name: string; type: string; elements: any[] }>;
  textContent: string[];
  components: string[];
} {
  const screens: Array<{ name: string; type: string; elements: any[] }> = [];
  const textContent: string[] = [];
  const components: string[] = [];

  // Consider frames at top level as screens
  if (depth === 1 && (node.type === 'FRAME' || node.type === 'COMPONENT')) {
    const elements: any[] = [];

    // Extract elements from this screen
    function extractElements(n: FigmaNode) {
      if (n.type === 'TEXT' && n.characters) {
        elements.push({
          name: n.name,
          type: 'TEXT',
          text: n.characters,
        });
        textContent.push(n.characters);
      } else if (n.type === 'COMPONENT' || n.type === 'INSTANCE') {
        elements.push({
          name: n.name,
          type: n.type,
        });
        components.push(n.name);
      } else if (['RECTANGLE', 'ELLIPSE', 'VECTOR', 'BOOLEAN_OPERATION'].includes(n.type)) {
        elements.push({
          name: n.name,
          type: n.type,
        });
      }

      // Recursively process children
      if (n.children) {
        n.children.forEach(extractElements);
      }
    }

    if (node.children) {
      node.children.forEach(extractElements);
    }

    screens.push({
      name: node.name,
      type: node.type,
      elements,
    });
  }

  // Recursively process children for screens
  if (node.children) {
    node.children.forEach(child => {
      const childInfo = extractDesignInfo(child, depth + 1);
      screens.push(...childInfo.screens);
      textContent.push(...childInfo.textContent);
      components.push(...childInfo.components);
    });
  }

  return { screens, textContent, components };
}

/**
 * Parse Figma file data into structured design information
 */
export function parseFigmaDesign(fileData: FigmaFileData): FigmaDesignInfo {
  const { screens, textContent, components } = extractDesignInfo(fileData.document);

  // Deduplicate components
  const uniqueComponents = Array.from(new Set(components));

  return {
    fileName: fileData.name,
    screens,
    components: uniqueComponents,
    textContent,
  };
}

/**
 * Format Figma design info for AI prompt
 */
export function formatFigmaInfoForPrompt(designInfo: FigmaDesignInfo): string {
  let prompt = `## Figma 디자인 정보\n\n`;
  prompt += `**파일명:** ${designInfo.fileName}\n\n`;

  if (designInfo.screens.length > 0) {
    prompt += `### 화면 구성 (총 ${designInfo.screens.length}개)\n\n`;
    designInfo.screens.forEach((screen, index) => {
      prompt += `#### ${index + 1}. ${screen.name}\n`;
      prompt += `- **타입:** ${screen.type}\n`;
      prompt += `- **요소 수:** ${screen.elements.length}개\n`;

      if (screen.elements.length > 0) {
        prompt += `- **주요 요소:**\n`;
        screen.elements.slice(0, 10).forEach(element => {
          if (element.type === 'TEXT' && element.text) {
            prompt += `  - ${element.name}: "${element.text}"\n`;
          } else {
            prompt += `  - ${element.name} (${element.type})\n`;
          }
        });
        if (screen.elements.length > 10) {
          prompt += `  - ... 외 ${screen.elements.length - 10}개\n`;
        }
      }
      prompt += `\n`;
    });
  }

  if (designInfo.components.length > 0) {
    prompt += `### 사용된 컴포넌트\n`;
    designInfo.components.slice(0, 20).forEach(comp => {
      prompt += `- ${comp}\n`;
    });
    if (designInfo.components.length > 20) {
      prompt += `- ... 외 ${designInfo.components.length - 20}개\n`;
    }
    prompt += `\n`;
  }

  return prompt;
}
