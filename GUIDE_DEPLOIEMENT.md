# 🚀 Guide de Déploiement - Ambassade du Congo

## 📋 Vue d'ensemble

Votre application est prête pour le déploiement. Voici **3 solutions recommandées** selon votre budget et vos besoins.

---

## 🥇 SOLUTION 1 : VPS Traditionnel (Recommandé pour débuter)

### ✅ Avantages
- **Contrôle total** sur le serveur
- **Coût maîtrisé** : 20-40€/mois
- **Scripts de déploiement** déjà prêts
- **Scalable** facilement

### 📦 Configuration
- **Serveur** : VPS Ubuntu 20.04+ (4GB RAM minimum)
- **Stack** : Nginx + Gunicorn + PostgreSQL
- **SSL** : Let's Encrypt (gratuit)
- **CDN** : Cloudflare (gratuit)

### 💰 Coût mensuel
```
VPS 4GB          : 25€/mois (DigitalOcean/Hetzner)
Domaine          : 2€/mois
Email (SendGrid) : 0€ (plan gratuit)
─────────────────────────────
TOTAL            : 27€/mois
```

### 🚀 Déploiement

**Étape 1 : Choisir un hébergeur**
- **DigitalOcean** : https://www.digitalocean.com (40$/mois pour 4GB)
- **Hetzner** : https://www.hetzner.com (20€/mois pour 4GB) ⭐ **MEILLEUR RAPPORT QUALITÉ/PRIX**
- **OVH** : https://www.ovh.com (20-40€/mois)
- **Scaleway** : https://www.scaleway.com (20€/mois)

**Étape 2 : Déployer**
```bash
# Sur votre serveur Ubuntu
git clone <votre-repo>
cd CONGOAMBASSADE
chmod +x deployment/scripts/setup.sh
sudo ./deployment/scripts/setup.sh
```

**Étape 3 : Configurer**
1. Modifier `/home/webapp/embassy/backend/.env`
2. Configurer le domaine dans Nginx
3. Obtenir le certificat SSL avec Certbot

### 📝 Scripts disponibles
- `deployment/scripts/setup.sh` - Installation complète
- `deployment/scripts/deploy.sh` - Déploiement des mises à jour
- `deployment/scripts/backup.sh` - Sauvegarde automatique

---

## 🥈 SOLUTION 2 : Platform as a Service (PaaS) - Plus simple

### ✅ Avantages
- **Déploiement en 1 clic**
- **Gestion automatique** (scaling, backups, SSL)
- **Moins de maintenance**
- **Support inclus**

### 📦 Options recommandées

#### A. **Render.com** ⭐ **RECOMMANDÉ**
- **Backend Django** : Gratuit (limité) ou 7$/mois
- **Frontend** : Gratuit (statique)
- **PostgreSQL** : 7$/mois
- **Total** : 14$/mois (~13€)

**Avantages** :
- ✅ SSL automatique
- ✅ Déploiement depuis GitHub
- ✅ Scaling automatique
- ✅ Backups inclus

**Déploiement** :
1. Connecter votre repo GitHub
2. Créer un service "Web Service" pour Django
3. Créer un service "Static Site" pour React
4. Créer une base PostgreSQL
5. Configurer les variables d'environnement

#### B. **Railway.app**
- **Backend + Frontend** : Pay-as-you-go (~20$/mois)
- **PostgreSQL** : Inclus
- **Total** : ~20$/mois (~18€)

**Avantages** :
- ✅ Très simple à utiliser
- ✅ Déploiement automatique
- ✅ Base de données incluse

#### C. **Fly.io**
- **Backend** : Gratuit (limité) ou payant
- **Frontend** : Gratuit
- **PostgreSQL** : 3$/mois
- **Total** : ~3-10$/mois

**Avantages** :
- ✅ Global edge network
- ✅ Très performant
- ✅ Bon pour la latence

#### D. **Heroku** (Alternative)
- **Backend** : 7$/mois (Hobby)
- **PostgreSQL** : 5$/mois (Mini)
- **Total** : 12$/mois (~11€)

**Note** : Heroku a supprimé son plan gratuit, mais reste une option solide.

---

## 🥉 SOLUTION 3 : Cloud Provider (AWS, Azure, GCP)

### ✅ Avantages
- **Scalabilité maximale**
- **Services managés** (RDS, S3, etc.)
- **Haute disponibilité**
- **Enterprise-grade**

### 📦 Configuration recommandée

#### A. **AWS (Amazon Web Services)**
```
EC2 t3.small (2GB)     : 15$/mois
RDS PostgreSQL        : 15$/mois
S3 Storage            : 1$/mois
Route 53 (DNS)        : 0.50$/mois
─────────────────────────────
TOTAL                 : ~32$/mois (~30€)
```

**Services AWS à utiliser** :
- **EC2** : Serveur pour Django
- **RDS** : Base de données PostgreSQL managée
- **S3** : Stockage de fichiers
- **CloudFront** : CDN
- **Route 53** : DNS
- **ACM** : Certificat SSL gratuit

#### B. **Google Cloud Platform (GCP)**
```
Compute Engine         : 15$/mois
Cloud SQL PostgreSQL  : 15$/mois
Cloud Storage          : 1$/mois
─────────────────────────────
TOTAL                 : ~31$/mois (~29€)
```

**Avantage GCP** : Crédits gratuits de 300$ pour nouveaux comptes

#### C. **Microsoft Azure**
```
App Service            : 13$/mois
Azure Database         : 15$/mois
Storage                : 1$/mois
─────────────────────────────
TOTAL                 : ~29$/mois (~27€)
```

---

## 🎯 Comparaison des solutions

| Critère | VPS | PaaS (Render) | Cloud (AWS) |
|---------|-----|---------------|-------------|
| **Coût/mois** | 27€ | 13€ | 30€ |
| **Complexité** | Moyenne | Faible | Élevée |
| **Contrôle** | Total | Limité | Total |
| **Scalabilité** | Manuelle | Automatique | Automatique |
| **Maintenance** | Vous | Minimale | Minimale |
| **Temps setup** | 2-3h | 30min | 4-6h |
| **Recommandé pour** | Début | MVP | Production |

---

## 🏆 MA RECOMMANDATION

### Pour démarrer (MVP) : **Render.com** ou **Railway.app**
- ✅ Le plus simple
- ✅ Déploiement en 30 minutes
- ✅ Coût raisonnable (13-20€/mois)
- ✅ SSL automatique
- ✅ Backups inclus

### Pour la production : **VPS Hetzner + Cloudflare**
- ✅ Meilleur rapport qualité/prix
- ✅ Contrôle total
- ✅ Scripts de déploiement prêts
- ✅ Scalable facilement
- ✅ Coût : 27€/mois

### Pour l'entreprise : **AWS ou GCP**
- ✅ Services managés
- ✅ Haute disponibilité
- ✅ Support professionnel
- ✅ Conformité et sécurité

---

## 📋 Checklist de déploiement

### Avant le déploiement
- [ ] Acheter un nom de domaine
- [ ] Choisir un hébergeur
- [ ] Créer les comptes services externes :
  - [ ] SendGrid (email)
  - [ ] Stripe (paiement)
  - [ ] Firebase (push notifications - optionnel)
  - [ ] Cloudflare (CDN - gratuit)

### Configuration backend
- [ ] Créer fichier `.env` avec :
  - `SECRET_KEY` (générer une clé forte)
  - `DEBUG=False`
  - `ALLOWED_HOSTS=votre-domaine.com`
  - `DB_NAME`, `DB_USER`, `DB_PASSWORD`
  - `STRIPE_SECRET_KEY`
  - `EMAIL_HOST_PASSWORD` (SendGrid)

### Configuration frontend
- [ ] Créer fichier `.env.production` :
  - `VITE_API_URL=https://votre-domaine.com/api`

### Post-déploiement
- [ ] Tester toutes les fonctionnalités
- [ ] Configurer les backups automatiques
- [ ] Configurer le monitoring (UptimeRobot - gratuit)
- [ ] Tester les emails
- [ ] Tester les paiements (mode test Stripe)
- [ ] Configurer Cloudflare (CDN + protection DDoS)

---

## 🔧 Configuration spécifique par solution

### Render.com

**1. Créer un service Web pour Django** :
```yaml
Build Command: cd backend && pip install -r requirements.txt
Start Command: cd backend && gunicorn embassy_backend.wsgi:application
Environment Variables:
  - SECRET_KEY
  - DEBUG=False
  - ALLOWED_HOSTS=votre-domaine.onrender.com
  - DATABASE_URL (fourni par Render)
```

**2. Créer un service Static Site pour React** :
```yaml
Build Command: cd frontend && npm install && npm run build
Publish Directory: frontend/dist
Environment Variables:
  - VITE_API_URL=https://votre-backend.onrender.com/api
```

### Railway.app

**1. Créer un projet**
- Connecter GitHub
- Ajouter PostgreSQL (plugin)
- Ajouter service Django
- Ajouter service React (statique)

**2. Variables d'environnement** :
- Configurer dans le dashboard Railway

### VPS (Hetzner/DigitalOcean)

**1. Utiliser les scripts fournis** :
```bash
# Installation complète
sudo ./deployment/scripts/setup.sh

# Déploiement des mises à jour
./deployment/scripts/deploy.sh

# Backups
./deployment/scripts/backup.sh
```

**2. Configuration Nginx** :
- Fichier déjà prêt : `deployment/nginx/embassy.conf`
- À adapter avec votre domaine

**3. SSL avec Let's Encrypt** :
```bash
sudo certbot --nginx -d votre-domaine.com
```

---

## 💡 Conseils supplémentaires

### Performance
1. **Activer Cloudflare** (gratuit) :
   - CDN global
   - Protection DDoS
   - Cache automatique
   - SSL automatique

2. **Optimiser les images** :
   - Utiliser WebP
   - Compression automatique

3. **Cache** :
   - Nginx cache déjà configuré
   - Service Worker pour PWA

### Sécurité
1. **Firewall** :
   ```bash
   sudo ufw allow 'Nginx Full'
   sudo ufw enable
   ```

2. **Mises à jour** :
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

3. **Backups** :
   - Automatiques avec le script fourni
   - Stocker hors site (S3, Backblaze)

### Monitoring
1. **UptimeRobot** (gratuit) :
   - Surveille la disponibilité
   - Alertes par email

2. **Sentry** (gratuit jusqu'à 5k events/mois) :
   - Tracking des erreurs
   - Déjà configuré dans le code

---

## 📞 Support

Si vous avez besoin d'aide pour le déploiement :
1. Consultez les scripts dans `deployment/scripts/`
2. Vérifiez la configuration Nginx dans `deployment/nginx/`
3. Consultez la documentation dans `docs/`

---

## 🎯 Résumé

**Pour commencer rapidement** : Render.com (13€/mois)  
**Pour le meilleur rapport qualité/prix** : VPS Hetzner (27€/mois)  
**Pour l'entreprise** : AWS/GCP (30€+/mois)

**Tous les scripts et configurations sont déjà prêts !** 🚀

