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

    // --- OCR and Camera Logic ---
    const btnScan = document.getElementById('btnScan');
    const scannerOverlay = document.getElementById('scannerOverlay');
    const btnCloseScanner = document.getElementById('btnCloseScanner');
    const video = document.getElementById('video');
    const scannerStatus = document.getElementById('scannerStatus');
    let stream = null;

    btnScan.addEventListener('click', async () => {
        scannerOverlay.classList.remove('hidden');
        scannerStatus.textContent = 'Solicitando acceso a la cámara...';

        try {
            stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });
            video.srcObject = stream;
            scannerStatus.textContent = 'Apuntá a la etiqueta y quedate quieto';

            // Iniciar procesamiento después de que el video cargue
            video.onloadedmetadata = () => {
                startScanning();
            };
        } catch (err) {
            console.error('Error cámara:', err);
            alert('No se pudo acceder a la cámara. Asegurate de dar permisos.');
            closeScanner();
        }
    });

    btnCloseScanner.addEventListener('click', closeScanner);

    function closeScanner() {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        scannerOverlay.classList.add('hidden');
        video.srcObject = null;
    }

    async function startScanning() {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        const scanFrame = async () => {
            if (scannerOverlay.classList.contains('hidden')) return;

            // Ajustar canvas al tamaño del video
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            context.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Recortar el área del visor para mejorar precisión
            const cropWidth = canvas.width * 0.8;
            const cropHeight = canvas.height * 0.2;
            const cropX = (canvas.width - cropWidth) / 2;
            const cropY = (canvas.height - cropHeight) / 2;

            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = cropWidth;
            tempCanvas.height = cropHeight;
            tempCanvas.getContext('2d').drawImage(canvas, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

            scannerStatus.textContent = 'Escaneando...';

            try {
                const { data: { text } } = await Tesseract.recognize(tempCanvas, 'spa', {
                    logger: m => console.log(m)
                });

                console.log('Texto detectado:', text);

                // Regex para precios tipo Argentinos: $ 1.234,56 o 123,45
                const priceRegex = /(\$?\s*)(\d{1,3}(\.\d{3})*|\d+)(,\d{2})/g;
                const matches = text.match(priceRegex);

                if (matches) {
                    // Limpiar el match para obtener solo el número
                    // Reemplazamos el punto de miles por nada y la coma decimal por punto
                    let foundPrice = matches[0].replace('$', '').trim();
                    foundPrice = foundPrice.replace(/\./g, '').replace(',', '.');

                    inputPrecio.value = parseFloat(foundPrice);
                    scannerStatus.textContent = '¡Precio encontrado!';
                    setTimeout(() => {
                        closeScanner();
                        btnCalcular.click();
                    }, 500);
                } else {
                    // Reintentar después de un breve delay
                    setTimeout(scanFrame, 1000);
                }
            } catch (err) {
                console.error('Error OCR:', err);
                setTimeout(scanFrame, 2000);
            }
        };

        scanFrame();
    }

    // Registrar Service Worker (actualizado para rutas relativas)
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('sw.js')
                .then(reg => console.log('Service Worker registrado', reg))
                .catch(err => console.log('Error al registrar Service Worker', err));
        });
    }
});
