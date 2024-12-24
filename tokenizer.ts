// tokenizer.ts

// Simple tokenizer that estimates tokens based on word boundaries and special characters
export function generateTokenString(text: string): string | null {
	try {
		const estimatedTokens = estimateTokenCount(text);

		if (estimatedTokens > 1_000_000) {
			return `${(estimatedTokens / 1_000_000).toFixed(1)}M`;
		}
		if (estimatedTokens > 1_000) {
			return `${(estimatedTokens / 1_000).toFixed(1)}k`;
		}
		return `${estimatedTokens}`;
	} catch (error) {
		console.error("Error estimating tokens:", error);
		return null;
	}
}

function estimateTokenCount(text: string): number {
	// Split on whitespace and punctuation
	const tokens = text.split(/[\s\p{P}]+/u).filter(Boolean);

	// Count special tokens (newlines, indentation, etc.)
	const specialTokens = (text.match(/[\n\t]/g) || []).length;

	// Add some overhead for encoding special characters and subword tokenization
	const overhead = Math.floor(tokens.length * 0.2);

	return tokens.length + specialTokens + overhead;
}
