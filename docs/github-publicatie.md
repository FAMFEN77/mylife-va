# Project naar GitHub publiceren

Dit stappenplan helpt je het volledige `MyLife VA`-project veilig naar GitHub te pushen. Pas de voorbeeld-URL’s en gebruikersnamen aan naar je eigen situatie.

## 1. Voorbereiding

1. Installeer Git (https://git-scm.com/) en controleer de versie:
   ```bash
   git --version
   ```
2. Stel je naam en e-mail in voor commits (voer uit in de projectmap):
   ```bash
   git config --global user.name "Voornaam Achternaam"
   git config --global user.email "jij@example.com"
   ```
3. Zorg dat geheime bestanden in `.gitignore` staan (voorbeelden: `backend/.env`, `frontend/.env.local`, `node_modules/`, `logs/`). Voeg ze toe als dat nog niet zo is voordat je commit.

## 2. Repository initialiseren

Voer onderstaande commando’s uit in de hoofdmap van het project (`/mnt/d/MyLife VA`):

```bash
git init
git status -sb
git branch -m main
```

- `git status -sb` geeft een compact overzicht van alle bestanden die straks gecommit worden.

## 3. Eerste commit maken

```bash
git add .
git commit -m "Initial commit of MyLife VA project"
```

Als er bestanden zijn die je niet wilt uploaden, verwijder ze eerst uit de staging (`git restore --staged pad/naar/bestand`) of plaats ze in `.gitignore`.

## 4. GitHub-repository aanmaken

### Optie A: via de website
1. Ga naar https://github.com/new.
2. Kies een naam (bijv. `mylife-va`), zet eventueel op “Private”.
3. Laat “Initialize this repository with…” uit staan (je hebt al lokale commits).

### Optie B: via de GitHub CLI

```bash
gh auth login                      # eenmalig, met browser of PAT
gh repo create YOURUSER/mylife-va \
  --private \
  --source=. \
  --remote=origin \
  --push
```

*(Sla deze stap over als je de website gebruikt.)*

## 5. Remote koppelen (alleen nodig als je optie A gebruikte)

Kies HTTPS of SSH:

```bash
# HTTPS
git remote add origin https://github.com/YOURUSER/mylife-va.git

# of SSH
git remote add origin git@github.com:YOURUSER/mylife-va.git
```

Controleer:
```bash
git remote -v
```

## 6. Push naar GitHub

```bash
git push -u origin main
```

Als Git om een wachtwoord vraagt bij HTTPS, gebruik dan een GitHub Personal Access Token (PAT) met minimaal `repo`-rechten.

## 7. Verder werken

1. Bekijk wijzigingen: `git status -sb`
2. Voeg wijzigingen toe: `git add pad/naar/bestand`
3. Commit met beschrijving: `git commit -m "Beschrijf wijziging"`
4. Push naar GitHub: `git push`

Pull eerst (`git pull --rebase origin main`) als je op meerdere machines werkt of anderen meewerken.

## 8. Probleemoplossing

- **Per ongeluk geheim bestand gepusht**: verwijder het uit de repository (`git rm --cached pad`) en maak een nieuwe commit, push daarna opnieuw.
- **Large file error**: controleer via `git lfs install` en gebruik Git LFS voor grote binaries.
- **Geen rechten op remote**: controleer of je PAT/SSH-key toegang heeft; voeg de key toe via https://github.com/settings/keys.

Dan staat je project veilig op GitHub! Heb je meerdere omgevingsbestanden, werk dan met voorbeelden zoals `.env.example` zodat anderen weten welke variabelen nodig zijn zonder echte geheimen te publiceren.
