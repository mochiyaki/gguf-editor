# GGUF Editor Project Documentation

## Overview

The GGUF Editor is a Visual Studio Code extension designed for viewing and inspecting GGUF (GGML Universal File Format) model files. GGUF is a binary format used for storing machine learning models, particularly those compatible with llama.cpp and similar inference engines.

This extension provides developers, researchers, and AI enthusiasts with a powerful tool to explore the structure and contents of GGUF files directly within their development environment. The extension supports viewing metadata, tensor information, searching capabilities, and even editing functionality for GGUF files.

## Key Features
- **Metadata Inspection**: View all metadata key-value pairs stored in the GGUF file
- **Tensor Information**: Display tensor names, shapes, and quantization types
- **Search Functionality**: Search through metadata and tensor information
- **Array Truncation**: Configurable maximum number of array elements to display
- **Export Capabilities**: Export model information in JSON format
- **Context Menu Integration**: Right-click on `.gguf` files in the explorer to open them
- **Webview Interface**: Clean, responsive interface for browsing file contents

### User Experience Features
- **Dark/Light Mode Toggle**: Switch between dark and light themes with a fixed toggle button
- **Theme Persistence**: Your theme preference is saved and restored on subsequent opens
- **Responsive Design**: Adapts to different screen sizes and VS Code window configurations
- **Interactive Elements**: Editable metadata fields for direct modification

### Advanced Capabilities
- **File Editing Support**: Save changes made to metadata directly back to GGUF files
- **Flexible Search**: Filter results across metadata keys/values and tensor names/shapes/precision
- **Configuration Options**: Customizable settings including array element limits

## Technical Architecture

### Extension Structure
The extension follows a typical VS Code extension architecture with:
- Main entry point (`src/extension.ts`) that registers the command and creates webview panels
- Utility functions (`src/utils.ts`) for processing GGUF files and generating HTML content
- Constants and templates (`src/constants.ts`) for UI elements and HTML structure

### Dependencies
The project relies on several key dependencies:
- `@gguf/editor`: Core library for parsing and working with GGUF format files
- VS Code Extension API: For integrating with the editor environment
- Webview capabilities: For rendering interactive HTML content within VS Code

### Data Processing Flow
1. User opens a `.gguf` file via context menu or command palette
2. Extension creates a webview panel with loading indicator
3. `getGGUFInfo()` function parses the GGUF file using `@gguf/editor`
4. Metadata and tensor information are extracted and formatted
5. HTML template is populated with the parsed data
6. Webview displays the structured content with search and edit capabilities

### File Format Handling
The extension uses the `@gguf/editor` library to render GGUF files, which:
- Reads file headers and metadata sections
- Extracts tensor information including names, shapes, and quantization types
- Handles various data types within the GGUF format
- Supports both reading and writing operations

## Implementation Details

### Extension Activation
The extension activates on startup and registers a command (`gguf-editor.open`) that allows users to open GGUF files in the editor interface.

### Webview Interface
The UI is implemented using HTML, CSS, and JavaScript within a VS Code webview panel:
- Responsive design with light/dark theme support
- Interactive elements for searching and editing metadata
- Clean table-based display of metadata and tensor information
- Loading state while processing files

### Search Functionality
Users can filter both metadata and tensor information using the search bar:
- Real-time filtering as users type
- Support for searching across all text fields
- Reset button to clear filters and show all data

### Theme System
The extension implements a persistent theme system:
- Uses CSS variables for theme management
- Saves user preference in localStorage
- Applies themes based on saved settings or browser defaults
- Supports both light and dark modes with smooth transitions

### Editing Capabilities
The extension supports editing metadata directly within the interface:
- Editable input fields for each metadata value
- Save button to persist changes back to the file system
- File saving dialog to specify new output location
- Validation of data types during save operations

## Configuration Options

The extension provides a single configurable setting:
- `gguf-editor.maxArrayElements`: Maximum number of elements to display in metadata arrays (default: 25)

Users can modify this setting through VS Code's settings interface or by editing their settings.json file.

## Development Setup

### Prerequisites
- Node.js (version 16 or higher)
- npm package manager
- Visual Studio Code

### Building
```bash
npm install
npm run compile
```

### Testing
```bash
npm test
```

### Packaging
```bash
npm run package
```

This creates a `.vsix` file in the root directory that can be installed in VS Code.

## Usage Instructions

### Opening GGUF Files
1. **Via Context Menu**: Right-click on any `.gguf` file in the Explorer panel and select "Open gguf-editor"
2. **Via Command Palette**: Open the Command Palette (Ctrl+Shift+P) and run "gguf-editor: Open gguf-editor"

### Interface Overview
The extension opens a webview panel displaying:
- **File Header**: Shows the filename
- **Search Bar**: Filter metadata and tensors by search term
- **Metadata Table**: Key-value pairs from the file's metadata
- **Tensors Table**: Information about each tensor including name, shape, and precision type

### Search Functionality
- Enter text in the search box to filter results
- Search works across metadata keys/values and tensor names/shapes/precision
- Click "Reset" to clear the search and show all data

## Future Enhancements

Potential future improvements include:
- Support for more advanced GGUF file operations
- Enhanced visualization of model architectures
- Export capabilities for model information
- Integration with AI development workflows
- Performance optimizations for large files

## Contributing

We welcome contributions! Please read our updated contribution guidelines before submitting a Pull Request.

**How to contribute:**
1. Fork the repository and create a new branch for your feature or bug fix.
2. Ensure all tests pass locally (`npm test`).
3. Follow the code style guidelines (ESLint + Prettier).
4. Submit a pull request with a clear description of changes.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Version:** 0.1.3

**Author:** Your Name <you@example.com>

**Repository:** https://github.com/yourusername/gguf-editor

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.