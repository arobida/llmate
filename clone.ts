// clone.ts
import type { QueryConfig } from "./types.ts";

const CLONE_TIMEOUT = 20000; // 20 seconds

export async function checkRepoExists(url: string): Promise<boolean> {
	try {
		const process = new Deno.Command("git", {
			args: ["ls-remote", url],
			stdout: "null",
			stderr: "null",
		});

		const { code } = await process.output();
		return code === 0;
	} catch {
		return false;
	}
}

export async function cloneRepo(query: QueryConfig): Promise<void> {
	if (!query.userName || !query.repoName) {
		throw new Error("Repository information missing");
	}

	const url = `https://github.com/${query.userName}/${query.repoName}`;

	if (!(await checkRepoExists(url))) {
		throw new Error("Repository not found, make sure it is public");
	}

	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), CLONE_TIMEOUT);

	try {
		if (query.commit) {
			// Clone the repository
			const cloneProcess = new Deno.Command("git", {
				args: ["clone", "--single-branch", url, query.localPath],
				signal: controller.signal,
			});
			await cloneProcess.output();

			// Checkout specific commit
			const checkoutProcess = new Deno.Command("git", {
				args: ["-C", query.localPath, "checkout", query.commit],
				signal: controller.signal,
			});
			await checkoutProcess.output();
		} else if (
			query.branch &&
			query.branch !== "main" &&
			query.branch !== "master"
		) {
			// Clone specific branch
			const process = new Deno.Command("git", {
				args: [
					"clone",
					"--depth=1",
					"--single-branch",
					"--branch",
					query.branch,
					url,
					query.localPath,
				],
				signal: controller.signal,
			});
			await process.output();
		} else {
			// Clone default branch
			const process = new Deno.Command("git", {
				args: ["clone", "--depth=1", "--single-branch", url, query.localPath],
				signal: controller.signal,
			});
			await process.output();
		}
	} catch (error: unknown) {
		if (error instanceof DOMException && error.name === "AbortError") {
			throw new Error(
				`Clone operation timed out after ${CLONE_TIMEOUT / 1000} seconds`,
			);
		}
		throw new Error(
			`Failed to clone repository: ${error instanceof Error ? error.message : String(error)}`,
		);
	} finally {
		clearTimeout(timeoutId);
	}
}

export function parseGitUrl(url: string): Partial<QueryConfig> {
	// Handle both https and git@ URLs
	const httpsMatch = url.match(
		/https:\/\/github\.com\/([^\/]+)\/([^\/\s]+)(\/tree\/([^\/\s]+))?/,
	);
	const sshMatch = url.match(/git@github\.com:([^\/]+)\/([^\/\s]+)(\.git)?/);

	if (!httpsMatch && !sshMatch) {
		throw new Error("Invalid GitHub URL format");
	}

	const match = httpsMatch || sshMatch;
	if (!match) {
		throw new Error("Failed to parse GitHub URL");
	}

	const [, userName, repoName, , branch] = match;

	return {
		userName,
		repoName: repoName.replace(".git", ""),
		branch: branch || "main",
	};
}
