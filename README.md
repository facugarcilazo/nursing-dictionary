# Nursing Student's Dictionary

Aplicación web colaborativa para que los alumnos del curso de Inglés carguen vocabulario y lo visualicen en una grilla interactiva. Desarrollada con el mismo stack tecnológico que el **Proyecto Final de Seminario de Informática** (**Python + Flask + SQLAlchemy/SQLite + HTML/CSS/JS**).

## Características
- **Panel superior de carga**: Permite ingresar:
  - **Word** (Palabra en inglés)
  - **Meaning** (Significado)
  - **Pronunciation** (Pronunciación)
  - **Example** (Oración de ejemplo)
  - **Student's Name Collaborator** (Nombre del alumno colaborador)
  - Botón **Cargar** que vuelca automáticamente la entrada en la grilla inferior.
- **Grilla fija inferior**: Reproduce el diseño de planilla de *Nursing Student's Dictionary* con sus 5 columnas y encabezados fijos al desplazarse.
- **Botones de ordenamiento debajo de la grilla**:
  - **Ordenar por fecha de carga**
  - **Ordenar alfabéticamente**

## Cómo ejecutar el proyecto
1. Hacer doble clic en `run.bat` (o ejecutar `python app.py` activando el entorno virtual `venv`).
2. Abrir en el navegador: `http://127.0.0.1:5000`
