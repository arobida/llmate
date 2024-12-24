// mod.ts
import { Command } from "@cliffy/command";
import { resolve } from "@std/path";
import { exists } from "@std/fs";
import { ingestFromQuery } from "./ingest.ts";
import { cloneRepo, parseGitUrl } from "./clone.ts";
import { DEFAULT_IGNORE_PATTERNS } from "./constants.ts";
import type { QueryConfig } from "./types.ts";

if (import.meta.main) {
	await new Command()
		.name("llmate")
		.version("1.0.0")
		.description("A CLI tool for analyzing and ingesting code repositories")
		.option("-s, --max-size <size:number>", "Maximum file size in KB", {
			default: 1024,
		})
		.option("-p, --pattern <pattern:string>", "Include/exclude pattern", {
			default: "",
		})
		.option(
			"-t, --pattern-type <type:string>",
			"Pattern type (include/exclude)",
			{
				default: "exclude",
				value: (type: string): string => {
					if (!["include", "exclude"].includes(type)) {
						throw new Error(
							"Pattern type must be either 'include' or 'exclude'",
						);
					}
					return type;
				},
			},
		)
		.option("-o, --output <path:string>", "Output file path")
		.arguments("<source:string>")
		.action(async (options, source) => {
			try {
				let query: QueryConfig;

				// Check if source is a URL or local path
				if (source.includes("github.com")) {
					// Handle GitHub repository
					const repoInfo = await parseGitUrl(source);
					const tmpDir = await Deno.makeTempDir({ prefix: "llmate-" });

					query = {
						...repoInfo,
						localPath: tmpDir,
						maxFileSize: options.maxSize * 1024,
						ignorePatterns:
							options.patternType === "exclude"
								? [
										...DEFAULT_IGNORE_PATTERNS,
										...(options.pattern ? options.pattern.split(",") : []),
									]
								: DEFAULT_IGNORE_PATTERNS,
						includePatterns:
							options.patternType === "include"
								? options.pattern.split(",").map((p) => p.trim())
								: null,
						slug: `${repoInfo.userName}/${repoInfo.repoName}`,
					};

					// Clone the repository
					await cloneRepo(query);
				} else {
					// Handle local directory
					const resolvedPath = resolve(source);
					if (!(await exists(resolvedPath))) {
						throw new Error(`Path does not exist: ${resolvedPath}`);
					}

					query = {
						localPath: resolvedPath,
						maxFileSize: options.maxSize * 1024,
						ignorePatterns:
							options.patternType === "exclude"
								? [
										...DEFAULT_IGNORE_PATTERNS,
										...(options.pattern ? options.pattern.split(",") : []),
									]
								: DEFAULT_IGNORE_PATTERNS,
						includePatterns:
							options.patternType === "include"
								? options.pattern.split(",").map((p) => p.trim())
								: null,
						slug: resolvedPath.split("/").pop() || "root",
					};
				}

				const [summary, tree, content] = await ingestFromQuery(query);

				if (options.output) {
					const output = `${summary}\n${tree}\n${content}`;
					await Deno.writeTextFile(options.output, output);
					console.log(`Output written to ${options.output}`);
				} else {
					console.log(summary);
					console.log(`\n${tree}`);
					console.log(`\n${content}`);
				}

				// Cleanup if it was a cloned repository
				if (source.includes("github.com")) {
					await Deno.remove(query.localPath, { recursive: true });
				}
			} catch (error) {
				const message =
					error instanceof Error ? error.message : "unknown error";
				console.error(`Error reading file: ${message}`);
				Deno.exit(1);
			}
		})
		.parse(Deno.args);
}
