import os
import sys
# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory
from flask_cors import CORS
from src.models.user import db
from src.models.case import Case
from src.config.database import get_database_uri, get_sqlalchemy_engine_options
from src.routes.user import user_bp
from src.routes.case import case_bp
from src.routes.attorney import attorney_bp
from src.routes.contact import contact_bp
from src.routes.blog import blog_bp
from src.routes.sitemap import sitemap_bp
from src.routes.blog_admin import blog_admin_bp
from src.routes.admin_panel import admin_panel_bp
from src.routes.auth import auth_bp
from src.routes.blog_approval import blog_approval_bp
from src.routes.groups import groups_bp
from src.routes.admin_queue import admin_queue_bp

app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))
app.config['SECRET_KEY'] = 'asdf#FGSgvasgf$5$WGT'

# Enable CORS for all routes
CORS(app, origins=['*'])

app.register_blueprint(user_bp, url_prefix='/api')
app.register_blueprint(case_bp, url_prefix='/api')
app.register_blueprint(attorney_bp)
app.register_blueprint(contact_bp)
app.register_blueprint(blog_bp)
app.register_blueprint(sitemap_bp)
app.register_blueprint(blog_admin_bp)
app.register_blueprint(admin_panel_bp)
app.register_blueprint(auth_bp)
app.register_blueprint(blog_approval_bp)
app.register_blueprint(groups_bp)
app.register_blueprint(admin_queue_bp, url_prefix='/api')

# Database configuration - now supports both SQLite and PostgreSQL
app.config['SQLALCHEMY_DATABASE_URI'] = get_database_uri()
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = get_sqlalchemy_engine_options()
db.init_app(app)
with app.app_context():
    try:
        db.create_all()
    except Exception as e:
        # If DB is not reachable during import (e.g., missing certs or remote DB),
        # log and continue so the app can still start for local development.
        print(f"[DB_INIT] Skipping create_all due to error: {e}")

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    # Don't serve static files for API routes - let blueprints handle them
    # But allow /auth/callback and /blog for SPA handling
    if path == 'auth/callback' or path == 'blog' or path.startswith('blog/'):
        # This is a frontend route - serve index.html for SPA routing
        pass
    elif path.startswith('api/') or path.startswith('auth/'):
        # Return 404 to let Flask continue to blueprint routes
        from flask import abort
        abort(404)
    
    static_folder_path = app.static_folder
    if static_folder_path is None:
            return "Static folder not configured", 404

    if path != "" and os.path.exists(os.path.join(static_folder_path, path)):
        return send_from_directory(static_folder_path, path)
    else:
        index_path = os.path.join(static_folder_path, 'index.html')
        if os.path.exists(index_path):
            return send_from_directory(static_folder_path, 'index.html')
        else:
            return "index.html not found", 404


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
