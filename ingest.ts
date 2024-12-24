import { createSummaryString, createTreeStructure } from "./formatter.ts";
import { isTextFile, readFileContent, scanDirectory } from "./scanner.ts";
import { generateTokenString } from "./tokenizer.ts";
import type { QueryConfig, FileNode } from "./types.ts";

// File: ingest.ts
interface FileInfo {
	path: string;
	content: string | null;
	size: number;
}

export function extractFilesContent(
	query: QueryConfig,
	node: FileNode,
	maxFileSize: number,
	files: FileInfo[] = [],
): FileInfo[] {
	if (node.type === "file" && node.content !== "[Non-text file]") {
		const content = node.size > maxFileSize ? null : node.content ?? null;
		files.push({
			path: node.path.replace(query.localPath, ""),
			content,
			size: node.size,
		});
	} else if (node.type === "directory") {
		for (const child of node.children) {
			extractFilesContent(query, child, maxFileSize, files);
		}
	}
	return files;
}

export function createFileContentString(files: FileInfo[]): string {
	const output: string[] = [];
	const separator = `${"=".repeat(48)}\n`;

	for (const file of files) {
		if (!file.content) continue;
		output.push(separator);
		output.push(`File: ${file.path}\n`);
		output.push(separator);
		output.push(`${file.content}\n\n`);
	}

	return output.join("");
}

export async function ingestSingleFile(
	path: string,
	query: QueryConfig,
): Promise<[string, string, string]> {
	const fileInfo = await Deno.stat(path);

	if (!fileInfo.isFile) {
		throw new Error(`Path ${path} is not a file`);
	}

	const isText = await isTextFile(path);
	if (!isText) {
		throw new Error(`File ${path} is not a text file`);
	}

	const fileSize = fileInfo.size;
	const content =
		fileSize > query.maxFileSize
			? "[Content ignored: file too large]"
			: await readFileContent(path);

	const fileData: FileInfo = {
		path: path.replace(query.localPath, ""),
		content,
		size: fileSize,
	};

	const summary = [
		`Repository: ${query.userName}/${query.repoName}`,
		`File: ${path.split("/").pop()}`,
		`Size: ${fileSize.toLocaleString()} bytes`,
		`Lines: ${content.split("\n").length.toLocaleString()}`,
	].join("\n");

	const filesContent = createFileContentString([fileData]);
	const tree = `Directory structure:\n└── ${path.split("/").pop()}`;

	const formattedTokens = await generateTokenString(filesContent);
	const finalSummary = formattedTokens
		? `${summary}\nEstimated tokens: ${formattedTokens}`
		: summary;

	return [finalSummary, tree, filesContent];
}

export async function ingestDirectory(
	path: string,
	query: QueryConfig,
): Promise<[string, string, string]> {
	const nodes = await scanDirectory(path, query);
	if (!nodes) throw new Error("Failed to scan directory");

	const files = extractFilesContent(query, nodes, query.maxFileSize);
	const summary = createSummaryString(query, nodes);
	const tree = `Directory structure:\n${createTreeStructure(query, nodes)}`;
	const filesContent = createFileContentString(files);

	const formattedTokens = await generateTokenString(tree + filesContent);
	const finalSummary = formattedTokens
		? `${summary}Estimated tokens: ${formattedTokens}`
		: summary;

	return [finalSummary, tree, filesContent];
}

export async function ingestFromQuery(
	query: QueryConfig,
): Promise<[string, string, string]> {
	const path = `${query.localPath}${query.subpath || ""}`;

	try {
		await Deno.stat(path);
	} catch {
		throw new Error(`${query.slug} cannot be found`);
	}

	if (query.type === "blob") {
		return ingestSingleFile(path, query);
	}
	return ingestDirectory(path, query);
}
