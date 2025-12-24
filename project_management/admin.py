# projects/admin.py
from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.http import urlencode
from .models import Projet


@admin.register(Projet)
class ProjetAdmin(admin.ModelAdmin):
    list_display = [
        'titre',
        'formation_link',
        'statut_colored',
        'date_debut',
        'date_fin',
        'fichier_link',
        'date_creation',
    ]
    list_filter = [
        'statut',
        'formation',
        'date_creation',
        'date_debut',
        'date_fin',
    ]
    search_fields = ['titre', 'description', 'objectifs', 'formation__nom']
    readonly_fields = ['date_creation']
    autocomplete_fields = ['formation']
    date_hierarchy = 'date_creation'
    ordering = ['-date_creation']
    list_per_page = 25

    fieldsets = (
        ("Informations générales", {
            'fields': ('titre', 'formation', 'statut', 'description', 'objectifs')
        }),
        ("Dates", {
            'fields': ('date_debut', 'date_fin', 'date_creation'),
            'classes': ('collapse',)
        }),
        ("Fichier joint", {
            'fields': ('fichier', 'fichier_preview'),
            'description': "Joindre un rapport, une présentation, etc."
        }),
    )

    # ──────────────────────────────────────────────────────────────
    # Affichage du lien vers la formation
    # ──────────────────────────────────────────────────────────────
    def formation_link(self, obj):
        if not obj.formation:
            return "—"
        url = reverse("admin:training_management_formationtype_change", args=[obj.formation.id])
        return format_html('<a href="{}">{}</a>', url, obj.formation.nom)
    formation_link.short_description = "Formation"
    formation_link.admin_order_field = 'formation__nom'

    # ──────────────────────────────────────────────────────────────
    # Statut en couleur (comme dans tes templates)
    # ──────────────────────────────────────────────────────────────
    def statut_colored(self, obj):
        colors = {
            'en_attente': 'secondary',
            'en_cours': 'warning',
            'termine': 'success',
        }
        color = colors.get(obj.statut, 'secondary')
        return format_html(
            '<span class="badge" style="background-color: {};">{}</span>',
            '#6c757d' if color == 'secondary' else
            '#ffc107' if color == 'warning' else
            '#28a745',
            obj.get_statut_display()
        )
    statut_colored.short_description = "Statut"

    # ──────────────────────────────────────────────────────────────
    # Aperçu + lien de téléchargement du fichier
    # ──────────────────────────────────────────────────────────────
    def fichier_link(self, obj):
        if not obj.fichier:
            return "Aucun fichier"
        url = obj.fichier.url
        return format_html(
            '<a href="{}" target="_blank">Télécharger</a> <small>({})</small>',
            url,
            obj.fichier.name.split('/')[-1]
        )
    fichier_link.short_description = "Fichier joint"

    def fichier_preview(self, obj):
        if not obj.fichier:
            return "Aucun fichier"
        if obj.fichier.name.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.pdf')):
            return format_html('<a href="{}" target="_blank">Aperçu / Télécharger</a>', obj.fichier.url)
        return format_html('<a href="{}" target="_blank">Télécharger {}</a>', obj.fichier.url, obj.fichier.name.split('/')[-1])
    fichier_preview.short_description = "Fichier"

    # ──────────────────────────────────────────────────────────────
    # Action en masse : passer plusieurs projets en "terminé"
    # ──────────────────────────────────────────────────────────────
    actions = ['mark_as_termine']

    def mark_as_termine(self, request, queryset):
        updated = queryset.update(statut='termine')
        self.message_user(request, f"{updated} projet(s) marqué(s) comme terminé(s).")
    mark_as_termine.short_description = "Marquer les projets sélectionnés comme « Terminé »"


# Optionnel : si tu veux cacher certains projets aux non-superusers
# (mais comme tu as dit que seul admin gère → pas nécessaire)
# class ProjetAdmin(admin.ModelAdmin):
#     def has_view_permission(self, request, obj=None):
#         return request.user.is_superuser or request.user.role == 'admin'