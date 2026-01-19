import os
from flask import Blueprint, jsonify, request

try:
    import stripe
except Exception:
    stripe = None

payments_bp = Blueprint('payments', __name__)


def _get_frontend_url(default_path: str) -> str:
    base = os.environ.get('FRONTEND_BASE_URL', '').rstrip('/')
    if base:
        return f"{base}{default_path}"
    return default_path


@payments_bp.route('/api/payments/checkout-session', methods=['POST'])
def create_checkout_session():
    """Create a Stripe Checkout session for intake payments."""
    if stripe is None:
        return jsonify({'error': 'Stripe SDK not installed'}), 500

    stripe_secret = os.environ.get('STRIPE_SECRET_KEY')
    if not stripe_secret:
        return jsonify({'error': 'Stripe secret key not configured'}), 500

    data = request.get_json() or {}
    intake_type = data.get('intake_type')
    if intake_type not in ('tenant', 'attorney'):
        return jsonify({'error': 'Invalid intake type'}), 400

    price_id = os.environ.get('STRIPE_TENANT_PRICE_ID') if intake_type == 'tenant' else os.environ.get('STRIPE_ATTORNEY_PRICE_ID')
    if not price_id:
        return jsonify({'error': 'Stripe price ID not configured'}), 500

    stripe.api_key = stripe_secret

    case_number = data.get('case_number')
    application_id = data.get('application_id')
    success_url = data.get('success_url') or os.environ.get('STRIPE_SUCCESS_URL') or _get_frontend_url('/payment?status=success')
    cancel_url = data.get('cancel_url') or os.environ.get('STRIPE_CANCEL_URL') or _get_frontend_url('/payment?status=cancel')

    try:
        session = stripe.checkout.Session.create(
            mode='payment',
            line_items=[{'price': price_id, 'quantity': 1}],
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                'intake_type': intake_type,
                'case_number': case_number or '',
                'application_id': application_id or ''
            }
        )
        return jsonify({'id': session.id, 'url': session.url}), 200
    except Exception as e:
        return jsonify({'error': 'Failed to create checkout session', 'details': str(e)}), 500
