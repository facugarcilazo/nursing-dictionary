const MIN_GRID_ROWS = 25;
const STORAGE_KEY = 'nursing_dictionary_entries_v1';

// Detecta automáticamente si está corriendo en GitHub Pages (.github.io) o como archivo estático
const IS_STATIC_HOST = window.location.hostname.endsWith('github.io') || window.location.protocol === 'file:';

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
}

function escapeAttr(text) {
    return (text || '')
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function formatNow() {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

function getLocalEntries() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        return [];
    }
}

function saveLocalEntries(entries) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch (e) {
        console.error('Error guardando en localStorage:', e);
    }
}

function getSortedLocalEntries(sortBy = 'fecha') {
    const entries = [...getLocalEntries()];
    if (sortBy === 'alfabetico') {
        entries.sort((a, b) => (a.word || '').toLowerCase().localeCompare((b.word || '').toLowerCase()));
    } else {
        entries.sort((a, b) => (a.timestamp || a.id) - (b.timestamp || b.id));
    }
    return entries;
}

function showNotification(message, type = 'success') {
    const area = document.getElementById('notification-area');
    if (!area) return;

    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    area.appendChild(alertDiv);

    setTimeout(() => {
        alertDiv.style.opacity = '0';
        alertDiv.style.transition = 'opacity 0.3s ease';
        setTimeout(() => alertDiv.remove(), 300);
    }, 3000);
}

function renderGrid(entries, highlightId = null) {
    const tbody = document.getElementById('dictionary-tbody');
    const wordCountEl = document.getElementById('word-count');
    const currentEditId = document.getElementById('edit-entry-id')?.value;
    if (!tbody) return;

    if (wordCountEl) {
        wordCountEl.textContent = entries.length;
    }

    let html = '';

    entries.forEach((entry, index) => {
        const rowNum = index + 3; // Fila 1 es el título, Fila 2 son los encabezados
        const isHighlighted = highlightId && String(entry.id) === String(highlightId) ? 'row-just-added' : '';
        const isEditing = currentEditId && String(entry.id) === String(currentEditId) ? 'row-editing' : '';
        html += `
            <tr class="data-row ${isHighlighted} ${isEditing}"
                data-id="${entry.id}"
                data-word="${escapeAttr(entry.word)}"
                data-meaning="${escapeAttr(entry.meaning)}"
                data-pronunciation="${escapeAttr(entry.pronunciation)}"
                data-example="${escapeAttr(entry.example)}"
                data-student="${escapeAttr(entry.student_name)}"
                title="Cargado el ${escapeAttr(entry.created_at)}">
                <td class="row-num">${rowNum}</td>
                <td class="cell-word">${escapeHtml(entry.word)}</td>
                <td class="cell-meaning">${escapeHtml(entry.meaning)}</td>
                <td class="cell-pronunciation">${escapeHtml(entry.pronunciation)}</td>
                <td class="cell-example">${escapeHtml(entry.example)}</td>
                <td class="cell-student">
                    <div class="student-cell-content">
                        <span class="student-name-text">${escapeHtml(entry.student_name)}</span>
                        <div class="row-actions">
                            <button type="button" class="btn-edit-row" onclick="startEdit(this)" title="Modificar palabra">✏️</button>
                            <button type="button" class="btn-delete-row" onclick="deleteEntry(${entry.id})" title="Eliminar fila">&times;</button>
                        </div>
                    </div>
                </td>
            </tr>
        `;
    });

    const emptyCount = Math.max(0, MIN_GRID_ROWS - entries.length);
    for (let i = 0; i < emptyCount; i++) {
        const rowNum = entries.length + i + 3;
        html += `
            <tr class="empty-row">
                <td class="row-num">${rowNum}</td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
            </tr>
        `;
    }

    tbody.innerHTML = html;

    if (highlightId) {
        const addedRow = tbody.querySelector(`tr[data-id="${highlightId}"]`);
        if (addedRow) {
            addedRow.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }
}

function startEdit(btnElement) {
    const row = btnElement.closest('tr.data-row');
    if (!row) return;

    const entryId = row.getAttribute('data-id');
    const word = row.getAttribute('data-word') || '';
    const meaning = row.getAttribute('data-meaning') || '';
    const pronunciation = row.getAttribute('data-pronunciation') || '';
    const example = row.getAttribute('data-example') || '';
    const student = row.getAttribute('data-student') || '';

    const editIdInput = document.getElementById('edit-entry-id');
    const wordInput = document.getElementById('word');
    const meaningInput = document.getElementById('meaning');
    const pronunciationInput = document.getElementById('pronunciation');
    const exampleInput = document.getElementById('example');
    const studentInput = document.getElementById('student_name');
    const btnCargar = document.getElementById('btn-cargar');
    const btnCancelar = document.getElementById('btn-cancelar');
    const formPanel = document.getElementById('top-form-panel');
    const subtitle = document.getElementById('form-subtitle');

    if (editIdInput) editIdInput.value = entryId;
    if (wordInput) wordInput.value = word;
    if (meaningInput) meaningInput.value = meaning;
    if (pronunciationInput) pronunciationInput.value = pronunciation;
    if (exampleInput) exampleInput.value = example;
    if (studentInput) studentInput.value = student;

    if (btnCargar) {
        btnCargar.textContent = 'Guardar';
        btnCargar.classList.add('btn-guardar-mode');
    }
    if (btnCancelar) {
        btnCancelar.style.display = 'inline-flex';
    }
    if (formPanel) {
        formPanel.classList.add('editing-active');
        formPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    if (subtitle) {
        subtitle.innerHTML = `Modificando palabra: <strong style="color: var(--neon-blue);">${escapeHtml(word)}</strong>`;
    }

    document.querySelectorAll('#dictionary-tbody tr.data-row').forEach(tr => {
        tr.classList.toggle('row-editing', tr.getAttribute('data-id') === String(entryId));
    });

    if (wordInput) {
        wordInput.focus();
        wordInput.select();
    }
}

function cancelEdit(clearStudent = false) {
    const editIdInput = document.getElementById('edit-entry-id');
    const wordInput = document.getElementById('word');
    const meaningInput = document.getElementById('meaning');
    const pronunciationInput = document.getElementById('pronunciation');
    const exampleInput = document.getElementById('example');
    const studentInput = document.getElementById('student_name');
    const btnCargar = document.getElementById('btn-cargar');
    const btnCancelar = document.getElementById('btn-cancelar');
    const formPanel = document.getElementById('top-form-panel');
    const subtitle = document.getElementById('form-subtitle');

    if (editIdInput) editIdInput.value = '';
    if (wordInput) wordInput.value = '';
    if (meaningInput) meaningInput.value = '';
    if (pronunciationInput) pronunciationInput.value = '';
    if (exampleInput) exampleInput.value = '';
    if (clearStudent && studentInput) studentInput.value = '';

    if (btnCargar) {
        btnCargar.textContent = 'Cargar';
        btnCargar.classList.remove('btn-guardar-mode');
    }
    if (btnCancelar) {
        btnCancelar.style.display = 'none';
    }
    if (formPanel) {
        formPanel.classList.remove('editing-active');
    }
    if (subtitle) {
        subtitle.textContent = 'Carga de vocabulario colaborativo para alumnos';
    }

    document.querySelectorAll('#dictionary-tbody tr.data-row.row-editing').forEach(tr => {
        tr.classList.remove('row-editing');
    });
}

function updateSortUI(sortBy) {
    const sortInput = document.getElementById('current-sort-input');
    const btnFecha = document.getElementById('btn-sort-fecha');
    const btnAlfabetico = document.getElementById('btn-sort-alfabetico');
    const statusText = document.getElementById('sort-status-text');

    if (sortInput) sortInput.value = sortBy;

    if (btnFecha && btnAlfabetico) {
        btnFecha.classList.toggle('active', sortBy === 'fecha');
        btnAlfabetico.classList.toggle('active', sortBy === 'alfabetico');
    }

    if (statusText) {
        if (sortBy === 'alfabetico') {
            statusText.innerHTML = 'Vista actual: <strong>Ordenado alfabéticamente (A - Z)</strong>';
        } else {
            statusText.innerHTML = 'Vista actual: <strong>Ordenado por fecha de carga</strong>';
        }
    }

    try {
        const url = new URL(window.location);
        url.searchParams.set('orden', sortBy);
        window.history.replaceState({}, '', url);
    } catch (e) {}
}

async function changeSort(event, sortBy) {
    if (event) event.preventDefault();

    if (IS_STATIC_HOST) {
        updateSortUI(sortBy);
        renderGrid(getSortedLocalEntries(sortBy));
        return;
    }

    try {
        const response = await fetch(`/api/palabras?orden=${encodeURIComponent(sortBy)}`);
        if (!response.ok) throw new Error('Error al ordenar las palabras');
        const data = await response.json();
        updateSortUI(data.orden);
        renderGrid(data.entries);
    } catch (err) {
        updateSortUI(sortBy);
        renderGrid(getSortedLocalEntries(sortBy));
    }
}

async function deleteEntry(entryId) {
    if (!confirm('¿Estás seguro de que querés eliminar esta palabra de la grilla?')) {
        return;
    }
    const sortInput = document.getElementById('current-sort-input');
    const currentSort = sortInput ? sortInput.value : 'fecha';
    const editIdInput = document.getElementById('edit-entry-id');

    if (IS_STATIC_HOST) {
        const entries = getLocalEntries();
        const target = entries.find(e => String(e.id) === String(entryId));
        const filtered = entries.filter(e => String(e.id) !== String(entryId));
        saveLocalEntries(filtered);
        if (editIdInput && String(editIdInput.value) === String(entryId)) {
            cancelEdit(true);
        }
        renderGrid(getSortedLocalEntries(currentSort));
        showNotification(`Palabra "${target ? target.word : ''}" eliminada.`, 'success');
        return;
    }

    try {
        const response = await fetch(`/eliminar/${entryId}?orden=${encodeURIComponent(currentSort)}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ orden: currentSort })
        });
        const data = await response.json();
        if (response.ok) {
            if (editIdInput && String(editIdInput.value) === String(entryId)) {
                cancelEdit(true);
            }
            renderGrid(data.entries);
            showNotification(data.message, 'success');
        } else {
            showNotification(data.error || 'No se pudo eliminar la fila.', 'error');
        }
    } catch (err) {
        showNotification('Error de conexión al eliminar la palabra.', 'error');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Si estamos en GitHub Pages (.github.io) o el tbody está vacío, renderizar la grilla inicial
    const tbody = document.getElementById('dictionary-tbody');
    if (IS_STATIC_HOST || (tbody && tbody.children.length === 0)) {
        const params = new URLSearchParams(window.location.search);
        const initialSort = params.get('orden') === 'alfabetico' ? 'alfabetico' : 'fecha';
        updateSortUI(initialSort);
        renderGrid(getSortedLocalEntries(initialSort));
    }

    const initialAlerts = document.querySelectorAll('#notification-area .alert');
    initialAlerts.forEach((alert) => {
        setTimeout(() => {
            alert.style.opacity = '0';
            alert.style.transition = 'opacity 0.3s ease';
            setTimeout(() => alert.remove(), 300);
        }, 3000);
    });

    const form = document.getElementById('word-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const editIdInput = document.getElementById('edit-entry-id');
            const editId = editIdInput ? editIdInput.value.trim() : '';
            const isEditing = Boolean(editId);

            const wordInput = document.getElementById('word');
            const meaningInput = document.getElementById('meaning');
            const pronunciationInput = document.getElementById('pronunciation');
            const exampleInput = document.getElementById('example');
            const studentInput = document.getElementById('student_name');
            const sortInput = document.getElementById('current-sort-input');
            const btnCargar = document.getElementById('btn-cargar');

            const payload = {
                word: wordInput.value.trim(),
                meaning: meaningInput.value.trim(),
                pronunciation: pronunciationInput.value.trim(),
                example: exampleInput.value.trim(),
                student_name: studentInput.value.trim(),
                orden: sortInput ? sortInput.value : 'fecha'
            };

            if (!payload.word || !payload.meaning || !payload.student_name) {
                showNotification("Por favor completá Word, Meaning y Student's Name Collaborator.", 'error');
                return;
            }

            if (IS_STATIC_HOST) {
                const entries = getLocalEntries();
                let targetId = editId;

                if (isEditing) {
                    const idx = entries.findIndex(item => String(item.id) === String(editId));
                    if (idx !== -1) {
                        entries[idx].word = payload.word;
                        entries[idx].meaning = payload.meaning;
                        entries[idx].pronunciation = payload.pronunciation;
                        entries[idx].example = payload.example;
                        entries[idx].student_name = payload.student_name;
                    }
                    saveLocalEntries(entries);
                    cancelEdit(true);
                    renderGrid(getSortedLocalEntries(payload.orden), targetId);
                    showNotification(`¡Los cambios en "${payload.word}" fueron guardados con éxito!`, 'success');
                } else {
                    const nowMs = Date.now();
                    targetId = nowMs;
                    entries.push({
                        id: nowMs,
                        timestamp: nowMs,
                        word: payload.word,
                        meaning: payload.meaning,
                        pronunciation: payload.pronunciation,
                        example: payload.example,
                        student_name: payload.student_name,
                        created_at: formatNow()
                    });
                    saveLocalEntries(entries);
                    wordInput.value = '';
                    meaningInput.value = '';
                    pronunciationInput.value = '';
                    exampleInput.value = '';
                    renderGrid(getSortedLocalEntries(payload.orden), targetId);
                    showNotification(`¡La palabra "${payload.word}" fue cargada con éxito!`, 'success');
                }
                wordInput.focus();
                return;
            }

            btnCargar.disabled = true;
            btnCargar.textContent = isEditing ? 'Guardando...' : 'Cargando...';

            const targetUrl = isEditing ? `/editar/${encodeURIComponent(editId)}` : '/agregar';

            try {
                const response = await fetch(targetUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                const data = await response.json();

                if (response.ok) {
                    if (isEditing) {
                        cancelEdit(true);
                    } else {
                        wordInput.value = '';
                        meaningInput.value = '';
                        pronunciationInput.value = '';
                        exampleInput.value = '';
                    }
                    renderGrid(data.entries, data.entry.id);
                    showNotification(data.message, 'success');
                    wordInput.focus();
                } else {
                    showNotification(data.error || 'Ocurrió un error al procesar la palabra.', 'error');
                }
            } catch (err) {
                form.submit();
            } finally {
                btnCargar.disabled = false;
                const stillEditing = Boolean(document.getElementById('edit-entry-id')?.value);
                btnCargar.textContent = stillEditing ? 'Guardar' : 'Cargar';
            }
        });
    }
});
