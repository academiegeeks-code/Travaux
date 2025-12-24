# logs_and_analytics/views/statistics_views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Count, Q
from works_management.models import Theme, Attribution, FormationSession, Projet
from datetime import datetime


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_statistics(request):
    # 1. Thèmes
    total_themes = Theme.objects.count()
    themes_attribues = Attribution.objects.filter(theme__isnull=False).count()

    # 2. Formations terminées
    formations_terminees = FormationSession.objects.filter(
        date_fin__lt=datetime.now()
    ).count()

    # 3. Projets en cours
    projets_en_cours = Projet.objects.filter(statut='en_cours').count()

    # 4. Progression moyenne des thèmes attribués
    attributions = Attribution.objects.filter(
        theme__isnull=False,
        date_debut__isnull=False,
        date_fin__isnull=False
    )

    progressions = []
    now = datetime.now()

    for attr in attributions:
        start = attr.date_debut
        end = attr.date_fin
        if now > end or attr.theme.projet.statut == 'termine':
            progressions.append(100)
        elif now >= start:
            progress = ((now - start).total_seconds() / (end - start).total_seconds()) * 100
            progressions.append(min(progress, 100))
        else:
            progressions.append(0)

    progression_moyenne = sum(progressions) / len(progressions) if progressions else 0

    data = {
        "totalThemes": total_themes,
        "themesAttribues": themes_attribues,
        "formationsTerminees": formations_terminees,
        "projetsEnCours": projets_en_cours,
        "progressionMoyenne": round(progression_moyenne, 2),
    }

    return Response(data)