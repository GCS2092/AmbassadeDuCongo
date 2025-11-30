# 🔌 Services Externes Requis

Ce document liste tous les services externes et leurs abonnements nécessaires pour le fonctionnement complet de la PWA.

## 🔴 Services OBLIGATOIRES (MVP)

### 1. **Hébergement Serveur**
- **Service** : VPS/Serveur dédié
- **Recommandations** :
  - DigitalOcean Droplet (40$/mois pour 4GB RAM)
  - Hetzner Cloud (20€/mois)
  - OVH VPS (20-40€/mois)
- **Spécifications minimales** :
  - 4GB RAM, 2 CPU, 80GB SSD
  - Ubuntu 20.04+ ou Debian 11+
- **Coût mensuel** : 20-40€

### 2. **Nom de Domaine**
- **Service** : Registrar de domaines
- **Recommandations** : Namecheap, OVH, Gandi
- **Exemple** : `ambassade-congo.sn`
- **Coût annuel** : 10-30€/an

### 3. **SSL/HTTPS**
- **Service** : Let's Encrypt (GRATUIT ✅)
- **Alternative** : Cloudflare SSL (GRATUIT ✅)
- **Coût** : 0€ (inclus dans Certbot)

### 4. **Base de Données**
- **Service** : PostgreSQL
- **Options** :
  - Auto-hébergée sur VPS (GRATUIT ✅)
  - Managed Database (15-50€/mois)
- **Recommandation** : Auto-hébergée pour commencer
- **Coût** : 0€ (si sur VPS)

## 🟡 Services RECOMMANDÉS (Production)

### 5. **Email Transactionnel**
- **Service nécessaire** : Oui (confirmation, notifications)
- **Options** :
  
  **Option A - SendGrid** (Recommandé)
  - Plan Free : 100 emails/jour GRATUIT ✅
  - Plan Essentials : 40k emails/mois (20$/mois)
  - **Recommandation** : Free plan pour démarrer
  
  **Option B - Mailgun**
  - Plan Free : 5,000 emails/mois GRATUIT ✅
  - Pay as you go : 0.80$/1000 emails
  
  **Option C - Amazon SES**
  - 0.10$/1000 emails
  - Complexe à configurer
  
  **Option D - SMTP serveur local**
  - Gratuit mais risque spam
  - Non recommandé pour production

- **Coût recommandé** : 0€ (plan gratuit SendGrid/Mailgun)

### 6. **SMS (Notifications)**
- **Service nécessaire** : Optionnel mais recommandé
- **Options** :
  
  **Option A - Twilio**
  - Pay as you go
  - SMS au Sénégal : ~0.05-0.07$/SMS
  - 100 SMS = 5-7$
  
  **Option B - Opérateurs locaux (Sénégal)**
  - Orange Sénégal API
  - Free Sénégal API
  - Meilleur prix, intégration locale
  - Contacter directement les opérateurs
  
  **Option C - Pas de SMS**
  - Utiliser uniquement emails
  - Gratuit mais moins d'engagement

- **Coût estimé** : 20-50€/mois (optionnel)

### 7. **Push Notifications (PWA)**
- **Service nécessaire** : Oui pour notifications push web
- **Options** :
  
  **Option A - Firebase Cloud Messaging (FCM)**
  - GRATUIT jusqu'à usage intensif ✅
  - Recommandé
  
  **Option B - OneSignal**
  - Plan Free : 10,000 abonnés GRATUIT ✅
  
  **Option C - Web Push natif**
  - Gratuit mais complexe
  - Nécessite certificats VAPID

- **Coût** : 0€ (Firebase gratuit)

### 8. **Paiement en Ligne**

**A. Cartes bancaires (International)**
- **Service** : Stripe
- **Frais** : 2.9% + 0.30€ par transaction
- **Pas d'abonnement mensuel** ✅
- **Nécessaire** : Oui pour cartes Visa/Mastercard
- **Coût** : 0€ fixe + frais par transaction

**B. Mobile Money (Local Sénégal/Congo)**
- **Orange Money**
  - API payante, contrat nécessaire
  - Frais : ~2-3% par transaction
  - Contact : Orange Sénégal B2B
  
- **Wave**
  - API disponible
  - Frais compétitifs
  - Contact : Wave Sénégal
  
- **Free Money** (si applicable)

- **Recommandation** : Commencer avec Stripe seul
- **Coût Mobile Money** : Variables, négocier avec opérateurs

### 9. **Stockage Fichiers**
- **Service nécessaire** : Recommandé pour documents/photos
- **Options** :
  
  **Option A - Stockage local (VPS)**
  - GRATUIT ✅
  - Limité par espace disque VPS
  - Backups manuels nécessaires
  - Recommandé pour démarrer
  
  **Option B - AWS S3**
  - 0.023$/GB/mois
  - 5GB = 0.12$/mois
  - 50GB = 1.20$/mois
  
  **Option C - Wasabi (S3 compatible)**
  - 5.99$/mois pour 1TB
  - Moins cher que AWS
  
  **Option D - Cloudinary** (pour images)
  - Plan Free : 25GB gratuit ✅

- **Coût recommandé** : 0€ (stockage local), évoluer vers S3 si nécessaire

### 10. **Backups**
- **Service nécessaire** : OBLIGATOIRE
- **Options** :
  
  **Option A - Backups locaux**
  - Script automatisé (fourni) GRATUIT ✅
  - Stocké sur VPS
  - Risque si VPS down
  
  **Option B - Backups offsite (AWS S3)**
  - Recommandé
  - S3 Glacier : 0.004$/GB/mois
  - 10GB backups = 0.04$/mois
  
  **Option C - Backblaze B2**
  - 0.005$/GB/mois
  - Alternative moins chère

- **Coût recommandé** : 0€ local + 1-2€/mois offsite

## 🟢 Services OPTIONNELS (Nice to have)

### 11. **Monitoring & Alertes**
- **Gratuit** :
  - UptimeRobot (50 monitors gratuits) ✅
  - Logs locaux + email alerts ✅
  
- **Payant** :
  - Datadog (31$/mois)
  - New Relic (25$/mois)
  - Sentry (26$/mois)

- **Coût** : 0€ (gratuit suffisant)

### 12. **CDN (Performance)**
- **Cloudflare** : GRATUIT ✅
- **Recommandation** : Activer dès le début
- **Coût** : 0€

### 13. **Analytics**
- **Google Analytics** : GRATUIT ✅
- **Matomo** : GRATUIT (auto-hébergé) ✅
- **Coût** : 0€

### 14. **Protection DDoS**
- **Cloudflare** : GRATUIT ✅
- **Recommandation** : Activer
- **Coût** : 0€

## 📊 Récapitulatif des Coûts

### Configuration MINIMALE (MVP)
```
VPS (4GB)           : 25€/mois
Domaine             : 2€/mois (24€/an)
Email (SendGrid)    : 0€ (plan gratuit)
Push (Firebase)     : 0€
SSL                 : 0€
Stripe              : 0€ fixe (frais par transaction)
Stockage local      : 0€
Backups local       : 0€
CDN Cloudflare      : 0€
─────────────────────────────
TOTAL MENSUEL       : 27€/mois
```

### Configuration RECOMMANDÉE (Production)
```
VPS (8GB)           : 40€/mois
Domaine             : 2€/mois
Email (SendGrid)    : 15€/mois (20k emails)
SMS (Twilio)        : 30€/mois (optionnel)
Push (Firebase)     : 0€
SSL                 : 0€
Stripe              : frais par transaction
Mobile Money        : frais par transaction
S3 Backups          : 2€/mois
Monitoring          : 0€ (UptimeRobot)
CDN Cloudflare      : 0€
─────────────────────────────
TOTAL MENSUEL       : 89€/mois (sans SMS : 59€/mois)
```

### Configuration OPTIMALE (Scale)
```
VPS/Cloud           : 80€/mois
Database managed    : 25€/mois
Domaine             : 2€/mois
Email (SendGrid)    : 80€/mois (100k emails)
SMS (opérateur)     : 50€/mois
Push (Firebase)     : 0€
Stripe              : frais par transaction
Mobile Money        : frais par transaction
S3 Storage          : 5€/mois
Monitoring (Sentry) : 26€/mois
CDN                 : 0€
─────────────────────────────
TOTAL MENSUEL       : 268€/mois
```

## ✅ Ce qui est GRATUIT et inclus

- ✅ Code source complet
- ✅ Django + PostgreSQL
- ✅ React PWA
- ✅ Nginx configuration
- ✅ SSL avec Let's Encrypt
- ✅ Backups scripts
- ✅ CI/CD GitHub Actions
- ✅ Génération PDF (ReportLab)
- ✅ QR Codes
- ✅ Logs
- ✅ Documentation complète

## 📋 Services à configurer (étape par étape)

### Phase 1 - MVP (Jour 1)
1. ✅ Louer VPS (DigitalOcean/Hetzner)
2. ✅ Acheter domaine
3. ✅ Créer compte SendGrid gratuit
4. ✅ Créer compte Firebase gratuit
5. ✅ Créer compte Stripe

### Phase 2 - Production (Semaine 2)
6. Configurer Cloudflare
7. Activer backups S3
8. Configurer UptimeRobot
9. (Optionnel) Configurer Twilio SMS

### Phase 3 - Scale (Mois 2-3)
10. Négocier avec Orange Money/Wave
11. Activer monitoring payant si nécessaire
12. Migrer vers managed database si nécessaire

## 🔑 Clés API à obtenir

### Obligatoires :
- [ ] Stripe API keys (Live + Test)
- [ ] SendGrid API key
- [ ] Firebase Server Key

### Optionnelles :
- [ ] Twilio Account SID + Auth Token
- [ ] AWS Access Keys (pour S3)
- [ ] Orange Money API credentials
- [ ] Wave API credentials

## 📞 Contacts utiles

**Sénégal - Paiement Mobile**
- Orange Money B2B : https://www.orangemoney.sn/
- Wave : https://www.wave.com/sn/
- Free Money : https://www.free.sn/

**Support Technique**
- Stripe Support : https://support.stripe.com/
- SendGrid Support : https://support.sendgrid.com/
- Firebase Support : https://firebase.google.com/support

---

**Recommandation finale** : 
- Commencer avec configuration MINIMALE (27€/mois)
- Tous les services gratuits sont suffisants pour 1000-5000 utilisateurs/mois
- Scaler progressivement selon le trafic réel

**Budget réaliste de démarrage** : 30-50€/mois tout compris

