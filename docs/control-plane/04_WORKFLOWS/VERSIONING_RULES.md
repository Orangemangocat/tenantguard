# Versioning Rules

## Notebooks
- notebook_version increments on any upstream change

## Generators
- generator_version increments when prompts/schemas change

## Artifacts
- must store: notebook_version + generator_version + timestamp
- old artifacts remain accessible

## Backward compatibility
Schema changes must include a migration plan.
