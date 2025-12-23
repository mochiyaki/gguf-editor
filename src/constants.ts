export const replaceMark = "#REPLACE_ME#";

export const htmlContentTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GGUF Editor</title>
    <style>
        :root {
            --bg-color: #ffffff;
            --text-color: #222222;
            --border-color: #dddddd;
            --header-bg: #a1a1a1;
            --header-text: #222222;
            --input-bg: #ffffff;
            --input-border: #cccccc;
            --button-bg: #f0f0f0;
            --button-hover: #e0e0e0;
            --loader-bg: #f3f3f3;
            --loader-accent: #3498db;
        }

        [data-theme="dark"] {
            --bg-color: #1e1e1e;
            --text-color: #ffffff;
            --border-color: #444444;
            --header-bg: #2d2d2d;
            --header-text: #ffffff;
            --input-bg: #2d2d2d;
            --input-border: #555555;
            --button-bg: #3c3c3c;
            --button-hover: #4c4c4c;
            --loader-bg: #444444;
            --loader-accent: #61dafb;
        }

        body {
            background-color: var(--bg-color);
            color: var(--text-color);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
            margin: 0;
            padding: 20px;
            transition: background-color 0.3s ease, color 0.3s ease;
        }

        .fade-in {
            opacity: 0;
            transition: opacity 1s ease-in;
        }
        .fade-in.visible {
            opacity: 1;
        }

        .theme-toggle {
            background: var(--button-bg);
            border: 1px solid var(--border-color);
            border-radius: 4px;
            padding: 8px 12px;
            cursor: pointer;
            color: var(--text-color);
            font-size: 14px;
            transition: background-color 0.3s ease;
        }

        .theme-toggle:hover {
            background: var(--button-hover);
        }

        h1, h2 {
            color: var(--text-color);
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        th, td {
            border: 1px solid var(--border-color);
            padding: 8px;
            color: var(--text-color);
        }
        th {
            background-color: var(--header-bg);
            color: var(--header-text);
            text-align: left;
        }

        #search-bar {
            margin: 20px 0;
            display: flex;
            gap: 10px;
            align-items: center;
        }

        #search-input {
            flex: 1;
            padding: 8px 12px;
            border: 1px solid var(--input-border);
            border-radius: 4px;
            background-color: var(--input-bg);
            color: var(--text-color);
            font-size: 14px;
        }

        #search-input::placeholder {
            color: var(--text-color);
            opacity: 0.6;
        }

        button {
            background-color: var(--button-bg);
            border: 1px solid var(--border-color);
            border-radius: 4px;
            padding: 8px 16px;
            cursor: pointer;
            color: var(--text-color);
            font-size: 14px;
            transition: background-color 0.3s ease;
        }

        button:hover {
            background-color: var(--button-hover);
        }
    </style>
</head>
<body>
    <div class="fade-in" id="content">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h1>${replaceMark}{fileName}${replaceMark}</h1>
            <button class="theme-toggle" id="theme-toggle" onclick="toggleTheme()">Dark Mode</button>
        </div>

        <div id="search-bar">
            <input type="text" id="search-input" placeholder="Search..." value="${replaceMark}{searchTerm}${replaceMark}" />
            <button onclick="performSearch()">Search</button>
            <button onclick="resetSearch()">Reset</button>
            <button onclick="saveChanges()">Save Changes</button>
        </div>

        <h2>Metadata</h2>
        <table>
        <thead>
            <tr>
            <th>Metadata</th>
            <th>Value</th>
            </tr>
        </thead>
        <tbody>
            ${replaceMark}{metadataRows}${replaceMark}
        </tbody>
        </table>

        <h2>Tensors</h2>
        <table>
        <thead>
            <tr>
            <th>Tensors</th>
            <th>Shape</th>
            <th>Precision</th>
            <th>Actions</th>
            </tr>
        </thead>
        <tbody>
            ${replaceMark}{tensorRows}${replaceMark}
        </tbody>
        </table>
    </div>

    <script>
        const vscode = acquireVsCodeApi();

        function performSearch() {
            const searchTerm = document.getElementById("search-input").value;
            vscode.postMessage({ command: "search", text: searchTerm });
        }

        function resetSearch() {
            vscode.postMessage({ command: "reset" });
        }

        function saveChanges() {
            const metadataInputs = document.querySelectorAll('.metadata-input');
            const metadata = {};
            metadataInputs.forEach(input => {
                const key = input.getAttribute('data-key');
                metadata[key] = input.value;
            });

            const tensorInputs = document.querySelectorAll('.tensor-name-input');
            const tensorNames = {};
            tensorInputs.forEach(input => {
                const index = input.getAttribute('data-index');
                tensorNames[index] = input.value;
            });

            vscode.postMessage({ command: "save", metadata: metadata, tensorNames: tensorNames, deletedTensors: deletedTensors });
        }

        let deletedTensors = [];
        let hiddenTensors = new Set();

        function deleteTensor(index) {
            if (confirm('Are you sure you want to remove this tensor from the editor? This will exclude it when saving changes.')) {
                // Remove the row from the DOM
                const row = document.querySelector('tr[data-tensor-index="' + index + '"]');
                if (row) {
                    row.remove();
                }
                // Track deleted tensors
                deletedTensors.push(index);
            }
        }

        function hideTensor(index) {
            const row = document.querySelector('tr[data-tensor-index="' + index + '"]');
            const button = row.querySelector('.hide-tensor-btn');
            if (hiddenTensors.has(index)) {
                // Show the tensor
                row.style.display = '';
                button.textContent = 'Hide';
                hiddenTensors.delete(index);
            } else {
                // Hide the tensor
                row.style.display = 'none';
                button.textContent = 'Show';
                hiddenTensors.add(index);
            }
        }

        function toggleTheme() {
            const html = document.documentElement;
            const themeToggle = document.getElementById("theme-toggle");
            const currentTheme = html.getAttribute("data-theme");

            if (currentTheme === "dark") {
                html.removeAttribute("data-theme");
                themeToggle.textContent = "Dark Mode";
                localStorage.setItem("gguf-editor-theme", "light");
            } else {
                html.setAttribute("data-theme", "dark");
                themeToggle.textContent = "Light Mode";
                localStorage.setItem("gguf-editor-theme", "dark");
            }
        }

        function initializeTheme() {
            const savedTheme = localStorage.getItem("gguf-editor-theme");
            const themeToggle = document.getElementById("theme-toggle");

            if (savedTheme === "dark") {
                document.documentElement.setAttribute("data-theme", "dark");
                themeToggle.textContent = "Light Mode";
            } else {
                themeToggle.textContent = "Dark Mode";
            }
        }

        document.getElementById("search-input").addEventListener("keydown", function (event) {
            if (event.key === "Enter") {
                performSearch();
            }
        });

        document.addEventListener("DOMContentLoaded", function () {
            initializeTheme();
            document.getElementById("content").classList.add("visible");
        });
    </script>
</body>
</html>`;

export const htmlContentLoading = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Loading...</title>
    <style>
    :root {
        --bg-color: #ffffff;
        --loader-bg: #f3f3f3;
        --loader-accent: #3498db;
    }

    [data-theme="dark"] {
        --bg-color: #1e1e1e;
        --loader-bg: #444444;
        --loader-accent: #61dafb;
    }

    body {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
        margin: 0;
        background-color: var(--bg-color);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
        transition: background-color 0.3s ease;
    }
    .loader {
        border: 8px solid var(--loader-bg);
        border-top: 8px solid var(--loader-accent);
        border-radius: 50%;
        width: 30px;
        height: 30px;
        animation: spin 2s linear infinite;
    }
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    </style>
</head>
<body>
    <script>
        // Initialize theme for loading screen
        const savedTheme = localStorage.getItem("gguf-editor-theme");
        if (savedTheme === "dark") {
            document.documentElement.setAttribute("data-theme", "dark");
        }
    </script>
    <div class="loader"></div>
</body>
</html>
`;
