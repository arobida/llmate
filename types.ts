// File: types.ts
export interface FileNode {
	name: string;
	type: "file" | "directory";
	size: number;
	children: FileNode[];
	fileCount: number;
	dirCount: number;
	path: string;
	ignoreContent: boolean;
	content?: string;
}

export interface QueryConfig {
	localPath: string;
	ignorePatterns: string[];
	includePatterns: string[] | null;
	maxFileSize: number;
	slug: string;
	type?: "blob";
	subpath?: string;
	userName?: string;
	repoName?: string;
	branch?: string;
	commit?: string;
}

export interface Stats {
	totalFiles: number;
	totalSize: number;
}
