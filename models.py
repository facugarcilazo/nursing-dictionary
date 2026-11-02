from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class DictionaryEntry(db.Model):
    """
    Modelo que representa cada palabra cargada por un alumno en el diccionario.
    """
    __tablename__ = 'dictionary_entries'

    id = db.Column(db.Integer, primary_key=True)
    word = db.Column(db.String(150), nullable=False)
    meaning = db.Column(db.String(500), nullable=False)
    pronunciation = db.Column(db.String(200), nullable=True, default='')
    example = db.Column(db.String(500), nullable=True, default='')
    student_name = db.Column(db.String(150), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'word': self.word,
            'meaning': self.meaning,
            'pronunciation': self.pronunciation or '',
            'example': self.example or '',
            'student_name': self.student_name,
            'created_at': self.created_at.strftime('%d/%m/%Y %H:%M:%S')
        }
