#!/bin/sh
# Keep local master equal to origin/master, fast-forward only. Quiet when current.
# Exit 0 = current/updated, 1 = refused (dirty, diverged, or fetch failed). Never forces or discards.
set -u
warn() { echo "sync-master: $*" >&2; }

git rev-parse --git-dir >/dev/null 2>&1 || { warn "not a git repo"; exit 1; }
git fetch --quiet origin master 2>/dev/null || { warn "fetch failed (offline?); master not updated"; exit 1; }

new=$(git rev-parse --verify -q origin/master) || { warn "no origin/master"; exit 1; }
old=$(git rev-parse --verify -q refs/heads/master) || { git branch master origin/master && echo "sync-master: created master at $(git rev-parse --short "$new")"; exit 0; }
[ "$old" = "$new" ] && exit 0

if ! git merge-base --is-ancestor "$old" "$new"; then
  warn "local master has commits not on origin/master; not touching it:"
  git log --oneline "$new..$old" >&2
  exit 1
fi

# Is master checked out in some worktree?
wt=$(git worktree list --porcelain | awk '/^worktree /{p=substr($0,10)} $0=="branch refs/heads/master"{print p; exit}')
if [ -n "$wt" ]; then
  if [ -n "$(git -C "$wt" status --porcelain)" ]; then
    warn "master is checked out and dirty in $wt; not updated"
    exit 1
  fi
  git -C "$wt" merge --quiet --ff-only origin/master || { warn "ff-merge failed in $wt"; exit 1; }
else
  git fetch --quiet origin master:master || { warn "fast-forward of master failed"; exit 1; }
fi

n=$(git rev-list --count "$old..$new")
echo "sync-master: master $(git rev-parse --short "$old") -> $(git rev-parse --short "$new") ($n commits)"
