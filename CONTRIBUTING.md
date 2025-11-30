# 🤝 Guide de Contribution

Merci de contribuer au projet PWA Ambassade du Congo !

## 🚀 Démarrage Rapide

```bash
# Fork le projet
git clone https://github.com/your-username/embassy-pwa.git
cd embassy-pwa

# Créer une branche
git checkout -b feature/ma-fonctionnalite

# Développer
# ...

# Tester
cd backend && pytest
cd frontend && npm test

# Commiter
git commit -m "feat: ajouter ma fonctionnalité"

# Push
git push origin feature/ma-fonctionnalite

# Créer une Pull Request sur GitHub
```

## 📝 Standards de Code

### Python (Backend)
- Black pour formatage
- Flake8 pour linting
- Type hints recommandés
- Docstrings pour fonctions publiques
- Tests pour nouveaux features

```bash
# Formatter
black .

# Linter
flake8 .

# Tests
pytest --cov
```

### TypeScript/React (Frontend)
- Prettier pour formatage
- ESLint pour linting
- TypeScript strict
- Composants fonctionnels
- Hooks recommandés

```bash
# Linter
npm run lint

# Tests
npm test
```

## 📋 Processus de Pull Request

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit avec messages clairs (`git commit -m 'feat: Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request
6. Attendre review et merge

## 💬 Communication

- Issues GitHub pour bugs
- Discussions pour features
- Email pour questions urgentes

## 📜 Licence

En contribuant, vous acceptez que vos contributions soient sous licence MIT.

## 🙏 Merci !

Chaque contribution compte ! 🎉

