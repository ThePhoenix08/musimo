# 🚧 Work in Progress 🚧

## instructions on project setup
- Please follow below commands for intital backend setup
1. Clone the Repository
```bash
git clone "https://github.com/ThePhoenix08/musimo.git"
cd "./server"
```

2. Install dependencies
```bash
uv sync
```

3. Run the backend server
```bash
uvicorn main:app --port 8000 --reload
```

## instructions for installing a package in backend
- Please use below command file installing a package
```bash
uv add package_name
```

- Then update the lockfile
```bash
uv lock
```

- You can also update requirements.txt
```bash
uv export > requirements.txt
```

## instructions for updating your packages
- Pull latest changes
```bash
git pull
```

- Sync `.venv` with `uv.lock`
```bash
uv sync
```

## instructions for removal
- Use below command
```bash
uv remove package_name
```
- Then update lockfile and export requirements by following above instructions