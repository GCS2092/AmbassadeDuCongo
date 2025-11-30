# 🐳 Déploiement avec Docker

## Avantages de Docker

- ✅ **Isolation** : Chaque service dans son conteneur
- ✅ **Reproductibilité** : Fonctionne partout de la même manière
- ✅ **Facilité** : Un seul commande pour tout démarrer
- ✅ **Scalabilité** : Facile d'ajouter des instances
- ✅ **Maintenance** : Mises à jour simplifiées

## 🚀 Déploiement rapide

### 1. Prérequis
- Docker installé
- Docker Compose installé

### 2. Configuration

**Créer le fichier `.env` dans `backend/`** :
```env
SECRET_KEY=votre-clé-secrète-très-longue
DEBUG=False
ALLOWED_HOSTS=localhost,127.0.0.1,votre-domaine.com
DB_NAME=embassy_db
DB_USER=embassy_user
DB_PASSWORD=change_this_password
DB_HOST=db
DB_PORT=5432
USE_SQLITE=False
CORS_ALLOW_ALL_ORIGINS=False
CORS_ALLOWED_ORIGINS=http://localhost:3000,https://votre-domaine.com
```

### 3. Démarrer les services

```bash
# Construire et démarrer tous les services
docker-compose up -d

# Voir les logs
docker-compose logs -f

# Arrêter
docker-compose down

# Reconstruire après modifications
docker-compose up -d --build
```

### 4. Initialiser la base de données

```bash
# Créer les migrations
docker-compose exec backend python manage.py migrate

# Créer un superutilisateur
docker-compose exec backend python manage.py createsuperuser

# Collecter les fichiers statiques
docker-compose exec backend python manage.py collectstatic --no-input
```

## 🌐 Accès

- **Frontend** : http://localhost
- **Backend API** : http://localhost:8000
- **Admin Django** : http://localhost:8000/admin

## 📦 Services inclus

1. **PostgreSQL** : Base de données
2. **Backend Django** : API REST
3. **Worker Django-Q** : Tâches asynchrones
4. **Frontend Nginx** : Application React

## 🔧 Commandes utiles

```bash
# Voir les conteneurs
docker-compose ps

# Logs d'un service spécifique
docker-compose logs -f backend

# Exécuter une commande dans un conteneur
docker-compose exec backend python manage.py shell

# Redémarrer un service
docker-compose restart backend

# Voir l'utilisation des ressources
docker stats
```

## 🚀 Déploiement en production

### Option 1 : Serveur avec Docker

1. Installer Docker sur votre VPS
2. Cloner le repo
3. Configurer le `.env`
4. Lancer `docker-compose up -d`

### Option 2 : Platform as a Service

**Railway.app** :
- Supporte Docker Compose nativement
- Déploiement automatique depuis GitHub

**Fly.io** :
- Supporte Docker
- Excellent pour la latence globale

**DigitalOcean App Platform** :
- Supporte Docker
- Scaling automatique

## 🔒 SSL/HTTPS avec Docker

### Option 1 : Traefik (Recommandé)

Ajouter Traefik comme reverse proxy avec SSL automatique :

```yaml
# Dans docker-compose.yml
services:
  traefik:
    image: traefik:v2.10
    command:
      - "--providers.docker=true"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      - "--certificatesresolvers.letsencrypt.acme.tlschallenge=true"
      - "--certificatesresolvers.letsencrypt.acme.email=votre-email@example.com"
      - "--certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json"
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./letsencrypt:/letsencrypt
```

### Option 2 : Nginx + Certbot

Utiliser le conteneur Nginx avec Certbot pour obtenir le certificat SSL.

## 📊 Monitoring

```bash
# Voir l'utilisation des ressources
docker stats

# Voir les logs en temps réel
docker-compose logs -f

# Vérifier la santé des services
docker-compose ps
```

## 🔄 Mises à jour

```bash
# Pull les dernières modifications
git pull

# Reconstruire et redémarrer
docker-compose up -d --build

# Appliquer les migrations
docker-compose exec backend python manage.py migrate
```

## 💾 Backups

```bash
# Backup de la base de données
docker-compose exec db pg_dump -U embassy_user embassy_db > backup.sql

# Restaurer
docker-compose exec -T db psql -U embassy_user embassy_db < backup.sql
```

## 🎯 Avantages pour votre projet

1. **Développement** : Environnement identique en local et production
2. **Déploiement** : Une seule commande pour tout démarrer
3. **Scalabilité** : Facile d'ajouter des workers ou instances
4. **Maintenance** : Mises à jour simplifiées
5. **Isolation** : Chaque service isolé, plus de sécurité

---

**Docker est une excellente option si vous voulez simplifier le déploiement !** 🐳

