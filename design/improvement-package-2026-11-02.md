# Paquete de mejoras — seguimiento

## Aplicado
- Intro y tutorial personales; estado del pueblo compartido por servidor. La transformación recibe una hora de inicio común; clientes que cargan tarde acortan el clip para acabar en el mismo plazo.
- Cambio de árbol en cada nivel para pruebas; cuatro fases en ciclo. El altar se aparta en la tercera fase para dejar las raíces libres.
- Tutorial: al volver al juego, orientar al jugador/cámara hacia el recurso o enemigo mostrado. Recepción en el camino mirando al agente.
- Speech completo durante el fundido. Descenso final completado al segundo 33. Después de E, plano del árbol y regreso directo a juego, sin segunda portada.
- Objetivo en mayúsculas arriba, sin numeración; panel de título/controles/estado de animación eliminado.
- No hay referencias activas a AlienScrapyard en src. Se mantienen los sonidos aportados y se añaden dos ataques sintetizados de agentes.
- Corregido el origen del lanzamiento: sale de la posición lateral exacta de la herramienta, sin salto al iniciar el vuelo.
- Espada: animación derivada retimada a 1,5x, impacto 289 ms y cooldown 850 ms. Original intacto. Las acciones rechazadas por otra animación no mandan daño al servidor.
- Enemigos frenan al alcanzar su alcance y retroceden si el jugador se acerca demasiado. Colliders y barras ajustados al tamaño.
- ON/OFF: conservar la malla saliente hasta que la entrante esté cargada y cambiar ambas en el mismo fotograma.
- Curación y subida personal: anillos animados abiertos sin cilindros ni texturas. Retirados exclusivamente los triángulos de FX_Beam/FX_Column de los agentes, conservando clips y texturas. Copias originales en Documents/Codex/Pangea-backups/agent-columns.
- Entrega: sonido completo de 4,344 s y fade final de 0,65 s, voz independiente de los sonidos de combate; animación de altar retimada a su duración.
- Cada golpe válido da 5 recursos a quien golpea. Una unidad de 1/2/3 golpes produce 5/10/15. Reserva compartida, agotamiento global, regeneración 30 s; tutorial avanza al agotar una unidad.
- Transformación del árbol: rayos radiales y anillos durante la parte central; después, pantalla con nivel de Novaterra y fragmento de canon. Cámara liberada al finalizar la animación. Primer ingreso no reproduce subidas pasadas.
- Al subir de nivel, madera/piedra/fruta/shards y derrotas del pueblo vuelven a cero. Los recursos no entregados de los jugadores se conservan.
- Mejoras aprobadas: +10 vida máxima y +2 daño por nivel de jugador; no se reactivan las antiguas runas, aura ni decisiones de skills.

## Jerarquía de agentes
Se normaliza el cuerpo base a unos 1,7 m de ancho, excluyendo sus efectos visuales al medir. Medianos x1,4 (100 vida, 12 daño), grandes x1,8 (160 vida, 18 daño); pequeños 60 vida, 8 daño. Cada derrota sigue dando exactamente un shard.
- Nivel del pueblo 1: ocho enemigos anteriores y Aegis_Drone, Smiling_Skybot, pequeños.
- Nivel 2: se añaden Aegis_Core, Orbital_Cipher y Pulse_Sentinel, medianos.
- Nivel 3: se añaden Arcane_Data_Core, Aureate_Sentinel, Aethercore_Sentinel y Triad_Sentinel, grandes.
- Sentinel Core sigue siendo el guía amistoso; no pertenece a esta progresión.

## Pendiente de assets / decisión
- Sustituir la recepción genérica por tres recepciones naturales nuevas: encargo en animation-reception-handoff.md. No se ha fingido que existan esos GLB.
- Habilidades nuevas: propuestas únicamente; falta elegir y fijar condiciones. No añadir velocidad de recolección.
- Revisar dentro de Explorer el encuadre exacto del regreso directo, el aspecto de las nuevas ondas y el ritmo de combate. Las pruebas de lógica no sustituyen esa revisión visual ni una sesión con dos clientes reales.

## Propuestas de habilidades, todavía sin activar
- Resonant Strike: tras varios impactos consecutivos con espada, una onda corta empuja ligeramente al agente. Sin cambiar las reservas de recursos.
- Last Light: escudo breve automático al quedar con poca vida, con recarga para evitar activación continua.
- Memory Sense: los shards y agentes cercanos emiten un pulso circular que facilita localizarlos.
- Guardian Bond: pequeña protección cuando varios exploradores combaten juntos; incentivo cooperativo.

Todas evitarían recuperar un menú de tres skills equipables; aún no se asignan niveles ni valores de balance sin elección del dueño.

## Ajuste posterior de aura del árbol
A petición del dueño, restaurado el flujo translúcido anterior de 12 bandas ascendentes. Su centro y el radio real de curación siguen ahora el Root de cada GLB, sin mover árboles ni terreno. Las auras personales continúan usando anillos.

## Recepciones conectadas
Recibidos y conectados Receive_Axe_emote.glb, Receive_Pickaxe_emote.glb y Receive_Sword_emote.glb a sus pasos del tutorial. Cada gesto se reproduce una vez al terminar el lanzamiento; plano del avatar durante 2,6 s más 0,1 s de margen, seguido del plano del objetivo. La recepción genérica anterior ya no se usa en el tutorial.
