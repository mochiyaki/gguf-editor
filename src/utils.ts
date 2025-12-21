import * as vscode from "vscode";
import * as path from "path";
import { htmlContentTemplate, replaceMark } from "./constants";
import { GGMLQuantizationType, gguf, buildGgufHeader, GGUFValueType } from "@huggingface/gguf";

export async function getWebviewContent(
  uri: vscode.Uri,
  searchTerm: string = "",
  removedTensors: Set<string> = new Set()
) {
  const fileName = path.basename(uri.fsPath);
  const { metadataRows, tensorRows } = await getGGUFInfo(uri, searchTerm, removedTensors);

  const content = formatTemplate(htmlContentTemplate, {
    fileName,
    searchTerm,
    metadataRows,
    tensorRows,
  });

  return {
    htmlContent: content,
    fileName,
  };
}

async function getGGUFInfo(uri: vscode.Uri, searchTerm: string = "", removedTensors: Set<string> = new Set()) {
  const { metadata, tensorInfos } = await gguf(uri.fsPath, {
    allowLocalFile: true,
  });

  const metadataRows = Object.entries(metadata)
    .filter(([key, value]) => {
      return key.includes(searchTerm) || String(value).includes(searchTerm);
    })
    .map(([key, value]) => {
      const displayValue = Array.isArray(value) ? formatArray(value) : value;
      return `
        <tr>
          <td>${key}</td>
          <td><input type="text" class="metadata-input" data-key="${key}" value="${displayValue}" style="width: 100%; background: var(--input-bg); border: 1px solid var(--input-border); color: var(--text-color); padding: 4px;" /></td>
        </tr>`;
    })
    .join("");

  const tensorRows = tensorInfos
    .filter((tensorInfo) => !removedTensors.has(tensorInfo.name))
    .filter((tensorInfo) => {
      return (
        tensorInfo.name.includes(searchTerm) ||
        GGMLQuantizationType[tensorInfo.dtype].includes(searchTerm) ||
        tensorInfo.shape.join(", ").includes(searchTerm)
      );
    })
    .map(
      (tensorInfo) => `
        <tr>
          <td>${tensorInfo.name}</td>
          <td>[${tensorInfo.shape.join(", ")}]</td>
          <td>${GGMLQuantizationType[tensorInfo.dtype]}</td>
          <td><button onclick="removeTensor('${tensorInfo.name}')">Remove</button></td>
        </tr>`
    )
    .join("");

  return { metadataRows, tensorRows };
}

function formatArray(array: Array<any>) {
  const maxElements = vscode.workspace
    .getConfiguration("gguf-editor")
    .get<number>("maxArrayElements", 25);
  const displayedElements = array.slice(0, maxElements);
  const moreElements = array.length > maxElements ? ", ..." : "";
  return `[${displayedElements.join(", ")}${moreElements}]`;
}

function formatTemplate(template: string, values: Record<string, any>): string {
  return template.replace(
    new RegExp(replaceMark + "\\{(.*?)\\}" + replaceMark, "g"),
    (_, key) => {
      const value = values[key];
      return value !== undefined ? String(value) : "";
    }
  );
}

function parseValue(value: string, type: GGUFValueType): any {
  switch (type) {
    case GGUFValueType.STRING:
      return value;
    case GGUFValueType.UINT8:
    case GGUFValueType.INT8:
    case GGUFValueType.UINT16:
    case GGUFValueType.INT16:
    case GGUFValueType.UINT32:
    case GGUFValueType.INT32:
      return parseInt(value, 10);
    case GGUFValueType.UINT64:
    case GGUFValueType.INT64:
      return BigInt(value);
    case GGUFValueType.FLOAT32:
    case GGUFValueType.FLOAT64:
      return parseFloat(value);
    case GGUFValueType.BOOL:
      return value.toLowerCase() === 'true';
    case GGUFValueType.ARRAY:
      // For simplicity, assume it's a string array or parse as JSON if possible
      try {
        return JSON.parse(value);
      } catch {
        return value.split(',').map(s => s.trim());
      }
    default:
      return value;
  }
}

export async function saveGGUFMetadata(uri: vscode.Uri, updatedMetadata: Record<string, any>, removedTensors: Set<string> = new Set()): Promise<void> {
  const fs = require('fs');

  // Parse the original file with typed metadata
  const { metadata, tensorInfos, tensorDataOffset, littleEndian, typedMetadata, tensorInfoByteRange } = await gguf(uri.fsPath, {
    allowLocalFile: true,
    typedMetadata: true
  });

  // Update the typedMetadata with new values
  for (const [key, value] of Object.entries(updatedMetadata)) {
    if (typedMetadata[key]) {
      typedMetadata[key].value = parseValue(value, typedMetadata[key].type);
    }
  }

  // Read the original file as buffer
  const originalBuffer = fs.readFileSync(uri.fsPath);
  const originalFileBlob = new Blob([originalBuffer]);

  // Build the new header with updated metadata
  const newHeaderBlob = await buildGgufHeader(originalFileBlob, typedMetadata, {
    littleEndian,
    tensorInfoByteRange,
  });

  // Get the tensor data from the original file
  const tensorDataBlob = originalFileBlob.slice(Number(tensorDataOffset));

  // Combine new header and tensor data
  const newFileBlob = new Blob([newHeaderBlob, tensorDataBlob]);

  // Prompt user for new file location
  const defaultUri = uri.with({ path: uri.path.replace(/\.gguf$/, '_edited.gguf') });
  const newUri = await vscode.window.showSaveDialog({
    defaultUri,
    filters: { 'GGUF Files': ['gguf'] }
  });

  if (!newUri) {
    return; // User cancelled
  }

  // Write the new file
  const arrayBuffer = await newFileBlob.arrayBuffer();
  fs.writeFileSync(newUri.fsPath, Buffer.from(arrayBuffer));

  vscode.window.showInformationMessage(`GGUF file saved as ${path.basename(newUri.fsPath)}`);
}
