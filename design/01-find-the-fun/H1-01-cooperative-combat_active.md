# H1-01 · Crédito por combate cooperativo

- **IF/THEN:** IF dos jugadores golpean válidamente al mismo enemigo sin formar grupo, THEN ambos reciben exactamente un avance de encargo al derrotarlo, independientemente de quién dé el último golpe.
- **Source section:** §5 Social by Design — The repeatable social loop; §3 Core Loop — quest credit.
- **Cheapest killing test:** desktop Explorer, dos clientes reales, tres combates, 5 minutos.
- **Key metric:** combates con reparto correcto de crédito: 3/3; cualquier reparto incorrecto falla.
- **Mobile-sensitive:** yes
- **Tested on:** —
- **Parked:** 2026-09-18

## Brief

- **Criterion (external):** 3/3 combates con exactamente +1 encargo para cada participante y +0 para quien no golpea. Falla con cualquier omisión, duplicado o crédito a un observador. Pasada 1: A inicia, B se suma y remata. Pasada 2: B inicia, A se suma y remata. Pasada 3: A combate solo y B observa.
- **Kill-check (owner-testable):** El propietario puede incorporarse al combate en curso sin grupo ni invitación y distinguir su participación y el avance concedido; si no puede, se rechaza la interacción actual.
- **Rung:** desktop Explorer; la aritmética no demuestra sincronización ni interacción entre clientes.
- **Who tests:** agente para comprobación técnica; propietario con segundo cliente/persona para criterio y percepción. No hay sesión humana realizada.
- **Who launches:** agente prepara y comprueba preview local; propietario abre Explorer desde Creator Hub para el ensayo humano, según encargo de entrega lista para probar.
- **Real:** mensajes cliente/servidor, enemigo compartido, golpes con distancia y cadencia validadas, participación acumulada por encuentro y crédito individual único.
- **Faked:** geometría simple; encargo repetible como contador en memoria; progresión numérica heredada solo como andamiaje, no como balance aprobado.
- **Instrumented:** vida e ID de encuentro, contribución propia, contadores de encargo, participantes y resultado del último combate en pantalla; registro del servidor por derrota.
- **Not building:** tienda, cristales, inventario, guardado, edificios, entregas, habilidades desbloqueables, grupos o invitaciones. No se conecta almacenamiento de AlienScrapyard.
- **Sessions:** tres combates en unos cinco minutos, con dos clientes en el mismo preview. Cambiar quien remata; control de observador en tercera pasada.
- **Task given to the tester:** "Completad vuestros encargos combatiendo al enemigo. En la tercera pasada, una persona observa sin atacar."
- **Collected per session:** ID de encuentro, contador antes/después de ambos, golpes aceptados por persona, último golpe y discrepancias. Captura de ambas pantallas.
- **Briefed:** 2026-09-18, antes de construir.

## Sessions

Pendiente de construcción y smoke técnico. Ningún playtest de dos personas realizado.

## Verdict

Pendiente; experimento activo. Compilar no valida el criterio ni la diversión.
