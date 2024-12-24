// constants.ts
export const MAX_DISPLAY_SIZE = 300000;
export const MAX_FILE_SIZE = 10000000;
export const CLONE_TIMEOUT = 20000; // 20 seconds

export const MAX_DIRECTORY_DEPTH = 20;
export const MAX_FILES = 10000;
export const MAX_TOTAL_SIZE_BYTES = 500 * 1024 * 1024; // 500MB

export const DEFAULT_IGNORE_PATTERNS = [
	"*.pyc",
	"*.pyo",
	"*.pyd",
	"__pycache__", // Python
	"node_modules",
	"bower_components", // JavaScript
	".git",
	".svn",
	".hg",
	".gitignore", // Version control
	"*.svg",
	"*.png",
	"*.jpg",
	"*.jpeg",
	"*.gif", // Images
	"venv",
	".venv",
	"env", // Virtual environments
	".idea",
	".vscode", // IDEs
	"*.log",
	"*.bak",
	"*.swp",
	"*.tmp", // Temporary files
	".DS_Store", // macOS
	"Thumbs.db", // Windows
	"build",
	"dist", // Build directories
	"*.egg-info", // Python egg info
	"*.so",
	"*.dylib",
	"*.dll", // Compiled libraries
	"package-lock.json",
	"yarn.lock", // Package lock files
	"LICENSE",
	"LICENSE.*",
	"COPYING", // License files
	"AUTHORS",
	"AUTHORS.*", // Author files
	"CONTRIBUTORS",
	"CONTRIBUTORS.*", // Contributor files
	"CHANGELOG",
	"CHANGELOG.*", // Change logs
	"CONTRIBUTING",
	"CONTRIBUTING.*", // Contribution guidelines
];
