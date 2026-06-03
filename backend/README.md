# TenantGuard Backend

A Django-based backend for the TenantGuard platform, providing API services and administrative tools.

## 🚀 Key Features

### 🤖 AI Blog Writing System
The backend includes a sophisticated, multi-agent AI system for blog content generation.
- **Workflow**: Automated research, writing, SEO optimization, and image generation.
- **Contextual Awareness**: The system reads project documentation (`docs/`, `knowledge-repo/`) to ensure brand and mission alignment.
- **Admin Interface**: Accessible via the Django Admin at `/admin/ai-generator/`.

### 📱 Applications
- **`authentication`**: Custom user management and JWT-based auth.
- **`blog`**: A full-featured blog with categories, tags, and AI automation.
- **`chat`**: Real-time or simulated legal assistant chat.

## 🛠 Setup & Installation

1.  **Environment**: Create a virtual environment and install dependencies.
    ```bash
    python -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    ```

2.  **Configuration**: Create a `.env` file in the `backend/` root:
    ```bash
    SECRET_KEY=your_secret_key
    OPENAI_API_KEY=your_openai_api_key
    ```

3.  **Database**: Run migrations.
    ```bash
    python manage.py migrate
    ```

4.  **Admin**: Create a superuser to access the AI tools.
    ```bash
    python manage.py createsuperuser
    ```

5.  **Run**: Start the development server.
    ```bash
    python manage.py runserver
    ```

## 📖 Technical Documentation
- [AI Blog System Details](../docs/AI_BLOG_SYSTEM.md)
- [Project Vision](../docs/control-plane/01_PROJECT_CONTEXT/PRODUCT_VISION.md)
