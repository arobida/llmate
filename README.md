# llmate

A CLI tool for analyzing and ingesting code repositories, designed to work with both local directories and GitHub repositories.

## Features

- Clone and analyze GitHub repositories
- Process local directories
- Configurable file size limits
- Custom include/exclude patterns
- Output to file or console
- Support for specific branch or commit checkout
- Intelligent file filtering with default ignore patterns

## Installation

```bash
deno install -A --global -n llmate jsr:@arobida/llmate
```

## Usage

```bash
llmate [options] <source>
```

### Options

- `-s, --max-size <size>` : Maximum file size in KB (default: 1024)
- `-p, --pattern <pattern>` : Include/exclude pattern
- `-t, --pattern-type <type>` : Pattern type (include/exclude)
- `-o, --output <path>` : Output file path
- `--version` : Show version number
- `--help` : Show help

### Examples

```bash
# Analyze a GitHub repository
llmate https://github.com/username/repo

# Analyze a specific branch
llmate https://github.com/username/repo/tree/dev

# Analyze a local directory
llmate ./path/to/directory

# Use custom patterns
llmate -p "*.ts,*.js" -t include ./project

# Output to file
llmate -o analysis.txt ./project
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
