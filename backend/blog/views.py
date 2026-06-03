from rest_framework import generics, permissions, filters
from .models import Post, Category, Comment
from .serializers import PostListSerializer, PostDetailSerializer, CategorySerializer, CommentSerializer
from django.shortcuts import render, get_object_or_404
from django.contrib.admin.views.decorators import staff_member_required
from django.http import JsonResponse
from .ai_agents import BlogGeneratorWorkflow
import json

class PostListView(generics.ListAPIView):
    queryset = Post.objects.filter(status='published').order_by('-created_at')
    serializer_class = PostListSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['title', 'content', 'tags__name', 'category__name']

class PostDetailView(generics.RetrieveAPIView):
    queryset = Post.objects.filter(status='published')
    serializer_class = PostDetailSerializer
    lookup_field = 'slug'

class CategoryListView(generics.ListAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

class CommentCreateView(generics.CreateAPIView):
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        post = Post.objects.get(slug=self.kwargs['slug'])
        serializer.save(user=self.request.user, post=post)

PREDEFINED_TOPICS = [
    {
        "title": "Eviction & Unlawful Detainer",
        "description": "Legal proceedings initiated by a landlord to remove a tenant from a rental unit, including notice requirements, court filings, and tenant defenses against wrongful eviction.",
    },
    {
        "title": "Lease & Rental Agreements",
        "description": "Formation, interpretation, modification, and enforcement of lease contracts, including clauses, term lengths, renewal rights, and breach of contract claims.",
    },
    {
        "title": "Security Deposits",
        "description": "Rules governing the collection, holding, itemization, and return of security deposits, as well as legal remedies for wrongful withholding.",
    },
    {
        "title": "Rent Disputes & Rent Control",
        "description": "Nonpayment of rent, rent increases, rent control and stabilization ordinances, and legal options available to both parties in rent-related conflicts.",
    },
    {
        "title": "Habitability & Repair Obligations",
        "description": "The implied warranty of habitability, landlord duties to maintain safe and livable conditions, tenant remedies such as rent withholding or repair-and-deduct, and code enforcement.",
    },
    {
        "title": "Housing Discrimination & Fair Housing",
        "description": "Violations of the Fair Housing Act and state equivalents, covering discrimination based on race, sex, disability, familial status, national origin, religion, and other protected classes.",
    },
    {
        "title": "Tenant Privacy & Landlord Right of Entry",
        "description": "Landlord obligations to provide advance notice before entering a rental unit, tenant rights to quiet enjoyment, and legal claims arising from unlawful entry or harassment.",
    },
    {
        "title": "Retaliation & Tenant Protections",
        "description": "Legal prohibitions against landlord retaliation for tenant complaints, union organizing, or exercising legal rights, including retaliatory eviction and rent increases.",
    },
    {
        "title": "Environmental & Safety Hazards",
        "description": "Liability and legal remedies related to lead paint, mold, asbestos, carbon monoxide, inadequate security, and other health or safety hazards on rental property.",
    },
    {
        "title": "Lease Termination & Move-Out Disputes",
        "description": "Legal rights and obligations at the end of a tenancy, including proper notice periods, early termination penalties, abandoned property, and move-out inspection disputes.",
    },
    {
        "title": "Tenant Screening & Rental Applications",
        "description": "Legal standards governing background checks, credit inquiries, application fees, and the use of criminal or eviction history in tenant selection, including compliance with the Fair Credit Reporting Act (FCRA) and state-specific screening laws.",
    },
    {
        "title": "Subleasing & Assignment of Leases",
        "description": "Rights and restrictions on a tenant's ability to sublet a unit or assign a lease to another party, landlord consent requirements, and liability of the original tenant when a subtenant defaults or causes damage.",
    },
    {
        "title": "Holdover Tenancy",
        "description": "Legal status and consequences when a tenant remains in possession after a lease expires without a new agreement, including landlord options to treat the holdover as a month-to-month tenancy or pursue eviction proceedings.",
    },
    {
        "title": "Landlord Harassment & Constructive Eviction",
        "description": "Legal claims arising from a landlord's deliberate interference with a tenant's quiet enjoyment — such as shutting off utilities, removing doors, or repeated unlawful entry — that effectively forces a tenant to vacate without a formal eviction.",
    },
    {
        "title": "Property Damage & Tenant Liability",
        "description": "Disputes over damage to rental units beyond normal wear and tear, including landlord claims for repair costs, tenant defenses, and the use of security deposits or civil litigation to recover losses.",
    },
    {
        "title": "Utilities, Services & Essential Amenities",
        "description": "Legal obligations surrounding the provision of heat, water, electricity, and other essential services; tenant remedies when services are interrupted; and disputes over who bears responsibility for utility costs under the lease.",
    },
    {
        "title": "Commercial Landlord-Tenant Disputes",
        "description": "Legal issues unique to commercial leases, including build-out obligations, percentage rent clauses, use restrictions, co-tenancy provisions, and remedies for breach in retail, office, and industrial settings.",
    },
    {
        "title": "Foreclosure & Its Impact on Tenants",
        "description": "Tenant rights when a landlord's property enters foreclosure, including protections under the federal Protecting Tenants at Foreclosure Act (PTFA), notice requirements, and options for lease continuation or early termination.",
    },
    {
        "title": "Short-Term Rentals & Vacation Rental Regulations",
        "description": "Legal issues arising from platforms such as Airbnb and VRBO, including municipal zoning restrictions, HOA prohibitions, host liability for guest injuries, and conflicts between short-term rental activity and standard lease terms.",
    },
    {
        "title": "Domestic Violence & Special Lease Termination Protections",
        "description": "State and local laws permitting victims of domestic violence, sexual assault, or stalking to terminate a lease early without penalty, including required documentation, notice periods, and landlord obligations to change locks or re-key units.",
    },
    {
        "title": "Pet Policies, Pet Deposits & Service Animals",
        "description": "Legal disputes over no-pet clauses, pet deposits versus pet fees, and the critical distinction between pets and federally protected service animals or emotional support animals — which landlords cannot lawfully refuse under the Fair Housing Act.",
    },
    {
        "title": "Premises Liability & Tenant Injury Claims",
        "description": "Negligence and personal injury claims brought by tenants or guests injured on rental property due to a landlord's failure to maintain safe conditions, including slip-and-fall incidents, structural defects, and inadequate lighting in common areas.",
    },
    {
        "title": "Lease Alterations, Improvements & Fixtures",
        "description": "Legal rights and obligations when tenants make modifications to a rental unit, including who owns installed fixtures at lease end, the requirement for landlord written consent, and liability for unauthorized alterations or failure to restore the property.",
    },
    {
        "title": "Disability Accommodations & Reasonable Modifications",
        "description": "Tenant rights under the Fair Housing Act and the Americans with Disabilities Act to request reasonable accommodations in rules or policies, and reasonable physical modifications to a unit, with disputes arising over what constitutes 'reasonable' and who bears the cost.",
    },
    {
        "title": "Co-Signers, Guarantors & Third-Party Lease Liability",
        "description": "Legal obligations of co-signers and guarantors who back a tenant's lease, including the scope of their liability for unpaid rent or damages, enforcement actions by landlords, and the distinction between a co-signer and a guarantor.",
    },
    {
        "title": "Noise, Nuisance & Neighbor Disputes",
        "description": "Tenant complaints and landlord obligations regarding excessive noise, disruptive behavior by neighboring tenants, and nuisance claims — including a landlord's potential liability for failing to address ongoing nuisance conditions in a multi-unit property.",
    },
    {
        "title": "Mediation & Alternative Dispute Resolution (ADR)",
        "description": "The use of mediation, arbitration, and other non-litigation methods to resolve landlord-tenant conflicts, including court-annexed mediation programs, enforceability of mediated agreements, and the strategic advantages of ADR over formal litigation.",
    },
    {
        "title": "Rental Fraud & Scams",
        "description": "Legal remedies available to tenants who fall victim to fraudulent rental listings, phantom landlords, unauthorized subletting schemes, or deceptive lease terms — including civil claims for fraud, consumer protection violations, and recovery of funds.",
    },
    {
        "title": "Rent-to-Own & Lease-Option Agreements",
        "description": "Legal issues arising from lease-option and lease-purchase contracts, including the tenant's right to exercise a purchase option, disputes over option fees and rent credits, and landlord attempts to terminate the agreement before the option is exercised.",
    },
    {
        "title": "Late Fees, Fines & Lease Penalty Clauses",
        "description": "Enforceability of late payment fees, returned check charges, and other monetary penalty provisions in lease agreements, including state-imposed caps on late fees, grace period requirements, and tenant challenges to excessive or punitive charges.",
    },
]


@staff_member_required
def ai_generator_view(request):
    import json as _json
    return render(request, 'admin/blog/ai_generator.html', {
        'predefined_topics_json': _json.dumps(PREDEFINED_TOPICS),
    })

def ai_generate_api(request):
    import traceback as _tb
    if not (request.user.is_authenticated and request.user.is_staff):
        return JsonResponse({'status': 'error', 'message': 'Authentication required. Please log in to Django admin.'}, status=403)
    if request.method != 'POST':
        return JsonResponse({'status': 'error', 'message': 'Only POST allowed'}, status=405)

    try:
        data = json.loads(request.body)
    except json.JSONDecodeError as e:
        return JsonResponse({'status': 'error', 'message': f'Invalid JSON in request body: {e}'}, status=400)

    step = data.get('step')
    if not step:
        return JsonResponse({'status': 'error', 'message': 'Missing required field: step'}, status=400)

    workflow = BlogGeneratorWorkflow()

    try:
        if step == 'get_topics':
            theme = data.get('theme', 'Tenant Rights')
            result = workflow.run_step_1(theme)
            return JsonResponse({'status': 'success', 'result': result})

        elif step == 'generate_content':
            topic = data.get('topic')
            if not topic:
                return JsonResponse({'status': 'error', 'message': 'Missing required field: topic'}, status=400)
            context_urls = [u for u in data.get('context_urls', []) if u and u.strip()]
            result = workflow.run_step_2(topic, context_urls)
            return JsonResponse({'status': 'success', 'result': result})

        elif step == 'revise_content':
            topic = data.get('topic')
            previous_content = data.get('previous_content', '')
            feedback = data.get('feedback', '').strip()
            research_brief = data.get('research_brief', '')
            if not topic or not previous_content or not feedback:
                return JsonResponse({'status': 'error', 'message': 'Missing required fields: topic, previous_content, feedback'}, status=400)
            context_urls = [u for u in data.get('context_urls', []) if u and u.strip()]
            result = workflow.run_step_2_revision(topic, previous_content, feedback, research_brief, context_urls)
            return JsonResponse({'status': 'success', 'result': result})

        elif step == 'revise_image':
            title = data.get('title')
            content = data.get('content')
            previous_image_prompt = data.get('previous_image_prompt', '')
            feedback = data.get('feedback', '').strip()
            if not title or not content or not feedback:
                return JsonResponse({'status': 'error', 'message': 'Missing required fields: title, content, feedback'}, status=400)
            result = workflow.run_step_3_revision(title, content, previous_image_prompt, feedback)
            return JsonResponse({'status': 'success', 'result': result})

        elif step == 'generate_image':
            title = data.get('title')
            content = data.get('content')
            if not title or not content:
                return JsonResponse({'status': 'error', 'message': 'Missing required fields: title and content'}, status=400)
            result = workflow.run_step_3(title, content)
            return JsonResponse({'status': 'success', 'result': result})

        elif step == 'save_post':
            title = data.get('title')
            content = data.get('content')
            if not title or not content:
                return JsonResponse({'status': 'error', 'message': 'Missing required fields: title and content'}, status=400)
            post = workflow.save_post(
                title=title,
                content=content,
                meta_title=data.get('meta_title') or title,
                meta_description=data.get('meta_description') or '',
                tags=data.get('tags') or '',
                author_id=request.user.id,
                image_url=data.get('image_url'),
            )
            return JsonResponse({'status': 'success', 'post_id': post.id})

        elif step == 'update_post':
            post_id = data.get('post_id')
            title = data.get('title')
            content = data.get('content')
            if not post_id or not title or not content:
                return JsonResponse({'status': 'error', 'message': 'Missing required fields: post_id, title, content'}, status=400)
            post = workflow.update_post(
                post_id=post_id,
                title=title,
                content=content,
                meta_title=data.get('meta_title') or title,
                meta_description=data.get('meta_description') or '',
                tags=data.get('tags') or '',
                image_url=data.get('image_url'),
            )
            return JsonResponse({'status': 'success', 'post_id': post.id})

        return JsonResponse({'status': 'error', 'message': f'Unknown step: "{step}"'}, status=400)

    except Exception as e:
        _tb.print_exc()  # full traceback in Django server console
        return JsonResponse({
            'status': 'error',
            'message': str(e),
            'error_type': type(e).__name__,
            'step': step,
        }, status=500)


def _staff_check(request):
    return request.user.is_authenticated and request.user.is_staff


def ai_posts_list_api(request):
    if not _staff_check(request):
        return JsonResponse({'status': 'error', 'message': 'Authentication required'}, status=403)
    posts = list(
        Post.objects
        .order_by('-updated_at')
        .values('id', 'title', 'status', 'created_at', 'updated_at', 'slug')[:150]
    )
    return JsonResponse({'status': 'success', 'posts': posts})


def ai_post_load_api(request, post_id):
    if not _staff_check(request):
        return JsonResponse({'status': 'error', 'message': 'Authentication required'}, status=403)
    post = get_object_or_404(Post, pk=post_id)
    image_url = request.build_absolute_uri(post.featured_image.url) if post.featured_image else ''
    return JsonResponse({'status': 'success', 'post': {
        'id': post.id,
        'title': post.title,
        'content': post.content,  # stored HTML
        'meta_title': post.meta_title,
        'meta_description': post.meta_description,
        'tags': ', '.join(t.name for t in post.tags.all()),
        'status': post.status,
        'image_url': image_url,
    }})
