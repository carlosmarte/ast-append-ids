use anyhow::{Context, Result};
use ast_append_ids::{AstProcessor, IdOptions, IdStrategy};
use ast_append_ids::jsx::JsxProcessor;
use ast_append_ids::xml::XmlProcessor;
use ast_append_ids::html::HtmlProcessor;
use clap::{Parser, Subcommand, ValueEnum};
use colored::*;
use glob::glob;
use std::fs;
use std::path::{Path, PathBuf};

#[derive(Parser)]
#[command(name = "ast-append-ids")]
#[command(author, version, about = "Append deterministic IDs to AST elements", long_about = None)]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Process JSX/React files
    Jsx {
        /// Input file or glob pattern
        #[arg(value_name = "PATH")]
        path: String,
        
        /// Attribute name for ID
        #[arg(long, default_value = "data-ast-id")]
        attr: String,
        
        /// ID generation strategy
        #[arg(long, value_enum, default_value = "hash")]
        strategy: Strategy,
        
        /// ID prefix
        #[arg(long, default_value = "el-")]
        prefix: String,
        
        /// Overwrite existing IDs
        #[arg(long)]
        overwrite: bool,
        
        /// Tags to include (comma-separated)
        #[arg(long, value_delimiter = ',')]
        include: Vec<String>,
        
        /// Tags to exclude (comma-separated)
        #[arg(long, value_delimiter = ',')]
        exclude: Vec<String>,
        
        /// Output directory (default: in-place)
        #[arg(short, long)]
        output: Option<PathBuf>,
        
        /// Verbose output
        #[arg(short, long)]
        verbose: bool,
    },
    
    /// Process XML files
    Xml {
        /// Input file or glob pattern
        #[arg(value_name = "PATH")]
        path: String,
        
        /// Attribute name for ID
        #[arg(long, default_value = "data-ast-id")]
        attr: String,
        
        /// ID generation strategy
        #[arg(long, value_enum, default_value = "hash")]
        strategy: Strategy,
        
        /// ID prefix
        #[arg(long, default_value = "el-")]
        prefix: String,
        
        /// Overwrite existing IDs
        #[arg(long)]
        overwrite: bool,
        
        /// CSS selector for target elements
        #[arg(long)]
        selector: Option<String>,
        
        /// Output directory (default: in-place)
        #[arg(short, long)]
        output: Option<PathBuf>,
        
        /// Verbose output
        #[arg(short, long)]
        verbose: bool,
    },
    
    /// Process HTML files
    Html {
        /// Input file or glob pattern
        #[arg(value_name = "PATH")]
        path: String,
        
        /// Attribute name for ID
        #[arg(long, default_value = "data-ast-id")]
        attr: String,
        
        /// ID generation strategy
        #[arg(long, value_enum, default_value = "hash")]
        strategy: Strategy,
        
        /// ID prefix
        #[arg(long, default_value = "el-")]
        prefix: String,
        
        /// Overwrite existing IDs
        #[arg(long)]
        overwrite: bool,
        
        /// CSS selector for target elements
        #[arg(long)]
        selector: Option<String>,
        
        /// Output directory (default: in-place)
        #[arg(short, long)]
        output: Option<PathBuf>,
        
        /// Verbose output
        #[arg(short, long)]
        verbose: bool,
    },
    
    /// Auto-detect file type and process
    Auto {
        /// Input file or glob pattern
        #[arg(value_name = "PATH")]
        path: String,
        
        /// Attribute name for ID
        #[arg(long, default_value = "data-ast-id")]
        attr: String,
        
        /// ID generation strategy
        #[arg(long, value_enum, default_value = "hash")]
        strategy: Strategy,
        
        /// ID prefix
        #[arg(long, default_value = "el-")]
        prefix: String,
        
        /// Overwrite existing IDs
        #[arg(long)]
        overwrite: bool,
        
        /// Output directory (default: in-place)
        #[arg(short, long)]
        output: Option<PathBuf>,
        
        /// Verbose output
        #[arg(short, long)]
        verbose: bool,
    },
}

#[derive(Copy, Clone, Debug, ValueEnum)]
enum Strategy {
    Hash,
    Slug,
    Path,
}

impl From<Strategy> for IdStrategy {
    fn from(s: Strategy) -> Self {
        match s {
            Strategy::Hash => IdStrategy::Hash,
            Strategy::Slug => IdStrategy::Slug,
            Strategy::Path => IdStrategy::Path,
        }
    }
}

fn main() -> Result<()> {
    let cli = Cli::parse();
    
    match cli.command {
        Commands::Jsx { path, attr, strategy, prefix, overwrite, include, exclude, output, verbose } => {
            let options = IdOptions {
                attr,
                strategy: strategy.into(),
                prefix,
                overwrite,
                selector: None,
                include,
                exclude,
            };
            process_files(&path, FileType::Jsx, &options, output.as_deref(), verbose)
        }
        Commands::Xml { path, attr, strategy, prefix, overwrite, selector, output, verbose } => {
            let options = IdOptions {
                attr,
                strategy: strategy.into(),
                prefix,
                overwrite,
                selector,
                include: Vec::new(),
                exclude: Vec::new(),
            };
            process_files(&path, FileType::Xml, &options, output.as_deref(), verbose)
        }
        Commands::Html { path, attr, strategy, prefix, overwrite, selector, output, verbose } => {
            let options = IdOptions {
                attr,
                strategy: strategy.into(),
                prefix,
                overwrite,
                selector,
                include: Vec::new(),
                exclude: Vec::new(),
            };
            process_files(&path, FileType::Html, &options, output.as_deref(), verbose)
        }
        Commands::Auto { path, attr, strategy, prefix, overwrite, output, verbose } => {
            let options = IdOptions {
                attr,
                strategy: strategy.into(),
                prefix,
                overwrite,
                selector: None,
                include: Vec::new(),
                exclude: Vec::new(),
            };
            process_files(&path, FileType::Auto, &options, output.as_deref(), verbose)
        }
    }
}

#[derive(Debug, Clone, Copy)]
enum FileType {
    Jsx,
    Xml,
    Html,
    Auto,
}

fn process_files(
    path_pattern: &str,
    file_type: FileType,
    options: &IdOptions,
    output_dir: Option<&Path>,
    verbose: bool,
) -> Result<()> {
    let files = find_files(path_pattern)?;
    
    if files.is_empty() {
        eprintln!("{} No files found matching: {}", "✗".red(), path_pattern);
        return Ok(());
    }
    
    if verbose {
        println!("{} Found {} file(s) to process", "→".blue(), files.len());
    }
    
    let mut success_count = 0;
    let mut error_count = 0;
    
    for file_path in &files {
        match process_single_file(file_path, file_type, options, output_dir, verbose) {
            Ok(_) => {
                success_count += 1;
                if verbose {
                    println!("{} Processed: {}", "✓".green(), file_path.display());
                }
            }
            Err(e) => {
                error_count += 1;
                eprintln!("{} Error processing {}: {}", "✗".red(), file_path.display(), e);
            }
        }
    }
    
    println!(
        "\n{} Processed {} file(s) successfully, {} error(s)",
        if error_count == 0 { "✓".green() } else { "⚠".yellow() },
        success_count,
        error_count
    );
    
    if error_count > 0 {
        std::process::exit(1);
    }
    
    Ok(())
}

fn process_single_file(
    file_path: &Path,
    file_type: FileType,
    options: &IdOptions,
    output_dir: Option<&Path>,
    verbose: bool,
) -> Result<()> {
    let content = fs::read_to_string(file_path)
        .with_context(|| format!("Failed to read file: {}", file_path.display()))?;
    
    let detected_type = if matches!(file_type, FileType::Auto) {
        detect_file_type(file_path, &content)
    } else {
        file_type
    };
    
    if verbose {
        println!("  Processing as: {:?}", detected_type);
    }
    
    let processed = match detected_type {
        FileType::Jsx => {
            let mut processor = JsxProcessor::new();
            processor.process(&content, options)?
        }
        FileType::Xml => {
            let mut processor = XmlProcessor::new();
            processor.process(&content, options)?
        }
        FileType::Html => {
            let mut processor = HtmlProcessor::new();
            processor.process(&content, options)?
        }
        FileType::Auto => unreachable!(),
    };
    
    let output_path = if let Some(dir) = output_dir {
        fs::create_dir_all(dir)
            .with_context(|| format!("Failed to create output directory: {}", dir.display()))?;
        dir.join(file_path.file_name().unwrap())
    } else {
        file_path.to_path_buf()
    };
    
    fs::write(&output_path, processed)
        .with_context(|| format!("Failed to write file: {}", output_path.display()))?;
    
    Ok(())
}

fn find_files(pattern: &str) -> Result<Vec<PathBuf>> {
    let path = Path::new(pattern);
    
    if path.is_file() {
        return Ok(vec![path.to_path_buf()]);
    }
    
    if path.is_dir() {
        let patterns = vec![
            format!("{}/**/*.jsx", pattern),
            format!("{}/**/*.tsx", pattern),
            format!("{}/**/*.js", pattern),
            format!("{}/**/*.ts", pattern),
            format!("{}/**/*.xml", pattern),
            format!("{}/**/*.svg", pattern),
            format!("{}/**/*.html", pattern),
            format!("{}/**/*.htm", pattern),
        ];
        
        let mut files = Vec::new();
        for pattern in patterns {
            for entry in glob(&pattern)? {
                if let Ok(path) = entry {
                    files.push(path);
                }
            }
        }
        return Ok(files);
    }
    
    // Treat as glob pattern
    let mut files = Vec::new();
    for entry in glob(pattern)? {
        if let Ok(path) = entry {
            files.push(path);
        }
    }
    
    Ok(files)
}

fn detect_file_type(path: &Path, content: &str) -> FileType {
    // Check by file extension first
    if let Some(ext) = path.extension() {
        let ext_str = ext.to_str().unwrap_or("").to_lowercase();
        match ext_str.as_str() {
            "jsx" | "tsx" => return FileType::Jsx,
            "xml" | "svg" => return FileType::Xml,
            "html" | "htm" => return FileType::Html,
            _ => {}
        }
    }
    
    // Check by content
    let trimmed = content.trim();
    if trimmed.starts_with("<?xml") || trimmed.starts_with("<svg") {
        FileType::Xml
    } else if trimmed.starts_with("<!DOCTYPE") || trimmed.starts_with("<html") {
        FileType::Html
    } else if trimmed.contains("jsx") || trimmed.contains("React") || trimmed.contains("=>") {
        FileType::Jsx
    } else if trimmed.starts_with("<") {
        FileType::Html
    } else {
        FileType::Jsx
    }
}