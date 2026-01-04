# Agent Pipeline

All processing follows this order:

1. Raw Inputs
2. Normalization
3. Case Notebook Update
4. Structured Output Generation
5. UI Publication

Agents may NOT:
- bypass the Case Notebook
- prompt directly from raw documents
- mix inference with fact without labeling

The Case Notebook is the single source of truth.
