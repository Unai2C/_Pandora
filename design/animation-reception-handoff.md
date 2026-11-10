# Encargo: recepciones naturales de herramientas para Pangea Agents

Trabaja en C:/Users/Imagine To Create/Desktop/dcl/_Pandora.

Necesitamos TRES animaciones nuevas de recepción para el avatar nativo de Decentraland:
- Receive_Axe_emote.glb
- Receive_Pickaxe_emote.glb
- Receive_Sword_emote.glb

Destino: assets/scene/modelos/animaciones/. No sobrescribas archivos existentes sin avisar. No cambies la escena, las texturas, la UI ni los sistemas de combate.

Primero lee src/punchAnimation.ts, src/avatarTools.ts, src/tutorialCinematics.ts y scripts/create-tool-receive.cjs. Inspecciona Hold_Tool_emote.glb y Receive_Tool_emote.glb para reutilizar exactamente el esqueleto, los nombres de huesos y el sistema de agarre. La recepción actual es una referencia técnica, pero SU GESTO SE VE FORZADO: no copies su pose ni sus giros de hombro.

Contexto: Sentinel Core muestra una herramienta flotando A SU LADO, la cámara hace un primer plano y después la herramienta vuela hasta el jugador. El avatar está quieto en el camino mirando al agente. La herramienta real se adjunta por código a la mano derecha; el emote no debe incluir ninguna herramienta, malla de avatar, textura ni collider.

Diseña una recepción de unos 2,6 segundos, una sola vez, a 30 fps:
1. Preparación breve: giro suave de torso y mirada, hombro relajado, codo flexionado. Extiende la mano hacia la herramienta sin sacar el brazo rígido hacia arriba.
2. Recibir: cerrar la mano alrededor del mango; pequeño acompañamiento de muñeca y codo para absorber el peso. La mano izquierda puede acompañar la reacción, sin interferir con el mango.
3. Mostrar: elevar la herramienta a un lado de la cabeza, ligeramente por delante del hombro. Que se vea la herramienta y la cara, sin atravesar cuello, torso o cabeza. Movimiento orgánico de clavícula, hombro, codo y muñeca; evita torsiones extremas.
4. Terminar: bajar suavemente hasta la pose exacta de Hold_Tool_emote.glb. Primera pose compatible con la recepción, última pose compatible con el agarre, sin salto al volver a idle.

Adapta cada gesto al peso y tamaño: espada ligera con control de muñeca; hacha con inercia moderada; pico con más espacio lateral para su cabeza. No uses una única animación idéntica renombrada tres veces. Sin desplazamiento del root, cambios de escala del avatar, vuelo, pies deslizándose ni hombro hiperextendido. Mantén la rotación de agarre consistente con los modelos que ya utiliza avatarTools.ts.

El clip debe ser un emote válido para triggerSceneEmote, sin bucle y con un solo clip por archivo. Entrega también las marcas de tiempo de preparación, contacto/agarre y elevación para sincronizar el lanzamiento. Incluye previsualización frontal y de perfil de cada recepción con la herramienta puesta para validar anatomía, agarre y ausencia de intersecciones.

Antes de entregar, comprueba: todos los huesos existen en el rig de DCL; cero imágenes y cero mallas en los emotes exportados; duración real; root inmóvil; último fotograma coincide con Hold_Tool; no hay herramientas duplicadas. No integres aún cambios de lógica: entrega los tres GLB y un resumen de tiempos para conectarlos al tutorial.

## Sonidos opcionales de mejor calidad
Ya existen dos efectos provisionales sintetizados en assets/sounds/agents/energy-pulse.wav y mechanical-strike.wav. Si puedes generar audio, entrega alternativas nuevas, sin sobrescribirlos:
- Ataque a distancia: pulso energético tecnológico cristalino, amistoso con la estética fantasy sci-fi, carga brevísima y disparo claro; 0,55 s, sin voz, música, zumbido sostenido ni cola larga.
- Ataque cuerpo a cuerpo: golpe mecánico compacto con chispa suave e impacto, 0,35 s, sin voz ni música, sin explosión ni sonido de arma de fuego.
WAV mono PCM 16 bits, 22,05 o 44,1 kHz; ataque rápido, final suave sin clic; volumen moderado, sin saturación. Si no dispones de generación de audio, limita la entrega a las animaciones y dilo claramente.
