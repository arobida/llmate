// File: utils.ts
export function shouldInclude(
	path: string,
	basePath: string,
	includePatterns: string[],
): boolean {
	const relPath = path.replace(basePath, "").replace(/^\//, "");
	let include = false;

	for (const pattern of includePatterns) {
		if (matchPattern(relPath, pattern)) {
			include = true;
		}
	}

	return include;
}

export function shouldExclude(
	path: string,
	basePath: string,
	ignorePatterns: string[],
): boolean {
	const relPath = path.replace(basePath, "").replace(/^\//, "");

	for (const pattern of ignorePatterns) {
		if (pattern === "") continue;
		if (matchPattern(relPath, pattern)) {
			return true;
		}
	}

	return false;
}

export function matchPattern(path: string, pattern: string): boolean {
	const regexPattern = pattern
		.replace(/[.+^${}()|[\]\\]/g, "\\$&") // Escape regex special chars
		.replace(/\*/g, ".*") // Convert * to .*
		.replace(/\?/g, "."); // Convert ? to .
	return new RegExp(`^${regexPattern}$`).test(path);
}

export async function isSafeSymlink(
	symlinkPath: string,
	basePath: string,
): Promise<boolean> {
	try {
		const targetPath = await Deno.realPath(symlinkPath);
		const realBasePath = await Deno.realPath(basePath);
		return targetPath.startsWith(realBasePath);
	} catch {
		return false;
	}
}

export async function isTextFile(filePath: string): Promise<boolean> {
	try {
		const file = await Deno.open(filePath);
		const chunk = new Uint8Array(1024);
		const bytesRead = await file.read(chunk);
		file.close();

		if (bytesRead === null) return false;

		// Check if file contains only printable ASCII characters
		for (let i = 0; i < bytesRead; i++) {
			const byte = chunk[i];
			if (byte < 0x20 && ![0x09, 0x0a, 0x0d].includes(byte)) {
				return false;
			}
		}
		return true;
	} catch {
		return false;
	}
}

export async function readFileContent(filePath: string): Promise<string> {
	try {
		const content = await Deno.readTextFile(filePath);
		return content;
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		return `Error reading file: ${errorMessage}`;
	}
}
