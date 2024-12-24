// formatter.ts
import type { FileNode, QueryConfig } from "./types.ts";

export function createTreeStructure(
	query: QueryConfig,
	node: FileNode,
	prefix = "",
	isLast = true,
): string {
	let tree = "";

	if (!node.name) {
		node.name = query.slug;
	}

	if (node.name) {
		const currentPrefix = isLast ? "└── " : "├── ";
		tree += `${prefix}${currentPrefix}${node.name}\n`;
	}

	if (node.type === "directory") {
		const newPrefix = prefix + (node.name ? (isLast ? "    " : "│   ") : "");
		const children = node.children;

		children.forEach((child, index) => {
			tree += createTreeStructure(
				query,
				child,
				newPrefix,
				index === children.length - 1,
			);
		});
	}

	return tree;
}

export function createSummaryString(
	query: QueryConfig,
	node: FileNode,
): string {
	const parts = [];

	if (query.userName && query.repoName) {
		parts.push(`Repository: ${query.userName}/${query.repoName}`);
	}

	parts.push(`Files analyzed: ${node.fileCount}`);

	if (query.subpath && query.subpath !== "/") {
		parts.push(`Subpath: ${query.subpath}`);
	}

	if (query.commit) {
		parts.push(`Commit: ${query.commit}`);
	} else if (
		query.branch &&
		query.branch !== "main" &&
		query.branch !== "master"
	) {
		parts.push(`Branch: ${query.branch}`);
	}

	return `${parts.join("\n")}\n`;
}
