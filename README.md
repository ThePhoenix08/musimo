# 🚧 Work in Progress 🚧

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