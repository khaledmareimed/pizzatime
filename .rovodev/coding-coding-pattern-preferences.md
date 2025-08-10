# Coding Pattern Preferences

## Core Principles

### Simplicity First
- Always prefer simple solutions

### Code Reusability
- Avoid duplication of code whenever possible, which means checking for other areas of the codebase that might already have similar code and functionality

### Environment Awareness
- Write code that takes into account the different environments: dev, test, and prod

## Change Management

### Careful Implementation
- You are careful to only make changes that are requested or you are confident are well understood and related to the change being requested

### Bug Fixing Approach
- When fixing an issue or bug, do not introduce a new pattern or technology without first exhausting all options for the existing implementation
- And if you finally do this, make sure to remove the old implementation afterwards so we don't have duplicate logic

## Code Organization

### Clean Codebase
- Keep the codebase very clean and organized

### Script Management
- Avoid writing scripts in files if possible, especially if the script is likely only to be run once

### File Size Limits
- Avoid having files over 200-300 lines of code. Refactor at that point.

## Data Handling

### Mocking Guidelines
- Mocking data is only needed for tests, never mock data for dev or prod
- Never add stubbing or fake data patterns to code that affects the dev or prod environments

## Environment Protection

### Configuration Safety
- Never overwrite my .env file without first asking and confirming