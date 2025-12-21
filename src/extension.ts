// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// // This method is called when your extension is activated
// // Your extension is activated the very first time the command is executed
// export function activate(context: vscode.ExtensionContext) {
// 	// Use the console to output diagnostic information (console.log) and errors (console.error)
// 	// This line of code will only be executed once when your extension is activated
// 	console.log('Congratulations, your extension "gguf-editor" is now active!');
// 	// The command has been defined in the package.json file
// 	// Now provide the implementation of the command with registerCommand
// 	// The commandId parameter must match the command field in package.json
// 	const disposable = vscode.commands.registerCommand('gguf-editor.helloWorld', () => {
// 		// The code you place here will be executed every time your command is executed
// 		// Display a message box to the user
// 		vscode.window.showInformationMessage('Hello World from gguf editor!');
// 	});
// 	context.subscriptions.push(disposable);
// }
// // This method is called when your extension is deactivated
// export function deactivate() {}
// import * as vscode from "vscode";

import { getWebviewContent, saveGGUFMetadata } from "./utils";
import { htmlContentLoading } from "./constants";

export function activate(context: vscode.ExtensionContext) {
  console.log('Extension "gguf-editor" is now active!');

  context.subscriptions.push(
    vscode.commands.registerCommand("gguf-editor.open", (uri: vscode.Uri) => {
      const removedTensors = new Set<string>();

      const panel = vscode.window.createWebviewPanel(
        "gguf-editor", // Identifies the type of the webview. Used internally
        "gguf-editor", // Title of the panel displayed to the user
        vscode.ViewColumn.One, // Editor column to show the new webview panel in.
        {
          // Webview options.
          enableScripts: true, // Enable scripts in the webview
        }
      );

      panel.webview.html = htmlContentLoading;

      const updateContent = (searchTerm: string = "") => {
        getWebviewContent(uri, searchTerm, removedTensors).then(({ htmlContent, fileName }) => {
          panel.title = `GGUF: ${fileName}`;
          panel.webview.html = htmlContent;
        }).catch((error) => {
          console.error("Failed to get webview content:", error);
        });
      };

      updateContent();

      panel.webview.onDidReceiveMessage(async (message) => {
        let searchTerm = "";
        switch (message.command) {
          case "search":
            searchTerm = message.text;
            break;
          case "reset":
            removedTensors.clear();
            break;
          case "removeTensor":
            removedTensors.add(message.tensorName);
            break;
          case "save":
            try {
              await saveGGUFMetadata(uri, message.metadata, removedTensors);
              vscode.window.showInformationMessage("GGUF metadata saved successfully!");
            } catch (error) {
              vscode.window.showErrorMessage(`Failed to save GGUF file: ${error}`);
            }
            break;
        }
        updateContent(searchTerm);
      });
    })
  );
}

export function deactivate() {}
