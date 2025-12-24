from django.contrib import admin
from django.utils import timezone
from django.utils.html import format_html
from .models import FormationType, SupportFormation, FormationSession

class SupportFormationInline(admin.StackedInline):
    model = SupportFormation
    extra = 1
    readonly_fields = ['date_ajout', 'extension_fichier', 'taille_fichier']

@admin.register(FormationType)
class FormationTypeAdmin(admin.ModelAdmin):
    list_display = ['nom', 'duree_estimee', 'nombre_supports', 'nombre_sessions']
    search_fields = ['nom', 'description']
    #readonly_fields = ['created_at', 'updated_at']
    inlines = [SupportFormationInline]
    
    def nombre_supports(self, obj):
        return obj.supports.count()
    nombre_supports.short_description = 'Supports'
    
    def nombre_sessions(self, obj):
        return obj.sessions.count()
    nombre_sessions.short_description = 'Sessions'

@admin.register(SupportFormation)
class SupportFormationAdmin(admin.ModelAdmin):
    list_display = ['titre', 'formation_type', 'type_support', 'extension_fichier', 'taille_fichier', 'date_ajout']
    list_filter = ['formation_type', 'type_support']
    search_fields = ['titre', 'description']
    readonly_fields = ['date_ajout', 'extension_fichier', 'taille_fichier']

@admin.register(FormationSession)
class FormationSessionAdmin(admin.ModelAdmin):
    list_display = [
        'formation_type', 'date_debut_format', 'date_fin_format', 
        'formateur', 'statut_colore', 'duree_reelle', 'est_en_cours'
    ]
    list_filter = ['statut', 'formation_type', 'formateur', 'date_debut']
    search_fields = ['formation_type__nom', 'formateur__first_name', 'formateur__last_name']
    date_hierarchy = 'date_debut'
    readonly_fields = [
        'statut', 'created_at', 'updated_at', 'duree_reelle_display',
        'statut_auto_calcule', 'est_passee_display', 'est_en_cours_display', 'est_a_venir_display'
    ]
    list_select_related = ['formation_type', 'formateur']
    actions = ['mettre_a_jour_statuts', 'marquer_comme_termine']
    
    fieldsets = (
        ('Informations de la session', {
            'fields': (
                'formation_type', 
                'formateur',
                ('date_debut', 'date_fin'),
            )
        }),
        ('Statut et durée', {
            'fields': (
                'statut',
                'duree_reelle_display',
                'statut_auto_calcule',
            )
        }),
        ('Indicateurs temporels', {
            'fields': (
                'est_passee_display',
                'est_en_cours_display', 
                'est_a_venir_display',
            ),
            'classes': ('collapse',)
        }),
        ('Métadonnées', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def date_debut_format(self, obj):
        """Format personnalisé pour la date de début"""
        if obj.date_debut:
            return obj.date_debut.strftime('%d/%m/%Y %H:%M')
        return "-"
    date_debut_format.short_description = 'Début'
    date_debut_format.admin_order_field = 'date_debut'

    def date_fin_format(self, obj):
        """Format personnalisé pour la date de fin"""
        if obj.date_fin:
            return obj.date_fin.strftime('%d/%m/%Y %H:%M')
        return "-"
    date_fin_format.short_description = 'Fin'
    date_fin_format.admin_order_field = 'date_fin'

    def statut_colore(self, obj):
        """Affiche le statut avec une couleur"""
        colors = {
            'PLAN': 'blue',
            'ENCOURS': 'orange',
            'TERMINEE': 'green',
        }
        color = colors.get(obj.statut, 'black')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color,
            obj.get_statut_display()
        )
    statut_colore.short_description = 'Statut'
    statut_colore.admin_order_field = 'statut'

    def duree_reelle(self, obj):
        """Affiche la durée réelle de la session"""
        duree = obj.duree_calculee
        if duree >= 1:
            return f"{duree:.1f}h"
        else:
            return f"{duree*60:.0f}min"
    duree_reelle.short_description = 'Durée'

    def est_en_cours(self, obj):
        """Indicateur visuel si la session est en cours"""
        if obj.est_en_cours:
            return format_html('✅')
        return ""
    est_en_cours.short_description = 'En cours'

    def duree_reelle_display(self, obj):
        """Version détaillée pour le détail de l'objet"""
        duree_estimee = obj.formation_type.duree_estimee
        duree_reelle = obj.duree_calculee
        
        if obj.date_fin:
            return f"{duree_reelle:.1f}h (estimée: {duree_estimee}h)"
        else:
            return f"Estimée: {duree_estimee}h"
    duree_reelle_display.short_description = "Durée réelle"

    def statut_auto_calcule(self, obj):
        """Affiche comment le statut est calculé"""
        now = timezone.now()
        if obj.date_fin and now > obj.date_fin:
            return "Terminée (dépassement date fin)"
        elif obj.date_debut and now >= obj.date_debut:
            return "En cours (début passée)"
        else:
            return "Planifiée (début future)"
    statut_auto_calcule.short_description = "Calcul du statut"

    def est_passee_display(self, obj):
        return "✅" if obj.est_passee else "❌"
    est_passee_display.short_description = "Est passée"

    def est_en_cours_display(self, obj):
        return "✅" if obj.est_en_cours else "❌"
    est_en_cours_display.short_description = "Est en cours"

    def est_a_venir_display(self, obj):
        return "✅" if obj.est_a_venir else "❌"
    est_a_venir_display.short_description = "Est à venir"

    def save_model(self, request, obj, form, change):
        """Mettre à jour le statut avant sauvegarde"""
        obj.update_statut()
        super().save_model(request, obj, form, change)

    def get_queryset(self, request):
        """Optimisation des requêtes"""
        return super().get_queryset(request).select_related('formation_type', 'formateur')

    # Actions administratives
    def mettre_a_jour_statuts(self, request, queryset):
        """Action pour mettre à jour les statuts des sessions sélectionnées"""
        updated_count = 0
        for session in queryset:
            session.update_statut()
            updated_count += 1
        
        self.message_user(
            request, 
            f"Statuts mis à jour pour {updated_count} session(s)."
        )
    mettre_a_jour_statuts.short_description = "Mettre à jour les statuts des sessions sélectionnées"

    def marquer_comme_termine(self, request, queryset):
        """Action pour marquer manuellement des sessions comme terminées"""
        now = timezone.now()
        updated_count = 0
        
        for session in queryset:
            if session.statut != 'TERMINEE':
                session.statut = 'TERMINEE'
                # Si pas de date de fin, la définir à maintenant
                if not session.date_fin:
                    session.date_fin = now
                session.save()
                updated_count += 1
        
        self.message_user(
            request,
            f"{updated_count} session(s) marquée(s) comme terminée(s)."
        )
    marquer_comme_termine.short_description = "Marquer comme terminée"