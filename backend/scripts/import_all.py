import subprocess
import sys

scripts = [
    "import_users.py",
    "import_persons.py",
    "import_officers.py",
    "import_criminals.py",
    "import_fir.py",
    "import_cases.py",
    "import_charges.py",
    "import_arrests.py",
    "import_evidence.py",
    "import_convictions.py",
    "import_wanted.py",
    "import_warrants.py",
]

for script in scripts:
    print(f"Running {script}...")
    result = subprocess.run([sys.executable, script], cwd=".", capture_output=True, text=True)
    print(result.stdout.strip())
    if result.returncode != 0:
        print(f"ERROR in {script}:\n{result.stderr.strip()}")
        sys.exit(1)

print("\nAll imports completed successfully.")
