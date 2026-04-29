/**
 * Shared LaTeX sanitization utility.
 *
 * Auto-injects missing packages, strips incompatible packages,
 * and applies safety-net fixes before compiling LaTeX → PDF.
 *
 * Used by both /api/export-pdf and /api/export-pdf-with-style.
 */

/** Packages to auto-inject when their commands are detected */
const PACKAGE_RULES: { pkg: string; commands: RegExp }[] = [
	{
		pkg: "titlesec",
		commands: /\\titlerule|\\titleformat|\\titlespacing/,
	},
	{ pkg: "hyperref", commands: /\\href\{|\\url\{/ },
	{ pkg: "xcolor", commands: /\\textcolor\{|\\color\{|\\definecolor\{/ },
	{ pkg: "geometry", commands: /\\geometry\{|\\newgeometry\{/ },
	{
		pkg: "enumitem",
		commands: /\\begin\{itemize\}\[|\\begin\{enumerate\}\[/,
	},
	{
		pkg: "fontawesome5",
		commands:
			/\\faIcon\{|\\faEnvelope|\\faPhone|\\faLinkedin|\\faGithub/,
	},
	{ pkg: "tabularx", commands: /\\begin\{tabularx\}/ },
	{ pkg: "multicol", commands: /\\begin\{multicols\}/ },
	{ pkg: "setspace", commands: /\\setstretch\{|\\singlespacing|\\doublespacing/ },
];

/**
 * Safety net: auto-inject missing LaTeX packages based on commands used.
 * Prevents compile failures when the AI generates LaTeX using commands
 * without including the required \usepackage declaration.
 *
 * @param latex  Raw LaTeX source
 * @param options.keepLmodern  If true, do not strip \usepackage{lmodern}
 *                             (set when user explicitly chose lmodern font)
 */
export function sanitizeLatex(
	latex: string,
	options?: { keepLmodern?: boolean },
): string {
	let result = latex;

	for (const { pkg, commands } of PACKAGE_RULES) {
		// Check if command is used but package is not declared
		const pkgPattern = new RegExp(
			`\\\\usepackage(\\[[^\\]]*\\])?\\{[^}]*\\b${pkg}\\b[^}]*\\}`,
		);

		if (commands.test(result) && !pkgPattern.test(result)) {
			// Inject before \begin{document}
			const beginDocIdx = result.indexOf("\\begin{document}");
			if (beginDocIdx !== -1) {
				const injection = `\\usepackage{${pkg}}\n`;
				result =
					result.slice(0, beginDocIdx) +
					injection +
					result.slice(beginDocIdx);
				console.log(
					`[sanitizeLatex] Auto-injected missing \\usepackage{${pkg}}`,
				);
			}
		}
	}

	// Strip lmodern unless the user explicitly chose it
	if (!options?.keepLmodern) {
		result = result.replace(/\\usepackage\{lmodern\}\s*/g, "");
	}

	// Strip XeLaTeX-only packages that break pdflatex
	for (const pkg of ["fontspec", "unicode-math", "polyglossia"]) {
		result = result.replace(
			new RegExp(
				`^[ \\t]*\\\\usepackage(\\[[^\\]]*\\])?\\{${pkg}\\}[ \\t]*$\\n?`,
				"gm",
			),
			"",
		);
	}
	result = result.replace(
		/^[ \t]*\\(?:setmainfont|setsansfont|setmonofont)\{[^}]*\}[ \t]*$\n?/gm,
		"",
	);

	return result;
}
