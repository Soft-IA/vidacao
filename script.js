    /* ==========================================================================
    VIDACAO — SCRIPT PRINCIPAL (script.js)
    ========================================================================== */

    // 1. CONFIGURACIÓN GENERAL
    const TELEFONO_VIDACAO = "584243434173"; 

    // Coordenadas Exactas de Vidacao (Taller en Ciudad Alianza, Guacara)
    const TIENDA_LAT = 10.190361;
    const TIENDA_LNG = -67.893833;

    let carrito = [];
    let enlaceUbicacionGPS = "";
    let distanciaGPS_km = 0;
    let costoEnvioEstimado = 0;

    /* --- 2. PUNTERO SEMILLA Y RASTRO DE CHOCOLATE --- */
    const seed = document.getElementById('cursor-seed');
    let ultimoX = 0;
    let ultimoY = 0;
    const distanciaMinima = 10;
    const coloresChocolate = ['#3c2218', '#5c3a21', '#2b1810', '#d4af37'];

    document.addEventListener('mousemove', (e) => {
    if (seed) {
        seed.style.left = `${e.clientX}px`;
        seed.style.top = `${e.clientY}px`;
    }

    const deltaX = e.clientX - ultimoX;
    const deltaY = e.clientY - ultimoY;
    const distancia = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (distancia > distanciaMinima) {
        crearGotaChocolate(e.clientX, e.clientY);
        ultimoX = e.clientX;
        ultimoY = e.clientY;
    }
    });

    document.querySelectorAll('a, button, input, textarea, .filter-btn').forEach(el => {
    el.addEventListener('mouseenter', () => seed && seed.classList.add('active'));
    el.addEventListener('mouseleave', () => seed && seed.classList.remove('active'));
    });

    function crearGotaChocolate(x, y) {
    const gota = document.createElement('div');
    gota.className = 'choco-drop';

    const tamano = Math.floor(Math.random() * 6) + 5;
    const color = coloresChocolate[Math.floor(Math.random() * coloresChocolate.length)];

    gota.style.width = `${tamano}px`;
    gota.style.height = `${tamano}px`;
    gota.style.backgroundColor = color;
    gota.style.left = `${x}px`;
    gota.style.top = `${y}px`;

    document.body.appendChild(gota);

    setTimeout(() => {
        gota.remove();
    }, 650);
    }

    /* --- 3. ANIMACIONES SCROLL (REVEAL) --- */
    const observerOptions = { threshold: 0.15 };
    const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        }
    });
    }, observerOptions);

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

    /* --- 4. AMBIENTE SENSORIAL ASMR --- */
    let audioCtx = null;
    let noiseNode = null;
    let isASMRPlaying = false;

    function toggleASMR() {
    const btnStatus = document.getElementById('asmr-status');
    const btn = document.getElementById('asmr-btn');

    if (!isASMRPlaying) {
        if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        const bufferSize = audioCtx.sampleRate * 2;
        const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let lastOut = 0.0;
        
        for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = output[i];
        }

        noiseNode = audioCtx.createBufferSource();
        noiseNode.buffer = noiseBuffer;
        noiseNode.loop = true;

        const gainNode = audioCtx.createGain();
        gainNode.gain.value = 0.015;

        noiseNode.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        noiseNode.start();

        isASMRPlaying = true;
        if (btnStatus) btnStatus.innerText = "ON";
        if (btn) btn.classList.add('active');
    } else {
        if (noiseNode) noiseNode.stop();
        isASMRPlaying = false;
        if (btnStatus) btnStatus.innerText = "OFF";
        if (btn) btn.classList.remove('active');
    }
    }

    /* --- 5. FILTROS DEL CATÁLOGO --- */
    function filtrarCatalogo(categoria) {
    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    if (window.event && window.event.target) {
        window.event.target.classList.add('active');
    }

    const cards = document.querySelectorAll('.product-card');
    cards.forEach(card => {
        if (categoria === 'todos' || card.dataset.category === categoria) {
        card.style.display = 'block';
        } else {
        card.style.display = 'none';
        }
    });
    }

    /* --- 6. GESTIÓN DE CANTIDADES Y CARRITO --- */
    function toggleCart() {
    const drawer = document.getElementById('cart-drawer');
    const overlay = document.getElementById('cart-overlay');
    if (drawer) drawer.classList.toggle('active');
    if (overlay) overlay.classList.toggle('active');
    }

    function toggleGiftMessage() {
    const checkbox = document.getElementById('gift-checkbox');
    const container = document.getElementById('gift-message-container');
    if (checkbox && container) {
        container.style.display = checkbox.checked ? 'block' : 'none';
    }
    }

    // Cambiar valor del input (+ / -) en las tarjetas del catálogo
    function cambiarCantidadInput(inputId, delta) {
    const input = document.getElementById(inputId);
    if (!input) return;
    let val = parseInt(input.value) || 1;
    val += delta;
    if (val < 1) val = 1;
    if (val > 99) val = 99;
    input.value = val;
    }

    // Agregar al carrito considerando cantidad seleccionada
    function agregarAlCarritoConCantidad(nombre, precio, inputId) {
    const input = document.getElementById(inputId);
    const cantidad = input ? parseInt(input.value) || 1 : 1;

    const itemExistente = carrito.find(item => item.nombre === nombre);
    if (itemExistente) {
        itemExistente.cantidad += cantidad;
    } else {
        carrito.push({ nombre, precio, cantidad });
    }

    if (input) input.value = 1;

    actualizarCarritoView();
    toggleCart();
    }

    function cambiarCantidadCarrito(index, delta) {
    if (!carrito[index]) return;
    carrito[index].cantidad += delta;
    if (carrito[index].cantidad <= 0) {
        carrito.splice(index, 1);
    }
    actualizarCarritoView();
    }

    function eliminarDelCarrito(index) {
    carrito.splice(index, 1);
    actualizarCarritoView();
    }

    function actualizarCarritoView() {
    const container = document.getElementById('cart-items');
    const countSpan = document.getElementById('cart-count');

    const totalUnidades = carrito.reduce((sum, item) => sum + item.cantidad, 0);
    if (countSpan) countSpan.innerText = totalUnidades;

    if (!container) return;

    if (carrito.length === 0) {
        container.innerHTML = '<p class="empty-msg" style="color:#a3ad9e; font-size:0.9rem;">Tu colección aún está vacía.</p>';
        actualizarTotalesFinancieros();
        return;
    }

    container.innerHTML = '';
    carrito.forEach((item, index) => {
        const subtotalItem = item.precio * item.cantidad;
        container.innerHTML += `
        <div class="cart-item" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; border-bottom:1px solid #222; padding-bottom:0.8rem;">
            <div>
            <h4 style="font-size:0.95rem; color:#fff; margin-bottom:0.2rem;">${item.nombre}</h4>
            <small style="color: #d4af37;">${item.cantidad}x $${item.precio.toFixed(2)} = $${subtotalItem.toFixed(2)}</small>
            </div>
            <div style="display:flex; align-items:center; gap:0.4rem;">
            <button type="button" onclick="cambiarCantidadCarrito(${index}, -1)" style="background:rgba(212,175,55,0.15); border:1px solid #d4af37; color:#d4af37; width:24px; height:24px; border-radius:2px; cursor:pointer; font-weight:bold;">-</button>
            <span style="color:#fff; font-size:0.85rem; font-weight:bold; min-width:18px; text-align:center;">${item.cantidad}</span>
            <button type="button" onclick="cambiarCantidadCarrito(${index}, 1)" style="background:rgba(212,175,55,0.15); border:1px solid #d4af37; color:#d4af37; width:24px; height:24px; border-radius:2px; cursor:pointer; font-weight:bold;">+</button>
            <button type="button" onclick="eliminarDelCarrito(${index})" style="background:none; border:none; color: #e74c3c; cursor:pointer; font-size:0.85rem; margin-left:0.4rem;">✕</button>
            </div>
        </div>
        `;
    });

    actualizarTotalesFinancieros();
    }

    /* --- 7. MOTOR LOGÍSTICO Y FINANCIERO --- */
    function toggleDelivery() {
    const isDelivery = document.querySelector('input[name="delivery_method"][value="delivery"]').checked;
    const options = document.getElementById('delivery-options');
    if (options) options.style.display = isDelivery ? 'block' : 'none';
    
    if (!isDelivery) {
        costoEnvioEstimado = 0;
    }
    actualizarTotalesFinancieros();
    }

    function toggleLocation() {
    const isGps = document.querySelector('input[name="location_type"][value="gps"]')?.checked;
    const manualBox = document.getElementById('manual-location-box');
    const gpsBox = document.getElementById('gps-location-box');

    if (manualBox) manualBox.style.display = isGps ? 'none' : 'block';
    if (gpsBox) gpsBox.style.display = isGps ? 'block' : 'none';

    costoEnvioEstimado = 0;
    enlaceUbicacionGPS = "";
    actualizarTotalesFinancieros();
    }

    /* CÁLCULO DE RUTA VÍA OSRM */
    async function calcularDistanciaCarreteraOSRM(latDestino, lngDestino) {
    const url = `https://router.project-osrm.org/route/v1/driving/${TIENDA_LNG},${TIENDA_LAT};${lngDestino},${latDestino}?overview=false`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data && data.routes && data.routes.length > 0) {
        const metros = data.routes[0].distance;
        return metros / 1000;
        }
    } catch (error) {
        console.error("Error al consultar OSRM, usando fallback:", error);
    }

    // Fallback Haversine con sinuosidad
    const R = 6371;
    const dLat = (latDestino - TIENDA_LAT) * Math.PI / 180;
    const dLon = (lngDestino - TIENDA_LNG) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(TIENDA_LAT * Math.PI / 180) * Math.cos(latDestino * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return (R * c) * 1.35; 
    }

    /* CÁLCULO PARA PREDICT MANUAL */
    async function calcularEnvioManualPorCoordenadas(lat, lng, direccionTexto) {
    const envioUI = document.getElementById('cart-envio');
    if (envioUI) envioUI.innerText = "Calculando ruta...";

    distanciaGPS_km = await calcularDistanciaCarreteraOSRM(lat, lng);
    
    costoEnvioEstimado = Math.ceil(distanciaGPS_km / 3);
    if (costoEnvioEstimado < 1) costoEnvioEstimado = 1;

    enlaceUbicacionGPS = `https://maps.google.com/?q=${lat},${lng}`;
    actualizarTotalesFinancieros();
    }

    /* CÁLCULO PARA BOTÓN GPS */
    function obtenerUbicacionYCalcularEnvio() {
    const statusSpan = document.getElementById('gps-status');
    
    if (!navigator.geolocation) {
        if (statusSpan) statusSpan.innerText = "⚠️ Tu navegador no soporta GPS nativo.";
        return;
    }

    if (statusSpan) {
        statusSpan.innerText = "Obteniendo coordenadas...";
        statusSpan.style.color = "#a3ad9e";
    }

    navigator.geolocation.getCurrentPosition(
        async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        enlaceUbicacionGPS = `https://maps.google.com/?q=${lat},${lng}`;
        
        if (statusSpan) statusSpan.innerText = "Trazando ruta por carreteras...";

        distanciaGPS_km = await calcularDistanciaCarreteraOSRM(lat, lng);
        
        costoEnvioEstimado = Math.ceil(distanciaGPS_km / 3);
        if (costoEnvioEstimado < 1) costoEnvioEstimado = 1;

        if (statusSpan) {
            statusSpan.innerHTML = `✓ <strong>Ruta Calculada</strong><br>Distancia en calle: ${distanciaGPS_km.toFixed(1)} km`;
            statusSpan.style.color = "#d4af37";
        }
        
        actualizarTotalesFinancieros();
        },
        (err) => {
        if (statusSpan) {
            statusSpan.innerText = "⚠️ Permiso denegado o señal débil.";
            statusSpan.style.color = "#e74c3c";
        }
        },
        { enableHighAccuracy: true }
    );
    }

    function actualizarTotalesFinancieros() {
    let subtotal = 0;
    carrito.forEach(item => subtotal += (item.precio * item.cantidad));

    const subtotalUI = document.getElementById('cart-subtotal');
    const envioUI = document.getElementById('cart-envio');
    const totalUI = document.getElementById('cart-total-price');
    const rowEnvio = document.getElementById('row-envio');
    const labelEnvio = document.getElementById('envio-label');

    if (subtotalUI) subtotalUI.innerText = `$${subtotal.toFixed(2)}`;

    const metodo = document.querySelector('input[name="delivery_method"]:checked')?.value;

    if (metodo === 'delivery') {
        if (rowEnvio) rowEnvio.style.display = 'flex';

        if (costoEnvioEstimado > 0) {
        if (labelEnvio) labelEnvio.innerText = "Envío Estimado:";
        if (envioUI) envioUI.innerText = `$${costoEnvioEstimado.toFixed(2)}`;
        if (totalUI) totalUI.innerText = `$${(subtotal + costoEnvioEstimado).toFixed(2)}`;
        } else {
        if (labelEnvio) labelEnvio.innerText = "Envío Estimado:";
        if (envioUI) envioUI.innerText = "Selecciona una dirección";
        if (totalUI) totalUI.innerText = `$${subtotal.toFixed(2)}`;
        }
    } else {
        if (rowEnvio) rowEnvio.style.display = 'none';
        if (totalUI) totalUI.innerText = `$${subtotal.toFixed(2)}`;
    }
    }

    /* --- 8. BUSCADOR PREDICTIVO (PHOTON / KOMOOT) --- */
    let predictTimer = null;

    function buscarDireccionPredictiva(query) {
    const container = document.getElementById('predict-suggestions');
    if (!container) return;

    clearTimeout(predictTimer);

    if (!query || query.trim().length < 3) {
        container.style.display = 'none';
        container.innerHTML = '';
        costoEnvioEstimado = 0;
        actualizarTotalesFinancieros();
        return;
    }

    predictTimer = setTimeout(() => {
        const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&bbox=-73.3,0.6,-59.8,12.2&limit=5`;

        fetch(url)
        .then(response => response.json())
        .then(data => {
            container.innerHTML = '';
            if (data && data.features && data.features.length > 0) {
            container.style.display = 'block';
            
            data.features.forEach(feature => {
                const props = feature.properties;
                const coords = feature.geometry.coordinates;

                const nombreLugar = [props.name, props.street, props.city, props.state]
                .filter(Boolean)
                .join(', ');

                if (!nombreLugar) return;

                const item = document.createElement('div');
                item.className = 'predict-item';
                item.innerText = nombreLugar;
                
                item.onclick = () => {
                document.getElementById('manual-address').value = nombreLugar;
                container.style.display = 'none';
                container.innerHTML = '';

                const destLng = coords[0];
                const destLat = coords[1];

                calcularEnvioManualPorCoordenadas(destLat, destLng, nombreLugar);
                };
                
                container.appendChild(item);
            });
            } else {
            container.style.display = 'none';
            }
        })
        .catch(err => {
            console.error("Error en predict:", err);
            container.style.display = 'none';
        });
    }, 350);
    }

    document.getElementById('manual-address')?.addEventListener('input', () => {
    if (costoEnvioEstimado > 0) {
        costoEnvioEstimado = 0;
        actualizarTotalesFinancieros();
    }
    });

    document.addEventListener('click', (e) => {
    const input = document.getElementById('manual-address');
    const container = document.getElementById('predict-suggestions');
    if (input && container && !input.contains(e.target) && !container.contains(e.target)) {
        container.style.display = 'none';
    }
    });

    /* --- 9. REDIRECCIÓN A WHATSAPP --- */
    function obtenerUrlWhatsApp(mensaje) {
    const targetPhone = (typeof TELEFONO_VIDACAO !== 'undefined' && TELEFONO_VIDACAO) ? TELEFONO_VIDACAO : "584120000000";
    return `https://wa.me/${targetPhone}?text=${encodeURIComponent(mensaje)}`;
    }

    function enviarAWhatsApp() {
    if (carrito.length === 0) {
        alert("Selecciona al menos un chocolate.");
        return;
    }

    let subtotal = 0;
    let mensaje = "✦ NUEVO PEDIDO — VIDACAO\n\n";
    mensaje += "¡Hola! Quisiera procesar la compra de mi colección:\n\n";

    carrito.forEach(item => {
        const itemTotal = item.precio * item.cantidad;
        mensaje += `▪ ${item.cantidad}x ${item.nombre} ($${item.precio.toFixed(2)} c/u) = $${itemTotal.toFixed(2)}\n`;
        subtotal += itemTotal;
    });

    mensaje += `\n❖ Subtotal Productos: $${subtotal.toFixed(2)}\n`;

    const metodo = document.querySelector('input[name="delivery_method"]:checked').value;
    
    if (metodo === 'pickup') {
        mensaje += `\n🚚 Método: RETIRO EN PERSONA\n`;
        mensaje += `📍 Lugar: Taller Ciudad Alianza, Guacara.\n`;
        mensaje += `\n❖ TOTAL A PAGAR: $${subtotal.toFixed(2)}\n`;
    } 
    else {
        const tipoLoc = document.querySelector('input[name="location_type"]:checked').value;
        
        if (tipoLoc === 'manual') {
        const direccion = document.getElementById('manual-address').value.trim() || "Por definir con el cliente";
        mensaje += `\n🚚 Método: DELIVERY (Dirección Manual)\n`;
        mensaje += `📍 Destino: ${direccion}\n`;
        if (costoEnvioEstimado > 0) {
            mensaje += `📏 Distancia aprox: ${distanciaGPS_km.toFixed(1)} km\n`;
            mensaje += `🛵 Costo Envío Estimado: $${costoEnvioEstimado.toFixed(2)}\n`;
            mensaje += `\n❖ TOTAL A PAGAR: $${(subtotal + costoEnvioEstimado).toFixed(2)}\n`;
        } else {
            mensaje += `🛵 Costo Envío: A cotizar en el chat\n`;
            mensaje += `\n❖ TOTAL A PAGAR: $${subtotal.toFixed(2)} + Envío\n`;
        }
        } else {
        if (costoEnvioEstimado === 0 || enlaceUbicacionGPS === "") {
            alert("Por favor, haz clic en 'Obtener mi ubicación actual' para calcular tu envío.");
            return;
        }
        mensaje += `\n🚚 Método: DELIVERY (Vía GPS)\n`;
        mensaje += `📍 Mapa: ${enlaceUbicacionGPS}\n`;
        mensaje += `📏 Distancia aprox: ${distanciaGPS_km.toFixed(1)} km\n`;
        mensaje += `🛵 Costo Envío Estimado: $${costoEnvioEstimado.toFixed(2)}\n`;
        mensaje += `\n❖ TOTAL A PAGAR: $${(subtotal + costoEnvioEstimado).toFixed(2)}\n`;
        }
    }

    const giftCheckbox = document.getElementById('gift-checkbox');
    const giftText = document.getElementById('gift-text');
    if (giftCheckbox && giftCheckbox.checked && giftText && giftText.value.trim() !== "") {
        mensaje += `\n[EDICIÓN REGALO]\nMensaje para tarjeta: "${giftText.value.trim()}"\n`;
    }

    mensaje += "\nQuedo a la espera de sus métodos de pago.";

    window.open(obtenerUrlWhatsApp(mensaje), '_blank');
    }

    function enviarFormularioCorporativo(e) {
    if (e) e.preventDefault();

    const nombre = document.getElementById('corp-nombre') ? document.getElementById('corp-nombre').value : '';
    const empresa = document.getElementById('corp-empresa') ? document.getElementById('corp-empresa').value : '';
    const email = document.getElementById('corp-email') ? document.getElementById('corp-email').value : '';
    const telefono = document.getElementById('corp-telefono') ? document.getElementById('corp-telefono').value : '';
    const cantidad = document.getElementById('corp-cantidad') ? document.getElementById('corp-cantidad').value : '';
    const fecha = document.getElementById('corp-fecha') ? document.getElementById('corp-fecha').value : '';
    const mensajeForm = document.getElementById('corp-mensaje') ? document.getElementById('corp-mensaje').value : '';

    let mensaje = "🏛️ SOLICITUD DE EVENTO CORPORATIVO — VIDACAO\n\n";
    mensaje += `▪ Contacto: ${nombre}\n`;
    mensaje += `▪ Empresa: ${empresa}\n`;
    mensaje += `▪ Email: ${email}\n`;
    mensaje += `▪ Teléfono: ${telefono}\n`;
    mensaje += `▪ Cantidad Estimada: ${cantidad} unidades\n`;
    mensaje += `▪ Fecha del Evento: ${fecha}\n\n`;
    mensaje += `📝 Requerimientos Especiales: ${mensajeForm}\n`;

    window.open(obtenerUrlWhatsApp(mensaje), '_blank');
    }