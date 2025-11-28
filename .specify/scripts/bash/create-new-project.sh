#!/usr/bin/env bash

set -e

JSON_MODE=false
PROJECT_NAME=""
PROJECT_NUMBER=""
ARGS=()
i=1
while [ $i -le $# ]; do
    arg="${!i}"
    case "$arg" in
        --json) 
            JSON_MODE=true 
            ;;
        --project-name)
            if [ $((i + 1)) -gt $# ]; then
                echo 'Error: --project-name requires a value' >&2
                exit 1
            fi
            i=$((i + 1))
            next_arg="${!i}"
            # Check if the next argument is another option (starts with --)
            if [[ "$next_arg" == --* ]]; then
                echo 'Error: --project-name requires a value' >&2
                exit 1
            fi
            PROJECT_NAME="$next_arg"
            ;;
        --number)
            if [ $((i + 1)) -gt $# ]; then
                echo 'Error: --number requires a value' >&2
                exit 1
            fi
            i=$((i + 1))
            next_arg="${!i}"
            if [[ "$next_arg" == --* ]]; then
                echo 'Error: --number requires a value' >&2
                exit 1
            fi
            PROJECT_NUMBER="$next_arg"
            ;;
        --help|-h) 
            echo "Usage: $0 [--json] [--project-name <name>] [--number N] <project_description>"
            echo ""
            echo "Options:"
            echo "  --json              Output in JSON format"
            echo "  --project-name <name> Provide a custom project name (2-4 words) for the directory"
            echo "  --number N          Specify project number manually (overrides auto-detection)"
            echo "  --help, -h          Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0 'AI GOV XPLAIN 專案' --project-name 'AI-GOV-XPLAIN'"
            echo "  $0 '法人財報預警模型' --project-name 'FINWARN' --number 2"
            exit 0
            ;;
        *) 
            ARGS+=("$arg") 
            ;;
    esac
    i=$((i + 1))
done

PROJECT_DESCRIPTION="${ARGS[*]}"
if [ -z "$PROJECT_DESCRIPTION" ]; then
    echo "Usage: $0 [--json] [--project-name <name>] [--number N] <project_description>" >&2
    exit 1
fi

# Function to find the repository root by searching for existing project markers
find_repo_root() {
    local dir="$1"
    while [ "$dir" != "/" ]; do
        if [ -d "$dir/.git" ] || [ -d "$dir/.specify" ]; then
            echo "$dir"
            return 0
        fi
        dir="$(dirname "$dir")"
    done
    return 1
}

# Function to get highest number from project directory
get_highest_from_projects() {
    local project_dir="$1"
    local highest=0
    
    if [ -d "$project_dir" ]; then
        for dir in "$project_dir"/*; do
            [ -d "$dir" ] || continue
            dirname=$(basename "$dir")
            number=$(echo "$dirname" | grep -o '^[0-9]\+' || echo "0")
            number=$((10#$number))
            if [ "$number" -gt "$highest" ]; then
                highest=$number
            fi
        done
    fi
    
    echo "$highest"
}

# Function to clean and format a project name
clean_project_name() {
    local name="$1"
    echo "$name" | tr '[:lower:]' '[:upper:]' | sed 's/[^A-Z0-9]/-/g' | sed 's/-\+/-/g' | sed 's/^-//' | sed 's/-$//'
}

# Function to generate project name with stop word filtering
generate_project_name() {
    local description="$1"
    
    # Convert to uppercase and split into words
    local clean_name=$(echo "$description" | tr '[:lower:]' '[:upper:]' | sed 's/[^A-Za-z0-9\u4e00-\u9fa5]/ /g')
    
    # Take first 2-3 meaningful words
    local words=()
    for word in $clean_name; do
        # Skip empty words
        [ -z "$word" ] && continue
        
        # Keep words (Chinese or English with length >= 2)
        if [ ${#word} -ge 2 ]; then
            words+=("$word")
        fi
    done
    
    # If we have meaningful words, use first 2-3 of them
    if [ ${#words[@]} -gt 0 ]; then
        local max_words=2
        if [ ${#words[@]} -ge 3 ]; then max_words=3; fi
        
        local result=""
        local count=0
        for word in "${words[@]}"; do
            if [ $count -ge $max_words ]; then break; fi
            if [ -n "$result" ]; then result="$result-"; fi
            result="$result$word"
            count=$((count + 1))
        done
        echo "$result"
    else
        # Fallback to cleaned description
        local cleaned=$(clean_project_name "$description")
        echo "$cleaned" | tr '-' '\n' | grep -v '^$' | head -3 | tr '\n' '-' | sed 's/-$//'
    fi
}

# Resolve repository root
SCRIPT_DIR="$(CDPATH="" cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if git rev-parse --show-toplevel >/dev/null 2>&1; then
    REPO_ROOT=$(git rev-parse --show-toplevel)
    HAS_GIT=true
else
    REPO_ROOT="$(find_repo_root "$SCRIPT_DIR")"
    if [ -z "$REPO_ROOT" ]; then
        echo "Error: Could not determine repository root. Please run this script from within the repository." >&2
        exit 1
    fi
    HAS_GIT=false
fi

cd "$REPO_ROOT"

PROJECT_ROOT="$REPO_ROOT/project"
mkdir -p "$PROJECT_ROOT"

# Generate project name
if [ -n "$PROJECT_NAME" ]; then
    # Use provided project name, just clean it up
    PROJECT_SUFFIX=$(clean_project_name "$PROJECT_NAME")
else
    # Generate from description
    PROJECT_SUFFIX=$(generate_project_name "$PROJECT_DESCRIPTION")
fi

# Determine project number
if [ -z "$PROJECT_NUMBER" ]; then
    HIGHEST=$(get_highest_from_projects "$PROJECT_ROOT")
    PROJECT_NUMBER=$((HIGHEST + 1))
fi

PROJECT_NUM=$(printf "%03d" "$PROJECT_NUMBER")
PROJECT_DIR_NAME="${PROJECT_NUM}-${PROJECT_SUFFIX}"

# Validate project directory doesn't already exist
if [ -d "$PROJECT_ROOT/$PROJECT_DIR_NAME" ]; then
    echo "Error: Project directory already exists: $PROJECT_ROOT/$PROJECT_DIR_NAME" >&2
    exit 1
fi

PROJECT_DIR="$PROJECT_ROOT/$PROJECT_DIR_NAME"
mkdir -p "$PROJECT_DIR"

# Create subdirectories
mkdir -p "$PROJECT_DIR/API"
mkdir -p "$PROJECT_DIR/audit"
mkdir -p "$PROJECT_DIR/business"
mkdir -p "$PROJECT_DIR/infosec"
mkdir -p "$PROJECT_DIR/law"
mkdir -p "$PROJECT_DIR/meta"
mkdir -p "$PROJECT_DIR/nfr"
mkdir -p "$PROJECT_DIR/process"
mkdir -p "$PROJECT_DIR/export"

# Create 00meta.md from template
TEMPLATE="$REPO_ROOT/.specify/templates/00_meta-template.md"
META_FILE="$PROJECT_DIR/meta/00_meta.md"
if [ -f "$TEMPLATE" ]; then 
    cp "$TEMPLATE" "$META_FILE"
else 
    touch "$META_FILE"
fi

# Set the PROJECT_CONTEXT environment variable for the current session
export PROJECT_CONTEXT="$PROJECT_DIR_NAME"

if $JSON_MODE; then
    printf '{"PROJECT_DIR_NAME":"%s","PROJECT_DIR":"%s","PROJECT_NUM":"%s","META_FILE":"%s"}\n' "$PROJECT_DIR_NAME" "$PROJECT_DIR" "$PROJECT_NUM" "$META_FILE"
else
    echo "PROJECT_DIR_NAME: $PROJECT_DIR_NAME"
    echo "PROJECT_DIR: $PROJECT_DIR"
    echo "PROJECT_NUM: $PROJECT_NUM"
    echo "META_FILE: $META_FILE"
    echo "PROJECT_CONTEXT environment variable set to: $PROJECT_DIR_NAME"
    echo ""
    echo "Project directory structure created:"
    echo "  $PROJECT_DIR_NAME/"
    echo "    ├── API/"
    echo "    ├── audit/"
    echo "    ├── business/"
    echo "    ├── infosec/"
    echo "    ├── law/"
    echo "    ├── meta/"
    echo "    │   └── 00_meta.md"
    echo "    ├── nfr/"
    echo "    ├── process/"
    echo "    └── export/"
fi
