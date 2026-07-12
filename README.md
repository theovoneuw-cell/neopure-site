# Neopure — Agence de communication & événementiel

Site vitrine de l'agence Neopure (Montpellier).
Une **expérience défilement horizontal en coverflow 3D** sur desktop, classique sur mobile.

## Aperçu

- Hero éditorial avec marqueur typographique `Communication × Événementiel`
- Section **« Nos clients »** : stats animées + grille de logos clients (placeholders, à remplacer dans `assets/clients/`)
- Section **« Réalisations »** : galerie photo/vidéo
- Section **« Services »** : deux secteurs distincts mais réunis — **La Com'** et **L'Event**
- Section **« Équipe »** : présentation de Charlène & Axel
- Section **« Contact »** : formulaire avec sélecteur de nature de message (chips)
- Section **« Localisation »** : carte Leaflet stylisée violet avec pin signature

## Stack

100 % statique, **zéro dépendance backend** :

- HTML / CSS / JavaScript vanilla
- [Leaflet](https://leafletjs.com/) (CDN) pour la carte
- Gotham auto-hébergée (`assets/brand/Gotham/`) — aucune dépendance Google Fonts

## Lancer le site en local

C'est un site statique, il suffit d'ouvrir `index.html` dans un navigateur.

Pour bénéficier d'un vrai serveur local (recommandé pour la carte Leaflet) :

```bash
# avec Python (préinstallé sur Mac / Linux)
python -m http.server 8000

# avec Node
npx serve .

# avec VS Code : extension « Live Server »
```

Puis : <http://localhost:8000>

## Structure

```
.
├── index.html        # Page unique
├── css/
│   └── style.css     # Tous les styles (design system, animations, responsive)
├── js/
│   ├── main.js       # Menu, reveal, scroll-spy, formulaire
│   ├── horizontal.js # Mode coverflow desktop ≥ 1025px
│   └── experience.js # Preloader, curseur, hover effects, carte Leaflet
└── assets/
    └── clients/      # Logos clients (à compléter — PNG/SVG transparent)
```

## Personnalisation

### Remplacer les logos clients

Pose un PNG ou SVG transparent dans `assets/clients/` (ex. `glow-up.svg`), puis dans `index.html` remplace :

```html
<li class="collab-card">
  <span class="collab-card-name">Glow Up</span>
</li>
```

par :

```html
<li class="collab-card">
  <img class="collab-card-logo" src="assets/clients/glow-up.svg" alt="Glow Up">
</li>
```

Astuce : pour forcer tous les logos en blanc (look monochrome premium), ajoute `class="collab-list collab-list--mono"` sur le `<ul>`.

### Brancher le formulaire à un back-end

Le formulaire affiche un message de confirmation en JS quand on l'envoie (pas de back-end pour l'instant). Pour le brancher à un service d'envoi d'email (Formspree, EmailJS, etc.) :

- Mets l'URL du service dans `action="…"` du `<form class="contact-form">` (`index.html`)
- Retire ou adapte le `e.preventDefault()` dans `js/main.js` (section « Formulaire de contact »)

## Couleurs de marque

| Token | Valeur |
|---|---|
| Cyan (accent) | `#35F2F2` |
| Violet principal | `#BC6BF2` |
| Lavande | `#D694F2` |
| Rose pâle | `#F1C4F2` |
| Indigo (fond) | `#151626` |

## Compatibilité

- **Desktop ≥ 1025 px** : mode coverflow horizontal 3D
- **Tablette / mobile** : défilement vertical classique
- **Curseur signature** + animations désactivés si `prefers-reduced-motion`

## Crédits

Conçu et développé pour **Neopure** — Charlène & Axel.
Montpellier, depuis 2022.
