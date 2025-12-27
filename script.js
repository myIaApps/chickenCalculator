document.addEventListener('DOMContentLoaded', () => {
    const inputPrecio = document.getElementById('precioPollo');
    const btnCalcular = document.getElementById('btnCalcular');
    const resultadoContainer = document.getElementById('resultadoContainer');
    const resultadoValue = document.getElementById('resultadoValue');

    btnCalcular.addEventListener('click', () => {
        const precio = parseFloat(inputPrecio.value);

        if (isNaN(precio) || precio <= 0) {
            alert('Por favor, ingresá un precio válido.');
            return;
        }

        // Fórmula: precio / 0.65 (35% de desperdicio)
        const costoReal = precio / 0.65;

        // Mostrar resultado con formato de moneda
        resultadoValue.textContent = `$${costoReal.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

        // Animación de entrada
        resultadoContainer.classList.remove('hidden');
        resultadoContainer.style.animation = 'none';
        resultadoContainer.offsetHeight; // force reflow
        resultadoContainer.style.animation = 'slideUp 0.4s ease-out forwards';
    });

    // Registrar Service Worker
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then(reg => console.log('Service Worker registrado', reg))
                .catch(err => console.log('Error al registrar Service Worker', err));
        });
    }
});
