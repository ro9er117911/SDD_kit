#!/usr/bin/env bash
# Common functions and variables for all scripts

# Get repository root, with fallback for non-git repositories
get_repo_root() {
    if git rev-parse --show-toplevel >/dev/null 2>&1; then
        git rev-parse --show-toplevel
    else
        # Fall back to script location for non-git repos
        local script_dir="$(CDPATH="" cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
        (cd "$script_dir/../../.." && pwd)
    fi
}

# Get current branch, with fallback for non-git repositories
get_current_branch() {
    # First check if SPECIFY_FEATURE environment variable is set
    if [[ -n "${SPECIFY_FEATURE:-}" ]]; then
        echo "$SPECIFY_FEATURE"
        return
    fi

    # Then check git if available
    if git rev-parse --abbrev-ref HEAD >/dev/null 2>&1; then
        git rev-parse --abbrev-ref HEAD
        return
    fi

    # For non-git repos, try to find the latest feature directory
    local repo_root=$(get_repo_root)
    local specs_dir="$repo_root/specs"

    if [[ -d "$specs_dir" ]]; then
        local latest_feature=""
        local highest=0

        for dir in "$specs_dir"/*; do
            if [[ -d "$dir" ]]; then
                local dirname=$(basename "$dir")
                if [[ "$dirname" =~ ^([0-9]{3})- ]]; then
                    local number=${BASH_REMATCH[1]}
                    number=$((10#$number))
                    if [[ "$number" -gt "$highest" ]]; then
                        highest=$number
                        latest_feature=$dirname
                    fi
                fi
            fi
        done

        if [[ -n "$latest_feature" ]]; then
            echo "$latest_feature"
            return
        fi
    fi

    echo "main"  # Final fallback
}

# Check if we have git available
has_git() {
    git rev-parse --show-toplevel >/dev/null 2>&1
}

check_feature_branch() {
    local branch="$1"
    local has_git_repo="$2"

    # For non-git repos, we can't enforce branch naming but still provide output
    if [[ "$has_git_repo" != "true" ]]; then
        echo "[specify] Warning: Git repository not detected; skipped branch validation" >&2
        return 0
    fi

    if [[ ! "$branch" =~ ^[0-9]{3}- ]]; then
        echo "ERROR: Not on a feature branch. Current branch: $branch" >&2
        echo "Feature branches should be named like: 001-feature-name" >&2
        return 1
    fi

    return 0
}

get_feature_dir() { echo "$1/specs/$2"; }

# Find feature directory by numeric prefix instead of exact branch match
# This allows multiple branches to work on the same spec (e.g., 004-fix-bug, 004-add-feature)
find_feature_dir_by_prefix() {
    local repo_root="$1"
    local branch_name="$2"
    local specs_dir="$repo_root/specs"

    # Extract numeric prefix from branch (e.g., "004" from "004-whatever")
    if [[ ! "$branch_name" =~ ^([0-9]{3})- ]]; then
        # If branch doesn't have numeric prefix, fall back to exact match
        echo "$specs_dir/$branch_name"
        return
    fi

    local prefix="${BASH_REMATCH[1]}"

    # Search for directories in specs/ that start with this prefix
    local matches=()
    if [[ -d "$specs_dir" ]]; then
        for dir in "$specs_dir"/"$prefix"-*; do
            if [[ -d "$dir" ]]; then
                matches+=("$(basename "$dir")")
            fi
        done
    fi

    # Handle results
    if [[ ${#matches[@]} -eq 0 ]]; then
        # No match found - return the branch name path (will fail later with clear error)
        echo "$specs_dir/$branch_name"
    elif [[ ${#matches[@]} -eq 1 ]]; then
        # Exactly one match - perfect!
        echo "$specs_dir/${matches[0]}"
    else
        # Multiple matches - this shouldn't happen with proper naming convention
        echo "ERROR: Multiple spec directories found with prefix '$prefix': ${matches[*]}" >&2
        echo "Please ensure only one spec directory exists per numeric prefix." >&2
        echo "$specs_dir/$branch_name"  # Return something to avoid breaking the script
    fi
}

get_feature_paths() {
    local repo_root=$(get_repo_root)
    local current_branch=$(get_current_branch)
    local has_git_repo="false"

    if has_git; then
        has_git_repo="true"
    fi

    # Use prefix-based lookup to support multiple branches per spec
    local feature_dir=$(find_feature_dir_by_prefix "$repo_root" "$current_branch")

    cat <<EOF
REPO_ROOT='$repo_root'
CURRENT_BRANCH='$current_branch'
HAS_GIT='$has_git_repo'
FEATURE_DIR='$feature_dir'
FEATURE_SPEC='$feature_dir/spec.md'
IMPL_PLAN='$feature_dir/plan.md'
TASKS='$feature_dir/tasks.md'
RESEARCH='$feature_dir/research.md'
DATA_MODEL='$feature_dir/data-model.md'
QUICKSTART='$feature_dir/quickstart.md'
CONTRACTS_DIR='$feature_dir/contracts'
EOF
}

check_file() { [[ -f "$1" ]] && echo "  ✓ $2" || echo "  ✗ $2"; }
check_dir() { [[ -d "$1" && -n $(ls -A "$1" 2>/dev/null) ]] && echo "  ✓ $2" || echo "  ✗ $2"; }

# =============================================================================
# Project Management Functions
# =============================================================================

# Get project root directory
get_project_root() {
    local repo_root=$(get_repo_root)
    echo "$repo_root/project"
}

# Get highest number from project directory
get_highest_project_number() {
    local project_root="$1"
    local highest=0
    
    if [[ -d "$project_root" ]]; then
        for dir in "$project_root"/*; do
            [[ -d "$dir" ]] || continue
            local dirname=$(basename "$dir")
            local number=$(echo "$dirname" | grep -o '^[0-9]\+' || echo "0")
            number=$((10#$number))
            if [[ "$number" -gt "$highest" ]]; then
                highest=$number
            fi
        done
    fi
    
    echo "$highest"
}

# Get current project directory (from PROJECT_CONTEXT env var or latest)
get_current_project() {
    # First check if PROJECT_CONTEXT environment variable is set
    if [[ -n "${PROJECT_CONTEXT:-}" ]]; then
        echo "$PROJECT_CONTEXT"
        return
    fi
    
    # Try to find the latest project directory
    local project_root=$(get_project_root)
    
    if [[ -d "$project_root" ]]; then
        local latest_project=""
        local highest=0
        
        for dir in "$project_root"/*; do
            if [[ -d "$dir" ]]; then
                local dirname=$(basename "$dir")
                if [[ "$dirname" =~ ^([0-9]{3})- ]]; then
                    local number=${BASH_REMATCH[1]}
                    number=$((10#$number))
                    if [[ "$number" -gt "$highest" ]]; then
                        highest=$number
                        latest_project=$dirname
                    fi
                fi
            fi
        done
        
        if [[ -n "$latest_project" ]]; then
            echo "$latest_project"
            return
        fi
    fi
    
    echo ""  # No project found
}

# Find project directory by numeric prefix
find_project_dir_by_prefix() {
    local project_root="$1"
    local project_name="$2"
    
    # Extract numeric prefix from project name (e.g., "001" from "001-PROJECTNAME")
    if [[ ! "$project_name" =~ ^([0-9]{3})- ]]; then
        # If project doesn't have numeric prefix, fall back to exact match
        echo "$project_root/$project_name"
        return
    fi
    
    local prefix="${BASH_REMATCH[1]}"
    
    # Search for directories in project/ that start with this prefix
    local matches=()
    if [[ -d "$project_root" ]]; then
        for dir in "$project_root"/"$prefix"-*; do
            if [[ -d "$dir" ]]; then
                matches+=("$(basename "$dir")")
            fi
        done
    fi
    
    # Handle results
    if [[ ${#matches[@]} -eq 0 ]]; then
        # No match found - return the project name path
        echo "$project_root/$project_name"
    elif [[ ${#matches[@]} -eq 1 ]]; then
        # Exactly one match - perfect!
        echo "$project_root/${matches[0]}"
    else
        # Multiple matches
        echo "ERROR: Multiple project directories found with prefix '$prefix': ${matches[*]}" >&2
        echo "$project_root/$project_name"
    fi
}

# Get project paths (similar to get_feature_paths)
get_project_paths() {
    local repo_root=$(get_repo_root)
    local project_root=$(get_project_root)
    local current_project=$(get_current_project)
    
    local project_dir=""
    if [[ -n "$current_project" ]]; then
        project_dir=$(find_project_dir_by_prefix "$project_root" "$current_project")
    fi
    
    cat <<EOF
PROJECT_ROOT='$project_root'
CURRENT_PROJECT='$current_project'
PROJECT_DIR='$project_dir'
PROJECT_META='$project_dir/meta/00_meta.md'
PROJECT_BUSINESS='$project_dir/business/10_business.md'
PROJECT_PROCESS='$project_dir/process/'
PROJECT_INFOSEC='$project_dir/infosec/70_infosec.md'
PROJECT_LAW='$project_dir/law/60_law.md'
PROJECT_AUDIT='$project_dir/audit/90_audit.md'
PROJECT_NFR='$project_dir/nfr/80_nfr.md'
PROJECT_EXPORT='$project_dir/export/'
EOF
}


