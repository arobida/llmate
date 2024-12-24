// scanner.ts
import { join } from "@std/path";
import type { FileNode, QueryConfig, Stats } from "./types.ts";
import {
	MAX_DIRECTORY_DEPTH,
	MAX_FILES,
	MAX_TOTAL_SIZE_BYTES,
} from "./constants.ts";

export async function isTextFile(filePath: string): Promise<boolean> {
	try {
		const file = await Deno.open(filePath);
		const buffer = new Uint8Array(1024);
		const bytesRead = await file.read(buffer);
		file.close();

		if (bytesRead === null) return false;

		// Check if the buffer contains only valid text characters
		const nonTextChars = new Set([
			7,
			8,
			9,
			10,
			12,
			13,
			27,
			...Array.from({ length: 32 }, (_, i) => i),
		]);
		for (let i = 0; i < bytesRead; i++) {
			if (!nonTextChars.has(buffer[i]) && buffer[i] < 32) return false;
		}
		return true;
	} catch {
		return false;
	}
}

export async function readFileContent(filePath: string): Promise<string> {
	try {
		return await Deno.readTextFile(filePath);
	} catch (error) {
		const message = error instanceof Error ? error.message : "unknown error";
		return `Error reading file: ${message}`;
	}
}

export async function scanDirectory(
	path: string,
	query: QueryConfig,
	seenPaths = new Set<string>(),
	depth = 0,
	stats: Stats = { totalFiles: 0, totalSize: 0 },
): Promise<FileNode | null> {
	if (depth > MAX_DIRECTORY_DEPTH) {
		console.log(
			`Skipping deep directory: ${path} (max depth ${MAX_DIRECTORY_DEPTH} reached)`,
		);
		return null;
	}

	if (stats.totalFiles >= MAX_FILES) {
		console.log(
			`Skipping further processing: maximum file limit (${MAX_FILES}) reached`,
		);
		return null;
	}

	if (stats.totalSize >= MAX_TOTAL_SIZE_BYTES) {
		console.log(
			`Skipping further processing: maximum total size (${MAX_TOTAL_SIZE_BYTES / 1024 / 1024}MB) reached`,
		);
		return null;
	}

	const realPath = await Deno.realPath(path);
	if (seenPaths.has(realPath)) {
		console.log(`Skipping already visited path: ${path}`);
		return null;
	}
	seenPaths.add(realPath);

	const result: FileNode = {
		name: path.split("/").pop() || "",
		type: "directory",
		size: 0,
		children: [],
		fileCount: 0,
		dirCount: 0,
		path,
		ignoreContent: false,
	};

	try {
		for await (const entry of Deno.readDir(path)) {
			const entryPath = join(path, entry.name);

			if (shouldExclude(entryPath, query.localPath, query.ignorePatterns)) {
				continue;
			}

			const isFile = entry.isFile;
			if (isFile && query.includePatterns) {
				if (!shouldInclude(entryPath, query.localPath, query.includePatterns)) {
					result.ignoreContent = true;
					continue;
				}
			}

			if (entry.isSymlink) {
				// Handle symlinks safely
				const targetPath = await Deno.readLink(entryPath);
				const resolvedPath = join(path, targetPath);
				if (!resolvedPath.startsWith(query.localPath)) {
					console.log(
						`Skipping symlink that points outside base directory: ${entryPath}`,
					);
					continue;
				}
			}

			if (isFile) {
				const fileInfo = await Deno.stat(entryPath);
				if (stats.totalSize + fileInfo.size > MAX_TOTAL_SIZE_BYTES) {
					console.log(
						`Skipping file ${entryPath}: would exceed total size limit`,
					);
					continue;
				}

				stats.totalFiles++;
				stats.totalSize += fileInfo.size;

				if (stats.totalFiles > MAX_FILES) {
					console.log(`Maximum file limit (${MAX_FILES}) reached`);
					return result;
				}

				const isText = await isTextFile(entryPath);
				const content = isText
					? await readFileContent(entryPath)
					: "[Non-text file]";

				const child: FileNode = {
					name: entry.name,
					type: "file",
					size: fileInfo.size,
					children: [],
					fileCount: 0,
					dirCount: 0,
					path: entryPath,
					ignoreContent: false,
					content,
				};

				result.children.push(child);
				result.size += fileInfo.size;
				result.fileCount++;
			} else if (entry.isDirectory) {
				const subdir = await scanDirectory(
					entryPath,
					query,
					seenPaths,
					depth + 1,
					stats,
				);
				if (subdir && (!query.includePatterns || subdir.fileCount > 0)) {
					result.children.push(subdir);
					result.size += subdir.size;
					result.fileCount += subdir.fileCount;
					result.dirCount += 1 + subdir.dirCount;
				}
			}
		}
	} catch (error) {
		if (error instanceof Deno.errors.PermissionDenied) {
			console.log(`Permission denied: ${path}`);
		} else {
			throw error;
		}
	}

	return result;
}

function shouldExclude(
	path: string,
	basePath: string,
	ignorePatterns: string[],
): boolean {
	const relPath = path.replace(basePath, "").replace(/^\//, "");
	return ignorePatterns.some((pattern) => {
		if (!pattern) return false;
		return matchGlobPattern(relPath, pattern);
	});
}

function shouldInclude(
	path: string,
	basePath: string,
	includePatterns: string[],
): boolean {
	const relPath = path.replace(basePath, "").replace(/^\//, "");
	return includePatterns.some((pattern) => matchGlobPattern(relPath, pattern));
}

function matchGlobPattern(path: string, pattern: string): boolean {
	const regexPattern = pattern
		.replace(/\./g, "\\.")
		.replace(/\*/g, ".*")
		.replace(/\?/g, ".");
	return new RegExp(`^${regexPattern}$`).test(path);
}
