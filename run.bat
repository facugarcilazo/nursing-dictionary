@echo off
echo Activando entorno virtual y ejecutando Nursing Student's Dictionary...
if exist venv\Scripts\activate.bat (
    call venv\Scripts\activate.bat
)
python app.py
pause
