// src/types/index.ts
export type FormationType = {
  id: number;
  nom: string;
  description: string;
  duree_estimee: number;
  nombre_sessions?: number;
  supports?: SupportFormation[];
};

export type SupportFormation = {
  id: number;
  formation_type: number;
  formation_type_nom: string;
  titre: string;
  description?: string;
  fichier: string; // URL
  type_support: string;
  extension_fichier: string;
  taille_fichier: string;
  date_ajout: string;
};

export type FormationSession = {
  id: number;
  formation_type: FormationType;
  formation_type_id?: number;
  date_debut: string;
  date_fin: string;
  formateur?: string | null;
  formateur_id?: number | null;
  statut: 'PLAN' | 'ENCOURS' | 'TERMINEE' | 'ANNULEE';
  duree_calculee?: string;
  est_passee?: boolean;
  est_en_cours?: boolean;
  est_a_venir?: boolean;
  supports_formation?: SupportFormation[];
};