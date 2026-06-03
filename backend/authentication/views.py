import os
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.github.views import GitHubOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from dj_rest_auth.registration.views import SocialLoginView

_FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:3000")


class GoogleLogin(SocialLoginView):
    adapter_class = GoogleOAuth2Adapter
    callback_url = _FRONTEND_URL + "/api/auth/callback/google"
    client_class = OAuth2Client

class GitHubLogin(SocialLoginView):
    adapter_class = GitHubOAuth2Adapter
    callback_url = _FRONTEND_URL + "/api/auth/callback/github"
    client_class = OAuth2Client
