#!/bin/bash

# Generate PDF from Markdown Documentation
# Requires: pandoc, texlive (for LaTeX)

echo "🔄 Generating PDF from LUMO_COMPLETE_DOCUMENTATION.md"
echo ""

# Check if pandoc is installed
if ! command -v pandoc &> /dev/null; then
    echo "❌ Error: pandoc is not installed"
    echo ""
    echo "Install pandoc:"
    echo "  Ubuntu/Debian: sudo apt-get install pandoc texlive-latex-base texlive-fonts-recommended"
    echo "  macOS: brew install pandoc basictex"
    echo "  Windows: Download from https://pandoc.org/installing.html"
    echo ""
    echo "Alternative methods:"
    echo "  1. Use online converter: https://www.markdowntopdf.com/"
    echo "  2. Use VS Code extension: 'Markdown PDF'"
    echo "  3. Use Node.js: npm install -g markdown-pdf"
    exit 1
fi

# Generate PDF
echo "📄 Converting Markdown to PDF..."
pandoc LUMO_COMPLETE_DOCUMENTATION.md \
    -o LUMO_COMPLETE_DOCUMENTATION.pdf \
    --from markdown \
    --to pdf \
    --toc \
    --toc-depth=3 \
    --number-sections \
    --highlight-style=tango \
    --pdf-engine=pdflatex \
    -V geometry:margin=1in \
    -V fontsize=11pt \
    -V documentclass=report \
    -V papersize=letter \
    -V colorlinks=true \
    -V linkcolor=blue \
    -V urlcolor=blue \
    -V toccolor=black

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ PDF generated successfully!"
    echo ""
    echo "📄 Output: LUMO_COMPLETE_DOCUMENTATION.pdf"
    echo ""

    # Get file size
    if [ -f "LUMO_COMPLETE_DOCUMENTATION.pdf" ]; then
        SIZE=$(du -h LUMO_COMPLETE_DOCUMENTATION.pdf | cut -f1)
        echo "📊 File size: $SIZE"
    fi

    echo ""
    echo "You can open it with:"
    echo "  Linux: xdg-open LUMO_COMPLETE_DOCUMENTATION.pdf"
    echo "  macOS: open LUMO_COMPLETE_DOCUMENTATION.pdf"
    echo "  Windows: start LUMO_COMPLETE_DOCUMENTATION.pdf"
else
    echo ""
    echo "❌ PDF generation failed"
    echo ""
    echo "Try alternative method:"
    echo "  npm install -g markdown-pdf"
    echo "  markdown-pdf LUMO_COMPLETE_DOCUMENTATION.md"
fi
