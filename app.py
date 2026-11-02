from flask import Flask, render_template, request, redirect, url_for, flash, jsonify
from sqlalchemy import func
from models import db, DictionaryEntry

def create_app():
    app = Flask(__name__)
    app.config['SECRET_KEY'] = 'nursing-dictionary-secret-key-2026'
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///dictionary.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    db.init_app(app)

    def get_sorted_entries(sort_by='fecha'):
        if sort_by == 'alfabetico':
            return DictionaryEntry.query.order_by(func.lower(DictionaryEntry.word).asc(), DictionaryEntry.id.asc()).all()
        else:
            # Por defecto: orden de carga (más antiguos primero como en una planilla, o por id ascendente)
            return DictionaryEntry.query.order_by(DictionaryEntry.created_at.asc(), DictionaryEntry.id.asc()).all()

    @app.route('/')
    def index():
        sort_by = request.args.get('orden', 'fecha')
        if sort_by not in ('fecha', 'alfabetico'):
            sort_by = 'fecha'

        entries = get_sorted_entries(sort_by)
        min_rows = 25
        empty_rows = max(0, min_rows - len(entries))

        return render_template(
            'index.html',
            entries=entries,
            empty_rows=empty_rows,
            current_sort=sort_by
        )

    @app.route('/agregar', methods=['POST'])
    def add_word():
        if request.is_json:
            data = request.get_json()
            word = (data.get('word') or '').strip()
            meaning = (data.get('meaning') or '').strip()
            pronunciation = (data.get('pronunciation') or '').strip()
            example = (data.get('example') or '').strip()
            student_name = (data.get('student_name') or '').strip()
            sort_by = data.get('orden', 'fecha')
        else:
            word = (request.form.get('word') or '').strip()
            meaning = (request.form.get('meaning') or '').strip()
            pronunciation = (request.form.get('pronunciation') or '').strip()
            example = (request.form.get('example') or '').strip()
            student_name = (request.form.get('student_name') or '').strip()
            sort_by = request.form.get('current_sort', 'fecha')

        if not word or not meaning or not student_name:
            if request.is_json:
                return jsonify({'error': 'Por favor completá al menos Word, Meaning y Student\'s Name Collaborator.'}), 400
            flash('Por favor completá al menos Word, Meaning y Student\'s Name Collaborator.', 'error')
            return redirect(url_for('index', orden=sort_by))

        new_entry = DictionaryEntry(
            word=word,
            meaning=meaning,
            pronunciation=pronunciation,
            example=example,
            student_name=student_name
        )
        db.session.add(new_entry)
        db.session.commit()

        if request.is_json:
            entries = get_sorted_entries(sort_by)
            return jsonify({
                'message': f'¡La palabra "{word}" fue cargada con éxito!',
                'entry': new_entry.to_dict(),
                'entries': [e.to_dict() for e in entries]
            })

        flash(f'¡La palabra "{word}" fue cargada con éxito!', 'success')
        return redirect(url_for('index', orden=sort_by))

    @app.route('/api/palabras', methods=['GET'])
    def api_words():
        sort_by = request.args.get('orden', 'fecha')
        if sort_by not in ('fecha', 'alfabetico'):
            sort_by = 'fecha'
        entries = get_sorted_entries(sort_by)
        return jsonify({
            'orden': sort_by,
            'entries': [e.to_dict() for e in entries]
        })

    @app.route('/editar/<int:entry_id>', methods=['POST'])
    def edit_word(entry_id):
        entry = DictionaryEntry.query.get_or_404(entry_id)

        if request.is_json:
            data = request.get_json()
            word = (data.get('word') or '').strip()
            meaning = (data.get('meaning') or '').strip()
            pronunciation = (data.get('pronunciation') or '').strip()
            example = (data.get('example') or '').strip()
            student_name = (data.get('student_name') or '').strip()
            sort_by = data.get('orden', 'fecha')
        else:
            word = (request.form.get('word') or '').strip()
            meaning = (request.form.get('meaning') or '').strip()
            pronunciation = (request.form.get('pronunciation') or '').strip()
            example = (request.form.get('example') or '').strip()
            student_name = (request.form.get('student_name') or '').strip()
            sort_by = request.form.get('current_sort', 'fecha')

        if not word or not meaning or not student_name:
            if request.is_json:
                return jsonify({'error': 'Por favor completá al menos Word, Meaning y Student\'s Name Collaborator.'}), 400
            flash('Por favor completá al menos Word, Meaning y Student\'s Name Collaborator.', 'error')
            return redirect(url_for('index', orden=sort_by))

        entry.word = word
        entry.meaning = meaning
        entry.pronunciation = pronunciation
        entry.example = example
        entry.student_name = student_name
        db.session.commit()

        if request.is_json:
            entries = get_sorted_entries(sort_by)
            return jsonify({
                'message': f'¡Los cambios en "{word}" fueron guardados con éxito!',
                'entry': entry.to_dict(),
                'entries': [e.to_dict() for e in entries]
            })

        flash(f'¡Los cambios en "{word}" fueron guardados con éxito!', 'success')
        return redirect(url_for('index', orden=sort_by))

    @app.route('/eliminar/<int:entry_id>', methods=['POST'])
    def delete_word(entry_id):
        entry = DictionaryEntry.query.get_or_404(entry_id)
        word_name = entry.word
        db.session.delete(entry)
        db.session.commit()

        sort_by = request.args.get('orden') or request.form.get('current_sort') or 'fecha'
        if request.is_json:
            entries = get_sorted_entries(sort_by)
            return jsonify({
                'message': f'Palabra "{word_name}" eliminada.',
                'entries': [e.to_dict() for e in entries]
            })

        flash(f'Palabra "{word_name}" eliminada correctamente.', 'success')
        return redirect(url_for('index', orden=sort_by))

    with app.app_context():
        db.create_all()

    return app

app = create_app()

if __name__ == '__main__':
    # host='0.0.0.0' permite que otros alumnos en la misma red local también puedan acceder si se desea
    app.run(host='0.0.0.0', port=5000, debug=True)
