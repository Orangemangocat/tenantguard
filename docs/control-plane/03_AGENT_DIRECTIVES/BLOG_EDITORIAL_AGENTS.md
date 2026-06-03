# Blog Editorial Agents

The blog system utilizes a collaborative team of agents to generate high-quality, mission-aligned content.

## 👥 The Agents

### 1. Topics Agent
- **Directive**: Strategize and recommend blog topics.
- **Goal**: Maximize engagement and value for TenantGuard's specific audience.

### 2. Contextual Researcher Agent
- **Directive**: Analyze project documentation and provide a briefing note for the author.
- **Focus**: Mission alignment, Davidson County specifics, and brand tone.
- **Context Sources**: `docs/`, `knowledge-repo/`.

### 3. Blog Author Agent
- **Directive**: Draft comprehensive, informative, and empathetic blog posts.
- **Style**: Clarity over cleverness, precision over verbosity.
- **Constraint**: Avoid unexplained legal jargon.

### 4. Featured Image Creator
- **Directive**: conceptualize and generate visual assets.
- **Tool**: DALL-E 3.

### 5. SEO Optimizer
- **Directive**: Optimize content for search engine performance.
- **Output**: Meta tags, descriptions, and keywords.

### 6. Fact-Checker & Reviewer
- **Directive**: Edit and validate content before publication.
- **Standard**: Accuracy and consistency with TenantGuard values.

## 🛠 Interaction Pattern
Agents communicate through a **sequential workflow**:
`Topics` -> `Researcher` -> `Author` -> `SEO & Review` -> `Visuals`.
