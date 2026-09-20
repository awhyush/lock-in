# The Lock-In

A daily habit tracker for a gym / study / job-search reset routine: exercise, DSA study, job applications, technical build work, and general movement, with weekday-specific minimums (e.g. Tuesday's football night counts as movement, no evening study expected).

## Live version

Open it here (syncs progress across devices via Claude's `db` capability, signed in):
https://claude.ai/artifact/UzGHH5Q2bjnfBLLjfhV3fk

## This repo

`index.html` is the same page as the live artifact. Opened as a plain local file it still renders and lets you click around, but it won't save anything — `window.claude` (the sync layer) only exists inside the claude.ai artifact viewer.

To make a change and publish it live, edit `index.html` here, then republish the file to the artifact URL above.

## Habits

| Habit | Minimum |
|---|---|
| Exercise | 30 min |
| Study / DSA | 60 min |
| Job applications | 45 min, aim for 5 |
| Technical work (React/TS/full-stack build) | 60 min |
| Movement | 20–30 min |

Weekday rules (which habits are "core" vs "bonus" that day) live in `DAY_RULES` near the top of the script in `index.html`.
