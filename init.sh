#!/usr/bin/env bash
#
# Run once after forking to make the repo your own.
# Asks for the app's names, then replaces every placeholder in the repo's
# text files. The steps that can't be scripted are printed at the end.

set -euo pipefail

# resolve this script's own path before changing directory, so it can skip itself
SELF="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/$(basename "${BASH_SOURCE[0]}")"
cd "$(git rev-parse --show-toplevel)"

PLACEHOLDERS=(APP_DISPLAY_NAME APP_DESCRIPTION APP_DEFAULT_IMAGE_ALT app_binary_name)

# These end up inside JSON, HTML and source strings, where they would break the file.
BAD_CHARS='["\<>`$]'

trim() {
	local s="$1"
	s="${s#"${s%%[![:space:]]*}"}"
	s="${s%"${s##*[![:space:]]}"}"
	printf '%s' "$s"
}

# ask_text "prompt": sets ANSWER to a non-empty value without risky characters
ask_text() {
	local value
	while true; do
		read -r -p "$1: " value || { echo; echo "Input closed, nothing changed." >&2; exit 1; }
		value="$(trim "$value")"
		if [[ -z "$value" ]]; then
			echo "  This can't be empty."
		elif [[ "$value" =~ $BAD_CHARS ]]; then
			echo '  Please avoid " \ < > ` and $ - they break JSON/HTML.'
		else
			ANSWER="$value"
			return
		fi
	done
}

# ask_binary "prompt": sets ANSWER to a safe lowercase binary name
ask_binary() {
	local value
	while true; do
		read -r -p "$1: " value || { echo; echo "Input closed, nothing changed." >&2; exit 1; }
		value="$(trim "$value")"
		if [[ "$value" =~ ^[a-z][a-z0-9_-]*$ ]]; then
			ANSWER="$value"
			return
		fi
		echo "  Use lowercase letters, digits, - and _, starting with a letter."
	done
}

# ---- find the files that still contain a placeholder ----

patterns=()
for p in "${PLACEHOLDERS[@]}"; do
	patterns+=(-e "$p")
done

files=()
while IFS= read -r -d '' f; do
	[[ "$f" -ef "$SELF" ]] && continue
	files+=("$f")
done < <(git grep -l -I -F -z --untracked "${patterns[@]}" || true)

if [[ ${#files[@]} -eq 0 ]]; then
	echo "No placeholders found, nothing to replace (already run?)."
	exit 0
fi

echo "Found placeholders in ${#files[@]} file(s)."
echo

# ---- ask ----

ask_text "App display name"
display_name="$ANSWER"
ask_text "App description (one sentence, used in the manifest)"
description="$ANSWER"
ask_text "Default image alt text (describes the og image)"
image_alt="$ANSWER"
ask_binary "Binary name (lowercase, e.g. my-app)"
binary_name="$ANSWER"

echo
echo "  APP_DISPLAY_NAME      -> $display_name"
echo "  APP_DESCRIPTION       -> $description"
echo "  APP_DEFAULT_IMAGE_ALT -> $image_alt"
echo "  app_binary_name       -> $binary_name"
echo
read -r -p "Apply to ${#files[@]} file(s)? [y/N] " confirm || confirm=""
if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
	echo "Cancelled, nothing changed."
	exit 1
fi

# ---- replace ----
# Values go in through the environment and are looked up in one pass, so
# characters like / & ' in them are never treated as pattern syntax, and a
# replacement can't be re-matched by a later placeholder.

PERL_SCRIPT=$(
	cat <<'EOF'
BEGIN {
	%m = (
		"APP_DISPLAY_NAME"      => $ENV{R_NAME},
		"APP_DESCRIPTION"       => $ENV{R_DESC},
		"APP_DEFAULT_IMAGE_ALT" => $ENV{R_ALT},
		"app_binary_name"       => $ENV{R_BIN},
	);
	$re = join "|", map { quotemeta } keys %m;
}
s/($re)/$m{$1}/g;
EOF
)

R_NAME="$display_name" R_DESC="$description" R_ALT="$image_alt" R_BIN="$binary_name" \
	perl -pi -e "$PERL_SCRIPT" "${files[@]}"

echo
echo "Updated:"
printf '  %s\n' "${files[@]}"

# file or folder names can't be fixed by replacing contents, so just warn
paths="$(git ls-files --cached --others --exclude-standard || true)"
if grep -qF "${patterns[@]}" <<<"$paths"; then
	echo
	echo "Warning: some file or folder NAMES still contain a placeholder; rename them by hand:"
	grep -F "${patterns[@]}" <<<"$paths" | sed 's/^/  /'
fi

cat <<'EOF'

Still to do by hand:
  1. Make a logo, then generate the favicon set at https://realfavicongenerator.net/
     and replace the defaults in frontend/static (keep the file names the same).
  2. Make the og image (1200 x 630, e.g. in Canva) and replace the default.
  3. Review the changes with: git diff
EOF