# AI-Powered Blog Article Writing System

This document outlines the technical architecture and multi-agent workflow of the TenantGuard AI blog system.

## 🏗 System Architecture

The system is integrated directly into the Django backend and exposed via the Django Admin interface. It utilizes a modular, multi-agent design powered by OpenAI's GPT-4 and DALL-E 3 models.

### Core Components
- **`ai_agents.py`**: Contains the logic for the specialized agents and the `BlogGeneratorWorkflow` class.
- **`admin.py`**: Registers the AI-specific views and extends the Django Admin UI.
- **`ai_generator.html`**: A custom admin template for the multi-step generation interface.
- **`ai_generate_api`**: A JSON-based API endpoint that manages communication between the frontend and the AI agents.

---

## 🤖 The Agents (The "Editorial Team")

The system uses a sequential multi-agent workflow to ensure content is both high-quality and contextually accurate.

### 1. Topics Agent (`TopicsAgent`)
- **Responsibility**: Strategic topic selection.
- **Input**: User-provided theme/interests.
- **Output**: 5 Timely, relevant, and engaging blog topics with a "Top Recommendation."

### 2. Contextual Researcher Agent (`ContextualResearcherAgent`)
- **Responsibility**: Ensuring brand alignment and factual grounding.
- **Input**: The chosen topic.
- **Process**: Reads local documentation from `docs/` and `knowledge-repo/` (e.g., `PRODUCT_VISION.md`, `DOMAIN_MODEL.md`).
- **Output**: A **Briefing Note** for the author, highlighting:
    - Alignment with TenantGuard’s mission.
    - Audience focus (Tennessee tenants, specifically Davidson County).
    - Tone guidance (Clarity, Precision, Empathy for "stressed non-lawyers").

### 3. Blog Author Agent (`BlogAuthorAgent`)
- **Responsibility**: Creative writing.
- **Input**: Topic + Briefing Note.
- **Output**: A full-length, Markdown-formatted blog post.

### 4. Featured Image Creator Agent (`FeaturedImageCreatorAgent`)
- **Responsibility**: Visual storytelling.
- **Input**: Blog title + content.
- **Process**: Generates a conceptual prompt for DALL-E 3 and executes the image generation.
- **Output**: A 1024x1024 striking featured image.

### 5. SEO Optimizer Agent (`SEOOptimizerAgent`)
- **Responsibility**: Search engine visibility.
- **Input**: Title + Content.
- **Output**: Meta titles, meta descriptions, and optimized tags.

### 6. Fact-Checker & Reviewer Agent (`FactCheckerReviewerAgent`)
- **Responsibility**: Editorial quality control.
- **Input**: The full article.
- **Output**: A review status (Passed/Flagged) with suggestions for improvement.

---

## 🛠 Technical Workflow

The `BlogGeneratorWorkflow` class orchestrates the interaction between agents:

1.  **Step 1 (Topics)**: User triggers `get_topics`.
2.  **Step 2 (Content)**: Once a topic is selected, the workflow runs the Researcher, Author, SEO Optimizer, and Reviewer in sequence.
3.  **Step 3 (Visuals)**: User triggers `generate_image`.
4.  **Final (Save)**: The user reviews all outputs and saves them to the database.

---

## ⚙️ Configuration & Requirements

### Dependencies
- `openai`: For GPT-4 and DALL-E 3 integration.
- `requests`: For downloading generated images from OpenAI's CDN.
- `Pillow`: For handling image storage in Django.

### Environment Variables
The following environment variable must be set in your `.env` file for the system to function:
```bash
OPENAI_API_KEY=your_openai_api_key_here
```

### File Locations
- **Logic**: `backend/blog/ai_agents.py`
- **Views**: `backend/blog/views.py` (see `ai_generator_view` and `ai_generate_api`)
- **Templates**: `backend/templates/admin/blog/`
- **Static Assets**: `media/blog/images/`

---

## 🧪 Documentation Alignment
This system is designed to be "self-aware" of the TenantGuard project. If you update the files in `docs/control-plane/` or `knowledge-repo/`, the **Contextual Researcher Agent** will automatically incorporate the new information into future articles.
