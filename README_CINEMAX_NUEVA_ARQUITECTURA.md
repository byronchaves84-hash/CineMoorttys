# CINEMAX — nueva experiencia web

## Arquitectura
- `server.py`: backend HTTP y API existente, preservado para mantener autenticación, sesiones, catálogo, favoritos, analítica, papelera y sincronización GitHub.
- `index.html`: nueva portada y catálogo adaptable.
- `assets/css/app.css`: sistema visual independiente.
- `assets/js/app.js`: carga del catálogo desde `/api/catalog`, búsqueda, filtros y tarjetas.
- `Cinema-main/`: datos persistentes y páginas/recursos heredados.
- `admin2.html`, `admin2.js`, `admin2.css`: administración existente conservada.

## Render
Build Command: `pip install -r requirements.txt`
Start Command: `python server.py`

No se requieren paquetes externos para el servidor actual. El archivo `.python-version` fija Python 3.12.10.

## Nota
Esta reconstrucción sustituye la experiencia de la portada pública, no reimplementa desde cero el backend de autenticación ni los módulos administrativos. Esos componentes se conservan para evitar perder cuentas, datos y contratos API. Los enlaces de contenido siguen dependiendo de las rutas guardadas en el catálogo.

## Funciones añadidas en esta entrega
- Lista personal de favoritos sincronizada con `/api/favorites`.
- Guardar/quitar desde tarjetas y filtro `Mi lista`.
- Contador de favoritos y búsqueda insensible a acentos.
- Acceso `Mi cuenta` al detectar sesión activa.
